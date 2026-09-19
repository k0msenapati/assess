from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class CriterionScoreOut(BaseModel):
    id: int
    criterion_id: int
    criterion_name: str
    criterion_description: str
    max_marks: float
    tentative_score: float
    final_score: float
    feedback: str
    evidence_quotes: List[str] = []
    deductions: List[str] = []
    confidence: float = 1.0
    is_overridden: bool = False
    override_reason: Optional[str] = None


class EvaluationOut(BaseModel):
    id: int
    submission_id: int
    status: str
    current_stage: Optional[str] = "completed"
    failed_stage: Optional[str] = None
    error_message: Optional[str] = None
    processing_duration_seconds: Optional[float] = None
    total_score: float
    total_max_score: float
    summary_feedback: str
    strengths: List[str] = []
    improvements: List[str] = []
    evaluated_at: datetime
    reviewed_at: Optional[datetime] = None
    scores: List[CriterionScoreOut] = []


class EvaluationStatusOut(BaseModel):
    submission_id: int
    evaluation_id: Optional[int] = None
    status: str
    evaluation_status: Optional[str] = None
    current_stage: Optional[str] = None
    failed_stage: Optional[str] = None
    error_message: Optional[str] = None
    processing_duration_seconds: Optional[float] = None


class EvaluationHistoryOut(BaseModel):
    id: int
    evaluation_id: int
    submission_id: int
    version: int
    status: str
    total_score: float
    total_max_score: float
    summary_feedback: str
    scores_snapshot: List[Dict[str, Any]] = []
    created_at: datetime
    created_by: Optional[int] = None
    action_note: str


class ScoreOverrideItem(BaseModel):
    criterion_id: int
    final_score: float
    feedback: Optional[str] = None
    override_reason: Optional[str] = None


class EvaluationReviewRequest(BaseModel):
    summary_feedback: Optional[str] = None
    overrides: List[ScoreOverrideItem] = []
    finalize: bool = True


class MetricsOut(BaseModel):
    total_evaluations: int
    finalized_count: int
    tentative_count: int
    average_score_pct: float
    rubric_coverage_pct: float
    score_agreement_mae: float
    overridden_criterion_count: int
    retrieval_quality_avg_similarity: float = 0.85
    feedback_quality_evidence_pct: float = 100.0
    prompt_stability_avg_confidence: float = 0.90
    average_processing_duration_seconds: float = 0.0
    recent_evaluations: List[Dict[str, Any]] = []
