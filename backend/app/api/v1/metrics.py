from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.api.deps import get_db, require_professor
from app.models.user import User, UserRole
from app.schemas.evaluation import MetricsOut
from app.services.metrics_service import compute_evaluation_metrics

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("", response_model=MetricsOut)
def get_metrics(
    current_user: User = Depends(require_professor), session: Session = Depends(get_db)
):
    # Professional RBAC scoping:
    # If a Professor calls /metrics, scope strictly to courses created by that professor.
    # Administrators receive system-wide metrics across all courses.
    professor_id = current_user.id if current_user.role == UserRole.PROFESSOR else None
    data = compute_evaluation_metrics(session, professor_id=professor_id)
    return MetricsOut(**data)
