from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.submissions import router as submissions_router
from app.api.v1.evaluations import router as evaluations_router
from app.api.v1.metrics import router as metrics_router
from app.api.v1.admin import router as admin_router

api_v1_router = APIRouter()
api_v1_router.include_router(auth_router)
api_v1_router.include_router(assignments_router)
api_v1_router.include_router(submissions_router)
api_v1_router.include_router(evaluations_router)
api_v1_router.include_router(metrics_router)
api_v1_router.include_router(admin_router)
