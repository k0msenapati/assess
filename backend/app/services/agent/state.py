from typing import TypedDict, List, Dict, Any


class EvaluationState(TypedDict, total=False):
    submission_id: int
    assignment_id: int
    file_path: str
    file_type: str
    criteria: List[Dict[str, Any]]
    extracted_text: str
    chunks: List[Dict[str, Any]]
    retrieved_contexts: Dict[int, List[Dict[str, Any]]]
    criterion_evaluations: List[Dict[str, Any]]
    total_score: float
    total_max_score: float
    summary_feedback: str
    strengths: List[str]
    improvements: List[str]
    status: str
    errors: List[str]
