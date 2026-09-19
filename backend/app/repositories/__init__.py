from app.repositories.base import BaseRepository
from app.repositories.user import user_repo, UserRepository
from app.repositories.assignment import assignment_repo, AssignmentRepository
from app.repositories.submission import submission_repo, SubmissionRepository
from app.repositories.evaluation import evaluation_repo, EvaluationRepository
from app.repositories.system_config import system_config_repo, SystemConfigRepository

__all__ = [
    "BaseRepository",
    "user_repo",
    "UserRepository",
    "assignment_repo",
    "AssignmentRepository",
    "submission_repo",
    "SubmissionRepository",
    "evaluation_repo",
    "EvaluationRepository",
    "system_config_repo",
    "SystemConfigRepository",
]
