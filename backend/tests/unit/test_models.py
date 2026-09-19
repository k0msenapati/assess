from app.models.user import User, UserRole
from app.models.assignment import Assignment, RubricCriterion
from app.models.submission import Submission, SubmissionStatus
from app.models.evaluation import Evaluation, CriterionScore, EvaluationHistory
from app.models.system_config import SystemConfig


def test_user_roles_and_defaults():
    """FR-01, FR-02: Authentication & roles (Student, Professor, Administrator)"""
    assert UserRole.STUDENT == "student"
    assert UserRole.PROFESSOR == "professor"
    assert UserRole.ADMIN == "admin"

    user = User(
        username="test_user",
        email="test@univ.edu",
        role=UserRole.STUDENT,
        hashed_password="hashed_pwd",
    )
    assert user.username == "test_user"
    assert user.role == "student"
    assert user.created_at is not None


def test_assignment_and_rubric_criterion():
    """FR-04, FR-06, NFR-19: Assignment metadata and Rubric criteria requirements"""
    asgt = Assignment(
        title="Algorithms Project 1",
        description="Implement Red-Black Tree",
        allowed_types="py,pdf",
        max_file_size_mb=10,
        created_by=1,
    )
    assert asgt.title == "Algorithms Project 1"
    assert asgt.max_file_size_mb == 10
    assert "pdf" in asgt.allowed_types

    crit = RubricCriterion(
        assignment_id=1,
        name="Invariant Maintenance",
        description="Tree adheres to red-black properties after insertion and rotation",
        max_marks=10.0,
        weight=0.5,
    )
    assert crit.name == "Invariant Maintenance"
    assert crit.max_marks == 10.0
    assert crit.weight == 0.5


def test_submission_model_and_statuses():
    """FR-08, FR-10, FR-26: Submission association & processing states"""
    assert SubmissionStatus.SUBMITTED == "submitted"
    assert SubmissionStatus.EVALUATING == "evaluating"
    assert SubmissionStatus.TENTATIVE == "tentative"
    assert SubmissionStatus.FINALIZED == "finalized"
    assert SubmissionStatus.FAILED == "failed"

    sub = Submission(
        assignment_id=1,
        student_id=2,
        file_name="solution.py",
        file_path="/tmp/solution.py",
        file_type="py",
        file_size_bytes=2048,
        status=SubmissionStatus.SUBMITTED,
    )
    assert sub.assignment_id == 1
    assert sub.student_id == 2
    assert sub.status == "submitted"


def test_evaluation_model_tracking_and_history():
    """FR-16, FR-17, FR-22, FR-24, FR-27, NFR-05, NFR-22: AI Tentative vs Final, Stage Failure, History Audit"""
    ev = Evaluation(
        submission_id=10,
        status="tentative",
        current_stage="evaluate_criteria",
        failed_stage=None,
        error_message=None,
        processing_duration_seconds=1.45,
        total_score=8.5,
        total_max_score=10.0,
        summary_feedback="Solid code structure",
    )
    assert ev.status == "tentative"
    assert ev.current_stage == "evaluate_criteria"
    assert ev.processing_duration_seconds == 1.45

    score = CriterionScore(
        evaluation_id=1,
        criterion_id=5,
        tentative_score=8.5,
        final_score=8.5,
        feedback="Well implemented",
        evidence_quotes_json='["line 10: def insert(self)"]',
        deductions_json="[]",
        confidence=0.95,
        is_overridden=False,
    )
    assert score.tentative_score == 8.5
    assert score.is_overridden is False

    hist = EvaluationHistory(
        evaluation_id=1,
        submission_id=10,
        version=1,
        status="tentative",
        total_score=8.5,
        total_max_score=10.0,
        summary_feedback="Solid code structure",
        scores_snapshot_json="[]",
        action_note="AI Tentative Evaluation",
    )
    assert hist.version == 1
    assert hist.action_note == "AI Tentative Evaluation"


def test_system_config_model():
    """FR-25: System configuration model for Administrator"""
    cfg = SystemConfig(
        key="max_upload_size_mb",
        value="25",
        description="Global maximum upload size in megabytes",
    )
    assert cfg.key == "max_upload_size_mb"
    assert cfg.value == "25"
