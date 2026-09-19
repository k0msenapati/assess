import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlmodel import Session
from app.api.deps import get_db, get_current_user, require_professor
from app.models.user import User, UserRole
from app.models.assignment import RubricCriterion
from app.models.submission import SubmissionStatus
from app.models.evaluation import Evaluation
from app.schemas.evaluation import (
    EvaluationOut,
    CriterionScoreOut,
    EvaluationReviewRequest,
    EvaluationStatusOut,
    EvaluationHistoryOut,
)
from app.services.evaluation_service import (
    run_submission_evaluation,
    get_evaluation_detail,
    get_evaluation_by_submission,
    apply_evaluation_review,
    get_evaluation_history,
    get_processing_status,
)
from app.repositories.submission import submission_repo
from app.repositories.assignment import assignment_repo
from app.repositories.evaluation import evaluation_repo

router = APIRouter(prefix="/evaluations", tags=["evaluations"])


def _format_evaluation_response(session: Session, evaluation, scores) -> EvaluationOut:
    scores_out = []
    for s in scores:
        crit = session.get(RubricCriterion, s.criterion_id)
        crit_name = crit.name if crit else f"Criterion {s.criterion_id}"
        crit_desc = crit.description if crit else ""
        max_m = crit.max_marks if crit else 10.0

        scores_out.append(
            CriterionScoreOut(
                id=s.id,
                criterion_id=s.criterion_id,
                criterion_name=crit_name,
                criterion_description=crit_desc,
                max_marks=max_m,
                tentative_score=s.tentative_score,
                final_score=s.final_score,
                feedback=s.feedback,
                evidence_quotes=json.loads(s.evidence_quotes_json or "[]"),
                deductions=json.loads(s.deductions_json or "[]"),
                confidence=s.confidence,
                is_overridden=s.is_overridden,
                override_reason=s.override_reason,
            )
        )

    return EvaluationOut(
        id=evaluation.id,
        submission_id=evaluation.submission_id,
        status=evaluation.status,
        current_stage=getattr(evaluation, "current_stage", "completed") or "completed",
        failed_stage=getattr(evaluation, "failed_stage", None),
        error_message=getattr(evaluation, "error_message", None),
        processing_duration_seconds=getattr(evaluation, "processing_duration_seconds", None),
        total_score=evaluation.total_score,
        total_max_score=evaluation.total_max_score,
        summary_feedback=evaluation.summary_feedback,
        strengths=json.loads(evaluation.strengths_json or "[]"),
        improvements=json.loads(evaluation.improvements_json or "[]"),
        evaluated_at=evaluation.evaluated_at,
        reviewed_at=evaluation.reviewed_at,
        scores=scores_out,
    )


def _run_bg_evaluation(submission_id: int):
    from app.core.db import get_session

    for session in get_session():
        run_submission_evaluation(session, submission_id)
        break


