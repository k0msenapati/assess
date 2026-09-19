from app.models.user import User, UserRole
from app.models.assignment import Assignment, RubricCriterion
from app.models.submission import Submission, SubmissionStatus
from app.models.evaluation import Evaluation, CriterionScore, EvaluationHistory
from app.models.system_config import SystemConfig

__all__ = [
    "User",
    "UserRole",
    "Assignment",
    "RubricCriterion",
    "Submission",
    "SubmissionStatus",
    "Evaluation",
    "CriterionScore",
    "EvaluationHistory",
    "SystemConfig",
]
