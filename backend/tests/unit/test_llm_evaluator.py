from app.services.llm_client import (
    mock_evaluate_criterion,
    synthesize_holistic_feedback,
)


def test_mock_evaluator_bounds_and_structure():
    """FR-16, FR-17, FR-18, NFR-19, AI-01, AI-04: Bounded scoring, citations, and deductions"""
    criterion = {
        "id": 101,
        "name": "Exception Safety",
        "description": "Functions must catch potential IndexError and ValueError gracefully",
        "max_marks": 8.0,
    }
    sample_chunks = [
        {
            "chunk_id": 1,
            "title": "def parse_records(data)",
            "start_line": 15,
            "end_line": 28,
            "content": "def parse_records(data):\n    try:\n        return [int(x) for x in data]\n    except ValueError:\n        return []",
        }
    ]

    result = mock_evaluate_criterion(criterion, sample_chunks)
    assert 0.0 <= result["score"] <= criterion["max_marks"]
    assert "feedback" in result and len(result["feedback"]) > 0
    assert isinstance(result["evidence_quotes"], list)
    assert len(result["evidence_quotes"]) > 0
    assert isinstance(result["deductions"], list)
    assert 0.0 <= result["confidence"] <= 1.0


def test_mock_evaluator_no_matching_chunks():
    """NFR-04, NFR-19: Safe handling when no relevant submission content is matched"""
    criterion = {
        "id": 102,
        "name": "Unit Testing",
        "description": "Comprehensive pytest coverage",
        "max_marks": 5.0,
    }

    result = mock_evaluate_criterion(criterion, retrieved_chunks=[])
    assert 0.0 <= result["score"] <= criterion["max_marks"]
    assert len(result["deductions"]) > 0
    assert (
        "not clearly referenced" in result["deductions"][0].lower()
        or "not" in result["deductions"][0].lower()
    )


def test_synthesize_holistic_feedback_structure():
    """FR-18, AI-05: Holistic feedback generation with strengths and improvement suggestions"""
    criterion_evals = [
        {"name": "Correctness", "score": 9.0, "max_marks": 10.0, "deductions": []},
        {
            "name": "Style",
            "score": 3.0,
            "max_marks": 5.0,
            "deductions": ["Inconsistent indentation on line 12."],
        },
    ]

    feedback = synthesize_holistic_feedback(criterion_evals, overall_score=12.0, max_score=15.0)
    assert "summary" in feedback and len(feedback["summary"]) > 0
    assert isinstance(feedback["strengths"], list) and len(feedback["strengths"]) > 0
    assert isinstance(feedback["improvements"], list) and len(feedback["improvements"]) > 0
