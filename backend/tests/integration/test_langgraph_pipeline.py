import os
import tempfile
from app.services.agent.graph import execute_evaluation
from app.services.agent.state import EvaluationState


def test_langgraph_5_stage_workflow_execution():
    """
    FR-15, AI-03, AI-04, AI-06, NFR-16, NFR-19:
    Execute the full 5-stage agent pipeline:
    extract_and_chunk -> retrieve_context -> evaluate_criteria -> synthesize_feedback -> validate_and_normalize
    """
    sample_code = """class Calculator:
    def add(self, a, b):
        \"\"\"Return sum of a and b.\"\"\"
        return a + b

    def divide(self, a, b):
        \"\"\"Return division with error handling.\"\"\"
        if b == 0:
            raise ZeroDivisionError("Cannot divide by zero")
        return a / b
"""
    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(sample_code)
        f_path = f.name

    try:
        criteria = [
            {
                "id": 1,
                "name": "Arithmetic Correctness",
                "description": "Addition and division implement expected arithmetic rules",
                "max_marks": 10.0,
                "weight": 1.0,
            },
            {
                "id": 2,
                "name": "Exception Handling",
                "description": "Zero division is caught and handled safely",
                "max_marks": 5.0,
                "weight": 1.0,
            },
        ]

        initial_state: EvaluationState = {
            "submission_id": 8801,
            "assignment_id": 501,
            "file_path": f_path,
            "file_type": "py",
            "criteria": criteria,
        }

        result = execute_evaluation(initial_state)

        # 1. Check extract_and_chunk stage output
        assert "extracted_text" in result
        assert len(result["chunks"]) >= 2

        # 2. Check retrieve_context stage output
        assert "retrieved_contexts" in result
        assert 1 in result["retrieved_contexts"]
        assert 2 in result["retrieved_contexts"]

        # 3. Check evaluate_criteria stage output (criterion-wise scores AI-04)
        assert "criterion_evaluations" in result
        assert len(result["criterion_evaluations"]) == 2
        for crit_eval in result["criterion_evaluations"]:
            assert 0.0 <= crit_eval["score"] <= crit_eval["max_marks"]
            assert len(crit_eval["feedback"]) > 0

        # 4. Check synthesize_feedback stage output (AI-05, FR-18)
        assert "summary_feedback" in result and len(result["summary_feedback"]) > 0
        assert isinstance(result.get("strengths"), list)
        assert isinstance(result.get("improvements"), list)

        # 5. Check validate_and_normalize stage output (NFR-19, NFR-05)
        assert result["status"] == "tentative"
        assert result["total_score"] <= result["total_max_score"]
        assert result["total_max_score"] == 15.0

    finally:
        if os.path.exists(f_path):
            os.remove(f_path)
