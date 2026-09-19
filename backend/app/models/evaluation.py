from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class Evaluation(SQLModel, table=True):
    __tablename__ = "evaluations"
    id: Optional[int] = Field(default=None, primary_key=True)
    submission_id: int = Field(foreign_key="submissions.id", unique=True)
    status: str = Field(default="tentative")
    current_stage: Optional[str] = Field(default="completed")
    failed_stage: Optional[str] = None
    error_message: Optional[str] = None
    processing_duration_seconds: Optional[float] = None
    total_score: float = 0.0
    total_max_score: float = 0.0
    summary_feedback: str = ""
    strengths_json: str = "[]"
    improvements_json: str = "[]"
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[int] = Field(default=None, foreign_key="users.id")


class CriterionScore(SQLModel, table=True):
    __tablename__ = "criterion_scores"
    id: Optional[int] = Field(default=None, primary_key=True)
    evaluation_id: int = Field(foreign_key="evaluations.id")
    criterion_id: int = Field(foreign_key="rubric_criteria.id")
    tentative_score: float
    final_score: float
    feedback: str
    evidence_quotes_json: str = "[]"
    deductions_json: str = "[]"
    confidence: float = 1.0
    is_overridden: bool = False
    override_reason: Optional[str] = None


class EvaluationHistory(SQLModel, table=True):
    __tablename__ = "evaluation_history"
    id: Optional[int] = Field(default=None, primary_key=True)
    evaluation_id: int = Field(foreign_key="evaluations.id", index=True)
    submission_id: int = Field(foreign_key="submissions.id", index=True)
    version: int = Field(default=1)
    status: str
    total_score: float
    total_max_score: float
    summary_feedback: str = ""
    scores_snapshot_json: str = "[]"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[int] = Field(default=None, foreign_key="users.id")
    action_note: str = "AI Evaluation"
