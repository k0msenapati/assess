from sqlmodel import Session
from app.models.submission import Submission, SubmissionStatus
from app.models.assignment import Assignment, RubricCriterion
from app.repositories.submission import submission_repo
from app.repositories.assignment import assignment_repo
from app.services.evaluation_service import run_submission_evaluation


def test_stage_failure_detection_and_recording(session: Session):
    """
    FR-27, NFR-04, NFR-20:
    Stage failure detection and reporting without silent corruption.
    When a non-existent/corrupt submission file is evaluated, the system
    must record the stage failure and set status to 'failed'.
    """
    # 1. Setup assignment and criteria
    asgt = Assignment(
        title="Corrupted File Test Assignment",
        description="Testing failure handling",
        allowed_types="py",
        max_file_size_mb=5,
        created_by=1,
    )
    assignment_repo.create(session, asgt)

    crit = RubricCriterion(
        assignment_id=asgt.id,  # type: ignore
        name="Functionality",
        description="Test description",
        max_marks=10.0,
    )
    assignment_repo.add_criterion(session, crit)

    # 2. Setup submission with nonexistent file path
    sub = Submission(
        assignment_id=asgt.id,  # type: ignore
        student_id=2,
        file_name="missing_file.py",
        file_path="/invalid/nonexistent/path/missing_file.py",
        file_type="py",
        file_size_bytes=100,
        status=SubmissionStatus.SUBMITTED,
    )
    submission_repo.create(session, sub)

    # 3. Trigger evaluation - must not crash the process
    ev = run_submission_evaluation(session, sub.id)  # type: ignore

    # 4. Verify failure is detected and recorded
    assert ev.status == "failed"
    assert ev.failed_stage is not None
    assert ev.error_message is not None
    assert len(ev.error_message) > 0

    # 5. Verify submission status is FAILED
    updated_sub = submission_repo.get(session, sub.id)  # type: ignore
    assert updated_sub is not None
    assert updated_sub.status == SubmissionStatus.FAILED
