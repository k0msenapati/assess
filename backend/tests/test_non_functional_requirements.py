import time
from fastapi.testclient import TestClient
from app.services.chunking import chunk_submission
from app.services.vector_store import index_submission_chunks, retrieve_relevant_chunks
from app.services.llm_client import mock_evaluate_criterion


def test_nfr_academic_integrity_non_autonomous_rule(client: TestClient):
    """
    NFR - Academic Integrity:
    Automated evaluations must strictly remain 'tentative' and must NOT become 'finalized'
    without explicit faculty review and approval.
    """
    # Create professor
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_integrity_lead",
            "email": "lead@outr.ac.in",
            "password": "securepassword123",
            "role": "professor",
        },
    )
    prof_token = prof_resp.json()["access_token"]
    prof_headers = {"Authorization": f"Bearer {prof_token}"}

    # Create student
    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_integrity_tester",
            "email": "tester@outr.ac.in",
            "password": "securepassword123",
            "role": "student",
        },
    )
    stud_token = stud_resp.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # Professor creates assignment
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Algorithms Integrity Check",
            "description": "Sorting algorithms and verification",
            "allowed_types": "py",
            "max_file_size_mb": 5,
            "rubric": [
                {
                    "name": "Correctness",
                    "description": "Quicksort partition correctness",
                    "max_marks": 10.0,
                    "weight": 1.0,
                    "levels_json": "[]",
                }
            ],
        },
    )
    asgt_id = asgt_resp.json()["id"]

    # Student submits code
    sub_resp = client.post(
        "/api/v1/submissions",
        headers=stud_headers,
        data={"assignment_id": asgt_id},
        files={"file": ("sort.py", b"def quicksort(arr): return arr", "text/x-python")},
    )
    sub_id = sub_resp.json()["id"]

    # Trigger evaluation
    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_id}", headers=prof_headers)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()

    # Rule Verification: Status MUST be 'tentative' and NOT 'finalized'
    assert eval_data["status"] == "tentative", (
        "Automated grading MUST remain tentative pending faculty review"
    )
    assert eval_data["reviewed_at"] is None, "Automated evaluation cannot self-sign as reviewed"


def test_nfr_rubric_coverage_completeness(client: TestClient):
    """
    NFR - Consistency:
    100% of defined rubric criteria must be addressed in the evaluation (no criteria omitted).
    """
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_coverage_audit",
            "email": "coverage@outr.ac.in",
            "password": "securepassword123",
            "role": "professor",
        },
    )
    prof_headers = {"Authorization": f"Bearer {prof_resp.json()['access_token']}"}

    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_coverage_tester",
            "email": "coverage_stud@outr.ac.in",
            "password": "securepassword123",
            "role": "student",
        },
    )
    stud_headers = {"Authorization": f"Bearer {stud_resp.json()['access_token']}"}

    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Multi-Criteria Matrix Assessment",
            "description": "Test multi-rubric completeness",
            "allowed_types": "py",
            "max_file_size_mb": 5,
            "rubric": [
                {
                    "name": "Criterion 1: Syntax",
                    "description": "Syntax check",
                    "max_marks": 5.0,
                    "weight": 0.33,
                    "levels_json": "[]",
                },
                {
                    "name": "Criterion 2: Logic",
                    "description": "Logic check",
                    "max_marks": 10.0,
                    "weight": 0.33,
                    "levels_json": "[]",
                },
                {
                    "name": "Criterion 3: Efficiency",
                    "description": "Efficiency check",
                    "max_marks": 5.0,
                    "weight": 0.34,
                    "levels_json": "[]",
                },
            ],
        },
    )
    asgt_id = asgt_resp.json()["id"]

    sub_resp = client.post(
        "/api/v1/submissions",
        headers=stud_headers,
        data={"assignment_id": asgt_id},
        files={"file": ("matrix.py", b"def solve(): pass", "text/x-python")},
    )
    sub_id = sub_resp.json()["id"]

    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_id}", headers=prof_headers)
    eval_data = eval_resp.json()

    # Verify all 3 criteria are represented
    assert len(eval_data["scores"]) == 3, "All criteria must be evaluated"
    criterion_names = [s["criterion_name"] for s in eval_data["scores"]]
    assert "Criterion 1: Syntax" in criterion_names
    assert "Criterion 2: Logic" in criterion_names
    assert "Criterion 3: Efficiency" in criterion_names


def test_nfr_rag_retrieval_relevance():
    """
    NFR - Retrieval Quality:
    ChromaDB vector search must retrieve the semantic chunk matching the query.
    """
    sample_code = """
# Section 1: Data Model
class UserRecord:
    def __init__(self, uid, name):
        self.uid = uid
        self.name = name

# Section 2: Concurrency & Thread Synchronization
import threading
lock = threading.Lock()

def synchronize_critical_section(counter):
    with lock:
        counter.value += 1
        return counter.value

# Section 3: File I/O
def export_to_csv(filename, data):
    with open(filename, 'w') as f:
        f.write(data)
"""
    chunks = chunk_submission(sample_code, "py")
    test_sub_id = 998877
    index_submission_chunks(test_sub_id, chunks)

    # Query specifically for concurrency
    results = retrieve_relevant_chunks(
        test_sub_id, "thread synchronization and mutex locks", top_k=1
    )
    assert len(results) > 0
    top_chunk = results[0]

    # The retrieved chunk must contain concurrency/synchronize code
    assert "synchronize" in top_chunk["content"].lower() or "lock" in top_chunk["content"].lower()


def test_nfr_performance_chunking_speed():
    """
    NFR - Performance:
    AST code parsing and semantic chunking on standard files must complete in < 200ms.
    """
    large_python_code = "\n".join(
        [
            f"def compute_step_{i}(x):\n    '''Step {i} calculation docstring.'''\n    return x * {i}\n"
            for i in range(100)
        ]
    )

    start_time = time.perf_counter()
    chunks = chunk_submission(large_python_code, "py")
    elapsed_ms = (time.perf_counter() - start_time) * 1000

    assert len(chunks) >= 100
    assert elapsed_ms < 200, f"Chunking took {elapsed_ms:.2f}ms, which exceeds 200ms threshold"


def test_nfr_reliability_graceful_fallback():
    """
    NFR - Reliability:
    If empty chunks or unusual text is supplied, evaluator must not raise unhandled exception.
    """
    dummy_criterion = {
        "id": 99,
        "name": "Exception Handling",
        "description": "Safe failure modes",
        "max_marks": 5.0,
    }

    # Empty retrieved chunks scenario
    result = mock_evaluate_criterion(dummy_criterion, retrieved_chunks=[])
    assert result["score"] >= 0.0
    assert result["score"] <= 5.0
    assert "feedback" in result
    assert isinstance(result["deductions"], list)
