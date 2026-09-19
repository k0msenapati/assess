from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class SubmissionStatus:
    SUBMITTED = "submitted"
    EVALUATING = "evaluating"
    TENTATIVE = "tentative"
    FINALIZED = "finalized"
    FAILED = "failed"


class Submission(SQLModel, table=True):
    __tablename__ = "submissions"
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(foreign_key="assignments.id")
    student_id: int = Field(foreign_key="users.id")
    file_name: str
    file_path: str
    file_type: str
    file_size_bytes: int
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default=SubmissionStatus.SUBMITTED)
