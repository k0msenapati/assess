import json
import time
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlmodel import Session
from app.models.evaluation import Evaluation, CriterionScore, EvaluationHistory
from app.models.submission import SubmissionStatus
from app.repositories.submission import submission_repo
from app.repositories.assignment import assignment_repo
from app.repositories.evaluation import evaluation_repo
from app.services.agent.graph import execute_evaluation
from app.services.agent.state import EvaluationState


def run_submission_evaluation(session: Session, submission_id: int) -> Evaluation:
    sub = submission_repo.get(session, submission_id)
    if not sub:
        raise ValueError("Submission not found")

    criteria = assignment_repo.get_criteria(session, sub.assignment_id)
    if not criteria:
        raise ValueError("No rubric criteria defined for this assignment")

    sub.status = SubmissionStatus.EVALUATING
    submission_repo.update(session, sub)

    existing_eval = evaluation_repo.get_by_submission(session, sub.id)  # type: ignore
    if not existing_eval:
        evaluation = Evaluation(
            submission_id=sub.id,  # type: ignore
            status="evaluating",
            current_stage="extract_and_chunk",
        )
        evaluation_repo.create(session, evaluation)
    else:
        evaluation = existing_eval
        evaluation.status = "evaluating"
        evaluation.current_stage = "extract_and_chunk"
        evaluation_repo.update(session, evaluation)

    criteria_dicts = [
        {
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "max_marks": c.max_marks,
            "weight": c.weight,
        }
        for c in criteria
    ]

    initial_state: EvaluationState = {
        "submission_id": sub.id,  # type: ignore
        "assignment_id": sub.assignment_id,
        "file_path": sub.file_path,
        "file_type": sub.file_type,
        "criteria": criteria_dicts,
    }

    start_time = time.perf_counter()

    try:
        workflow_result = execute_evaluation(initial_state)
    except Exception as exc:
        # Failure in workflow execution
        duration = time.perf_counter() - start_time
        sub.status = SubmissionStatus.FAILED
        submission_repo.update(session, sub)

        evaluation.status = "failed"
        evaluation.failed_stage = "workflow"
        evaluation.error_message = str(exc)
        evaluation.processing_duration_seconds = round(duration, 2)
        evaluation_repo.update(session, evaluation)
        return evaluation

    duration = time.perf_counter() - start_time

    # Check if any stage detected a failure
    if workflow_result.get("status") == "failed" or workflow_result.get("errors"):
        sub.status = SubmissionStatus.FAILED
        submission_repo.update(session, sub)

        evaluation.status = "failed"
        evaluation.failed_stage = workflow_result.get("current_stage", "unknown")
        evaluation.error_message = "; ".join(
            workflow_result.get("errors", ["Stage evaluation error"])
        )
        evaluation.processing_duration_seconds = round(duration, 2)
        evaluation_repo.update(session, evaluation)
        return evaluation

    # Successful evaluation: clean up old scores if re-evaluating
    old_scores = evaluation_repo.get_scores(session, evaluation.id)  # type: ignore
    for s in old_scores:
        session.delete(s)
    session.commit()

    evaluation.status = "tentative"
    evaluation.current_stage = "completed"
    evaluation.failed_stage = None
    evaluation.error_message = None
    evaluation.processing_duration_seconds = round(duration, 2)
    evaluation.total_score = workflow_result.get("total_score", 0.0)
    evaluation.total_max_score = workflow_result.get("total_max_score", 0.0)
    evaluation.summary_feedback = workflow_result.get("summary_feedback", "")
    evaluation.strengths_json = json.dumps(workflow_result.get("strengths", []))
    evaluation.improvements_json = json.dumps(workflow_result.get("improvements", []))
    evaluation.evaluated_at = datetime.now(timezone.utc)

    evaluation_repo.update(session, evaluation)

    created_scores = []
    for item in workflow_result.get("criterion_evaluations", []):
        score_obj = CriterionScore(
            evaluation_id=evaluation.id,  # type: ignore
            criterion_id=item["criterion_id"],
            tentative_score=item["score"],
            final_score=item["score"],
            feedback=item["feedback"],
            evidence_quotes_json=json.dumps(item.get("evidence_quotes", [])),
            deductions_json=json.dumps(item.get("deductions", [])),
            confidence=item.get("confidence", 1.0),
            is_overridden=False,
        )
        saved_score = evaluation_repo.save_score(session, score_obj)
        created_scores.append(saved_score)

    sub.status = SubmissionStatus.TENTATIVE
    submission_repo.update(session, sub)

    # Record history snapshot version 1 (AI Draft)
    existing_history = evaluation_repo.get_history(session, evaluation.id)  # type: ignore
    version_num = len(existing_history) + 1
    scores_snapshot = [
        {
            "criterion_id": s.criterion_id,
            "tentative_score": s.tentative_score,
            "final_score": s.final_score,
            "feedback": s.feedback,
            "is_overridden": s.is_overridden,
        }
        for s in created_scores
    ]
    history_entry = EvaluationHistory(
        evaluation_id=evaluation.id,  # type: ignore
        submission_id=sub.id,  # type: ignore
        version=version_num,
        status="tentative",
        total_score=evaluation.total_score,
        total_max_score=evaluation.total_max_score,
        summary_feedback=evaluation.summary_feedback,
        scores_snapshot_json=json.dumps(scores_snapshot),
        action_note="AI Tentative Evaluation",
    )
    evaluation_repo.save_history(session, history_entry)

    return evaluation


