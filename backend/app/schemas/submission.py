from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class SubmissionOut(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_username: Optional[str] = None
    assignment_title: Optional[str] = None
    file_name: str
    file_type: str
    file_size_bytes: int
    submitted_at: datetime
    status: str
    evaluation_id: Optional[int] = None
    total_score: Optional[float] = None
    total_max_score: Optional[float] = None


class SubmissionContentOut(BaseModel):
    id: int
    file_name: str
    file_type: str
    content: str
