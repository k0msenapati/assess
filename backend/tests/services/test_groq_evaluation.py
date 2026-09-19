from app.services.llm_client import (
    evaluate_criterion_with_groq,
    synthesize_holistic_feedback,
    get_groq_client,
)


def test_groq_client_initialized():
    client = get_groq_client()
    assert client is not None, "Groq client must be initialized when GROQ_API_KEY is present"


def test_real_groq_criterion_evaluation():
    criterion = {
        "id": 1,
        "name": "Algorithm Correctness & Tree Balancing",
        "description": "Tree properly maintains balance invariants and executes AVL rotations correctly.",
        "max_marks": 10.0,
        "weight": 1.0,
    }

    sample_chunks = [
        {
            "id": "chunk_1",
            "title": "def _rotate_left(self, z)",
            "start_line": 45,
            "end_line": 58,
            "content": (
                "def _rotate_left(self, z):\n"
                "    y = z.right\n"
                "    T2 = y.left\n"
                "    y.left = z\n"
                "    z.right = T2\n"
                "    z.height = 1 + max(self._get_height(z.left), self._get_height(z.right))\n"
                "    y.height = 1 + max(self._get_height(y.left), self._get_height(y.right))\n"
                "    return y"
            ),
        }
    ]

    result = evaluate_criterion_with_groq(criterion, sample_chunks, file_type="py")

    assert "score" in result
    assert 0.0 <= result["score"] <= criterion["max_marks"]
    assert "feedback" in result and len(result["feedback"]) > 0
    assert "confidence" in result and 0.0 <= result["confidence"] <= 1.0
    assert isinstance(result["evidence_quotes"], list)
    assert isinstance(result["deductions"], list)


def test_real_groq_holistic_synthesis():
    criterion_evals = [
        {
            "name": "Algorithm Correctness",
            "score": 9.5,
            "max_marks": 10.0,
            "deductions": [],
        },
        {
            "name": "Complexity Analysis",
            "score": 4.5,
            "max_marks": 5.0,
            "deductions": ["Minor omission of worst-case space bound."],
        },
    ]

    holistic = synthesize_holistic_feedback(criterion_evals, overall_score=14.0, max_score=15.0)

    assert "summary" in holistic and len(holistic["summary"]) > 0
    assert "strengths" in holistic and len(holistic["strengths"]) > 0
    assert "improvements" in holistic and isinstance(holistic["improvements"], list)
