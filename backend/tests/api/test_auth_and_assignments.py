import io
from fastapi.testclient import TestClient


def test_full_evaluation_flow(client: TestClient):
    # 1. Register professor
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_alan",
            "email": "alan@university.edu",
            "password": "securepassword123",
            "role": "professor",
        },
    )
    assert prof_resp.status_code == 200
    prof_token = prof_resp.json()["access_token"]
    prof_headers = {"Authorization": f"Bearer {prof_token}"}

    # 2. Register student
    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_ada",
            "email": "ada@university.edu",
            "password": "securepassword123",
            "role": "student",
        },
    )
    assert stud_resp.status_code == 200
    stud_token = stud_resp.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # 3. Create assignment with rubric criteria
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Data Structures Project: Binary Search Tree",
            "description": "Implement a balanced binary search tree with insert, delete, and lookup operations.",
            "allowed_types": "py,txt",
            "max_file_size_mb": 5,
            "rubric": [
                {
                    "name": "Algorithm Correctness",
                    "description": "BST operations insert, search, and delete correctly handle edge cases.",
                    "max_marks": 10.0,
                    "weight": 1.0,
                    "levels_json": "[]",
                },
                {
                    "name": "Code Modularity & Style",
                    "description": "Clean functions, proper naming conventions, and docstrings.",
                    "max_marks": 5.0,
                    "weight": 1.0,
                    "levels_json": "[]",
                },
            ],
        },
    )
    assert asgt_resp.status_code == 200
    asgt_data = asgt_resp.json()
    asgt_id = asgt_data["id"]
    assert len(asgt_data["rubric"]) == 2

    # 4. Student submits python code file
    sample_code = """class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

class BinarySearchTree:
    def __init__(self):
        self.root = None

    def insert(self, key):
        if not self.root:
            self.root = Node(key)
        else:
            self._insert_rec(self.root, key)

    def _insert_rec(self, current, key):
        if key < current.key:
            if current.left is None:
                current.left = Node(key)
            else:
                self._insert_rec(current.left, key)
        else:
            if current.right is None:
                current.right = Node(key)
            else:
                self._insert_rec(current.right, key)

    def search(self, key):
        curr = self.root
        while curr:
            if curr.key == key:
                return True
            curr = curr.left if key < curr.key else curr.right
        return False
"""
    file_bytes = io.BytesIO(sample_code.encode("utf-8"))
    sub_resp = client.post(
        "/api/v1/submissions",
        headers=stud_headers,
        data={"assignment_id": asgt_id},
        files={"file": ("bst.py", file_bytes, "text/x-python")},
    )
    assert sub_resp.status_code == 200
    sub_data = sub_resp.json()
    sub_id = sub_data["id"]
    assert sub_data["file_name"] == "bst.py"

    # 5. Trigger automated evaluation via LangGraph
    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_id}", headers=prof_headers)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    assert eval_data["status"] == "tentative"
    assert eval_data["total_score"] > 0
    assert len(eval_data["scores"]) == 2
    assert eval_data["scores"][0]["criterion_name"] == "Algorithm Correctness"

    # 6. Professor reviews and overrides a score
    eval_id = eval_data["id"]
    crit1_id = eval_data["scores"][0]["criterion_id"]
    review_resp = client.post(
        f"/api/v1/evaluations/{eval_id}/review",
        headers=prof_headers,
        json={
            "summary_feedback": "Excellent submission with clear structure.",
            "overrides": [
                {
                    "criterion_id": crit1_id,
                    "final_score": 9.5,
                    "feedback": "Great recursion and clean logic.",
                    "override_reason": "High quality traversal implementation",
                }
            ],
            "finalize": True,
        },
    )
    assert review_resp.status_code == 200
    reviewed_data = review_resp.json()
    assert reviewed_data["status"] == "finalized"
    assert reviewed_data["scores"][0]["final_score"] == 9.5
    assert reviewed_data["scores"][0]["is_overridden"] is True

    # 7. Check academic integrity & evaluation metrics
    metrics_resp = client.get("/api/v1/metrics", headers=prof_headers)
    assert metrics_resp.status_code == 200
    metrics_data = metrics_resp.json()
    assert metrics_data["total_evaluations"] >= 1
    assert metrics_data["finalized_count"] >= 1
    assert metrics_data["rubric_coverage_pct"] == 100.0