@router.post("/run/{submission_id}", response_model=EvaluationOut)
def trigger_evaluation(
    submission_id: int,
    background_tasks: BackgroundTasks,
    async_mode: bool = Query(default=False),
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    sub = submission_repo.get(session, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    asgt = assignment_repo.get(session, sub.assignment_id)
    if current_user.role != UserRole.ADMIN and asgt and asgt.created_by != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to evaluate submissions for this assignment",
        )

    if async_mode:
        sub.status = SubmissionStatus.EVALUATING
        submission_repo.update(session, sub)
        existing = evaluation_repo.get_by_submission(session, sub.id)  # type: ignore
        if not existing:
            eval_obj = Evaluation(
                submission_id=sub.id,  # type: ignore
                status="evaluating",
                current_stage="queued",
            )
            evaluation_repo.create(session, eval_obj)
        else:
            eval_obj = existing
            eval_obj.status = "evaluating"
            eval_obj.current_stage = "queued"
            evaluation_repo.update(session, eval_obj)

        background_tasks.add_task(_run_bg_evaluation, submission_id)
        return _format_evaluation_response(session, eval_obj, [])

    try:
        evaluation = run_submission_evaluation(session, submission_id)
        _, scores = get_evaluation_detail(session, evaluation.id)  # type: ignore
        return _format_evaluation_response(session, evaluation, scores)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status/{submission_id}", response_model=EvaluationStatusOut)
def get_status(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    sub = submission_repo.get(session, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    asgt = assignment_repo.get(session, sub.assignment_id)
    if current_user.role == UserRole.STUDENT and sub.student_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to view status of this submission"
        )
    if (
        current_user.role == UserRole.PROFESSOR
        and asgt
        and asgt.created_by != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this submission")

    status_data = get_processing_status(session, submission_id)
    return EvaluationStatusOut(**status_data)


@router.get("/submission/{submission_id}", response_model=EvaluationOut)
def get_by_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    sub = submission_repo.get(session, submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")

    asgt = assignment_repo.get(session, sub.assignment_id)
    evaluation, scores = get_evaluation_by_submission(session, submission_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found for this submission")

    # If student is viewing: ensure submission is their own AND evaluation is finalized
    if current_user.role == UserRole.STUDENT:
        if sub.student_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view another student's evaluation",
            )
        if evaluation.status != "finalized":
            raise HTTPException(status_code=403, detail="Evaluation is pending professor review")

    # If professor is viewing: ensure authorized
    if (
        current_user.role == UserRole.PROFESSOR
        and asgt
        and asgt.created_by != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this evaluation")

    return _format_evaluation_response(session, evaluation, scores)


@router.get("/{evaluation_id}", response_model=EvaluationOut)
def get_one(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    evaluation, scores = get_evaluation_detail(session, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    sub = submission_repo.get(session, evaluation.submission_id)
    asgt = assignment_repo.get(session, sub.assignment_id) if sub else None

    if current_user.role == UserRole.STUDENT:
        if not sub or sub.student_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view another student's evaluation",
            )
        if evaluation.status != "finalized":
            raise HTTPException(status_code=403, detail="Evaluation is pending professor review")

    if (
        current_user.role == UserRole.PROFESSOR
        and asgt
        and asgt.created_by != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this evaluation")

    return _format_evaluation_response(session, evaluation, scores)


@router.get("/{evaluation_id}/history", response_model=List[EvaluationHistoryOut])
def get_history(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    evaluation = evaluation_repo.get(session, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    sub = submission_repo.get(session, evaluation.submission_id)
    asgt = assignment_repo.get(session, sub.assignment_id) if sub else None

    if current_user.role == UserRole.STUDENT:
        if not sub or sub.student_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="Not authorized to view history for this evaluation",
            )
        if evaluation.status != "finalized":
            raise HTTPException(status_code=403, detail="Evaluation is pending professor review")

    if (
        current_user.role == UserRole.PROFESSOR
        and asgt
        and asgt.created_by != current_user.id
        and current_user.role != UserRole.ADMIN
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this evaluation")

    histories = get_evaluation_history(session, evaluation_id)
    return [
        EvaluationHistoryOut(
            id=h.id,  # type: ignore
            evaluation_id=h.evaluation_id,
            submission_id=h.submission_id,
            version=h.version,
            status=h.status,
            total_score=h.total_score,
            total_max_score=h.total_max_score,
            summary_feedback=h.summary_feedback,
            scores_snapshot=json.loads(h.scores_snapshot_json or "[]"),
            created_at=h.created_at,
            created_by=h.created_by,
            action_note=h.action_note,
        )
        for h in histories
    ]


@router.post("/{evaluation_id}/review", response_model=EvaluationOut)
def review_evaluation(
    evaluation_id: int,
    req: EvaluationReviewRequest,
    current_user: User = Depends(require_professor),
    session: Session = Depends(get_db),
):
    evaluation = evaluation_repo.get(session, evaluation_id)
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")

    sub = submission_repo.get(session, evaluation.submission_id)
    asgt = assignment_repo.get(session, sub.assignment_id) if sub else None
    if current_user.role != UserRole.ADMIN and asgt and asgt.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this evaluation")

    try:
        overrides_data = [o.model_dump() for o in req.overrides]
        evaluation = apply_evaluation_review(
            session=session,
            evaluation_id=evaluation_id,
            reviewer_id=current_user.id,  # type: ignore
            summary_feedback=req.summary_feedback,
            overrides=overrides_data,
            finalize=req.finalize,
        )
        _, scores = get_evaluation_detail(session, evaluation.id)  # type: ignore
        return _format_evaluation_response(session, evaluation, scores)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
