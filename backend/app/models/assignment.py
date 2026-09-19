from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class Assignment(SQLModel, table=True):
    __tablename__ = "assignments"
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    description: str
    allowed_types: str = "pdf,py,java,cpp,c,js,ts,txt"
    max_file_size_mb: int = 15
    due_date: Optional[datetime] = None
    created_by: int = Field(foreign_key="users.id")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class RubricCriterion(SQLModel, table=True):
    __tablename__ = "rubric_criteria"
    id: Optional[int] = Field(default=None, primary_key=True)
    assignment_id: int = Field(foreign_key="assignments.id")
    name: str
    description: str
    max_marks: float
    weight: float = 1.0
    levels_json: str = "[]"
