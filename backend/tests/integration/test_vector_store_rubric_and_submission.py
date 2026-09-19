from app.services.vector_store import (
    index_submission_chunks,
    retrieve_relevant_chunks,
    index_rubric_criteria,
    retrieve_rubric_criteria,
)


def test_submission_chunks_indexing_and_semantic_search():
    """FR-14: Semantic similarity retrieval of submission chunks using rubric query"""
    sub_id = 991122
    chunks = [
        {
            "chunk_id": 1,
            "title": "def quicksort(arr)",
            "start_line": 1,
            "end_line": 15,
            "type": "code",
            "content": "def quicksort(arr):\n    if len(arr) <= 1: return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)",
        },
        {
            "chunk_id": 2,
            "title": "def parse_csv(filepath)",
            "start_line": 16,
            "end_line": 30,
            "type": "code",
            "content": "def parse_csv(filepath):\n    import csv\n    with open(filepath, 'r') as f:\n        return list(csv.reader(f))",
        },
    ]

    index_submission_chunks(sub_id, chunks)

    # Search for sorting algorithm
    results = retrieve_relevant_chunks(
        sub_id, "divide and conquer recursive sorting algorithm", top_k=1
    )
    assert len(results) == 1
    assert "quicksort" in results[0]["content"]
    assert results[0]["similarity"] > 0.0


def test_rubric_criteria_indexing_and_semantic_retrieval():
    """FR-13, FR-14: Storing rubric criteria in retrievable knowledge base and semantic matching"""
    asgt_id = 7788
    criteria = [
        {
            "id": 101,
            "name": "Database Query Optimization",
            "description": "Efficient SQL queries, indexing, and avoidance of N+1 select problems.",
            "max_marks": 10.0,
            "weight": 0.5,
        },
        {
            "id": 102,
            "name": "Frontend Accessibility (a11y)",
            "description": "ARIA attributes, keyboard navigation, and contrast ratio conformance.",
            "max_marks": 10.0,
            "weight": 0.5,
        },
    ]

    index_rubric_criteria(asgt_id, criteria)

    # Search rubric criteria by submission topic: SQL indexing
    retrieved_db = retrieve_rubric_criteria(asgt_id, "indexes and SQL execution plans", top_k=1)
    assert len(retrieved_db) == 1
    assert retrieved_db[0]["criterion_id"] == 101
    assert retrieved_db[0]["name"] == "Database Query Optimization"

    # Search rubric criteria by accessibility topic
    retrieved_a11y = retrieve_rubric_criteria(
        asgt_id, "keyboard focus and screen reader labels", top_k=1
    )
    assert len(retrieved_a11y) == 1
    assert retrieved_a11y[0]["criterion_id"] == 102
