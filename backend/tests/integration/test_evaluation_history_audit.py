import os
import tempfile
import json
from sqlmodel import Session
from app.models.submission import Submission, SubmissionStatus
from app.models.assignment import Assignment, RubricCriterion
from app.repositories.submission import submission_repo
from app.repositories.assignment import assignment_repo
from app.services.evaluation_service import (
    run_submission_evaluation,
    apply_evaluation_review,
    get_evaluation_history,
)


def test_evaluation_history_audit_trail(session: Session):
    """
    FR-24, NFR-22:
    Store evaluation history and audit trail distinguishing AI draft from professor adjustments.
    """
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write("def solve():\n    return True\n")
        f_path = f.name

    try:
        asgt = Assignment(
            title="Audit Test Assignment",
            description="Audit testing",
            allowed_types="py",
            max_file_size_mb=5,
            created_by=1,
        )
        assignment_repo.create(session, asgt)

        crit = RubricCriterion(
            assignment_id=asgt.id,  # type: ignore
            name="Logic",
            description="Logic validity",
            max_marks=10.0,
        )
        assignment_repo.add_criterion(session, crit)

        sub = Submission(
            assignment_id=asgt.id,  # type: ignore
            student_id=2,
            file_name="solve.py",
            file_path=f_path,
            file_type="py",
            file_size_bytes=30,
            status=SubmissionStatus.SUBMITTED,
        )
        submission_repo.create(session, sub)

        # 1. Run initial AI evaluation -> Version 1 recorded
        ev = run_submission_evaluation(session, sub.id)  # type: ignore
        assert ev.status == "tentative"

        history_v1 = get_evaluation_history(session, ev.id)  # type: ignore
        assert len(history_v1) == 1
        assert history_v1[0].version == 1
        assert history_v1[0].action_note == "AI Tentative Evaluation"
        assert history_v1[0].status == "tentative"

        # 2. Professor overrides score -> Version 2 recorded
        updated_ev = apply_evaluation_review(
            session=session,
            evaluation_id=ev.id,  # type: ignore
            reviewer_id=1,
            summary_feedback="Professor approved with slight curve.",
            overrides=[
                {
                    "criterion_id": crit.id,
                    "final_score": 9.0,
                    "feedback": "Well justified logic.",
                    "override_reason": "Clean code styling",
                }
            ],
            finalize=True,
        )
        assert updated_ev.status == "finalized"

        history_all = get_evaluation_history(session, ev.id)  # type: ignore
        assert len(history_all) == 2
        # History is ordered descending by version
        v2 = history_all[0]
        v1 = history_all[1]

        assert v2.version == 2
        assert v2.status == "finalized"
        assert v2.created_by == 1
        assert "Professor Review" in v2.action_note

        assert v1.version == 1
        assert v1.status == "tentative"

        # Distinguishable snapshots
        scores_v2 = json.loads(v2.scores_snapshot_json)
        assert scores_v2[0]["final_score"] == 9.0
        assert scores_v2[0]["is_overridden"] is True

    finally:
        if os.path.exists(f_path):
            os.remove(f_path)
