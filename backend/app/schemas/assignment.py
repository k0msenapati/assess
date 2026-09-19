from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class RubricCriterionCreate(BaseModel):
    name: str
    description: str
    max_marks: float
    weight: float = 1.0
    levels_json: str = "[]"


class RubricCriterionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    max_marks: Optional[float] = None
    weight: Optional[float] = None
    levels_json: Optional[str] = None


class RubricCriterionOut(RubricCriterionCreate):
    id: int
    assignment_id: int


class AssignmentCreate(BaseModel):
    title: str
    description: str
    allowed_types: str = "pdf,py,java,cpp,c,js,ts,txt"
    max_file_size_mb: int = 15
    due_date: Optional[datetime] = None
    rubric: List[RubricCriterionCreate] = []


class AssignmentOut(BaseModel):
    id: int
    title: str
    description: str
    allowed_types: str
    max_file_size_mb: int
    due_date: Optional[datetime]
    created_by: int
    creator_username: Optional[str] = None
    created_at: datetime
    criteria_count: int = 0
    submission_count: int = 0
    student_submission_id: Optional[int] = None
    student_submission_status: Optional[str] = None


class AssignmentDetailOut(AssignmentOut):
    rubric: List[RubricCriterionOut] = []