def get_evaluation_detail(
    session: Session, evaluation_id: int
) -> Tuple[Optional[Evaluation], List[CriterionScore]]:
    evaluation = evaluation_repo.get(session, evaluation_id)
    if not evaluation:
        return None, []
    scores = evaluation_repo.get_scores(session, evaluation.id)  # type: ignore
    return evaluation, scores


def get_evaluation_by_submission(
    session: Session, submission_id: int
) -> Tuple[Optional[Evaluation], List[CriterionScore]]:
    evaluation = evaluation_repo.get_by_submission(session, submission_id)
    if not evaluation:
        return None, []
    scores = evaluation_repo.get_scores(session, evaluation.id)  # type: ignore
    return evaluation, scores


def apply_evaluation_review(
    session: Session,
    evaluation_id: int,
    reviewer_id: int,
    summary_feedback: Optional[str],
    overrides: List[Dict[str, Any]],
    finalize: bool,
) -> Evaluation:
    evaluation = evaluation_repo.get(session, evaluation_id)
    if not evaluation:
        raise ValueError("Evaluation not found")

    if summary_feedback is not None:
        evaluation.summary_feedback = summary_feedback

    scores = evaluation_repo.get_scores(session, evaluation_id)
    scores_by_criterion = {s.criterion_id: s for s in scores}

    has_overrides = False
    for ov in overrides:
        crit_id = ov["criterion_id"]
        if crit_id in scores_by_criterion:
            s_obj = scores_by_criterion[crit_id]
            s_obj.final_score = ov["final_score"]
            if ov.get("feedback"):
                s_obj.feedback = ov["feedback"]
            s_obj.is_overridden = True
            s_obj.override_reason = ov.get("override_reason", "Instructor score adjustment")
            evaluation_repo.save_score(session, s_obj)
            has_overrides = True

    # Recalculate total final score
    updated_scores = evaluation_repo.get_scores(session, evaluation_id)
    evaluation.total_score = round(sum(s.final_score for s in updated_scores), 2)
    evaluation.reviewed_at = datetime.now(timezone.utc)
    evaluation.reviewer_id = reviewer_id

    if finalize:
        evaluation.status = "finalized"
        sub = submission_repo.get(session, evaluation.submission_id)
        if sub:
            sub.status = SubmissionStatus.FINALIZED
            submission_repo.update(session, sub)

    saved_eval = evaluation_repo.update(session, evaluation)

    # Record history snapshot for faculty review / final release
    existing_history = evaluation_repo.get_history(session, evaluation_id)
    version_num = len(existing_history) + 1
    scores_snapshot = [
        {
            "criterion_id": s.criterion_id,
            "tentative_score": s.tentative_score,
            "final_score": s.final_score,
            "feedback": s.feedback,
            "is_overridden": s.is_overridden,
            "override_reason": s.override_reason,
        }
        for s in updated_scores
    ]
    action_note = (
        "Professor Review & Finalize"
        if finalize
        else ("Professor Review (Adjusted)" if has_overrides else "Professor Review")
    )
    history_entry = EvaluationHistory(
        evaluation_id=evaluation.id,  # type: ignore
        submission_id=evaluation.submission_id,
        version=version_num,
        status=evaluation.status,
        total_score=evaluation.total_score,
        total_max_score=evaluation.total_max_score,
        summary_feedback=evaluation.summary_feedback,
        scores_snapshot_json=json.dumps(scores_snapshot),
        created_by=reviewer_id,
        action_note=action_note,
    )
    evaluation_repo.save_history(session, history_entry)

    return saved_eval


def get_evaluation_history(session: Session, evaluation_id: int) -> List[EvaluationHistory]:
    return evaluation_repo.get_history(session, evaluation_id)


def get_processing_status(session: Session, submission_id: int) -> Dict[str, Any]:
    sub = submission_repo.get(session, submission_id)
    if not sub:
        return {"status": "not_found"}

    evaluation = evaluation_repo.get_by_submission(session, submission_id)
    if not evaluation:
        return {
            "submission_id": submission_id,
            "status": sub.status,
            "current_stage": "queued"
            if sub.status == SubmissionStatus.EVALUATING
            else "not_started",
            "failed_stage": None,
            "error_message": None,
            "processing_duration_seconds": None,
        }

    return {
        "submission_id": submission_id,
        "evaluation_id": evaluation.id,
        "status": sub.status,
        "evaluation_status": evaluation.status,
        "current_stage": evaluation.current_stage,
        "failed_stage": evaluation.failed_stage,
        "error_message": evaluation.error_message,
        "processing_duration_seconds": evaluation.processing_duration_seconds,
    }
