import io
from fastapi.testclient import TestClient


def test_evaluation_api_lifecycle_status_and_history(client: TestClient):
    """
    FR-15, FR-16, FR-20, FR-21, FR-22, FR-23, FR-24, FR-26, NFR-02, NFR-05:
    Full evaluation lifecycle via REST API:
    Trigger -> Tentative Status -> Async Status check -> Review & Override -> Finalize -> History
    """
    # 1. Setup Professor and Student
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_eval_lead",
            "email": "lead_eval@university.edu",
            "password": "password123",
            "role": "professor",
        },
    )
    prof_headers = {"Authorization": f"Bearer {prof_resp.json()['access_token']}"}

    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "stud_eval_user",
            "email": "user_eval@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    stud_headers = {"Authorization": f"Bearer {stud_resp.json()['access_token']}"}

    # 2. Professor creates assignment
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Linked List Lab",
            "description": "Implement Singly Linked List",
            "allowed_types": "py",
            "max_file_size_mb": 5,
            "rubric": [
                {
                    "name": "Node Insertion",
                    "description": "Head and tail insertion work in O(1)",
                    "max_marks": 10.0,
                    "weight": 1.0,
                    "levels_json": "[]",
                }
            ],
        },
    )
    asgt_id = asgt_resp.json()["id"]

    # 3. Student submits code
    code = """class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

class LinkedList:
    def __init__(self):
        self.head = None

    def insert_head(self, data):
        new_node = Node(data)
        new_node.next = self.head
        self.head = new_node
"""
    sub_resp = client.post(
        "/api/v1/submissions",
        headers=stud_headers,
        data={"assignment_id": asgt_id},
        files={
            "file": (
                "linked_list.py",
                io.BytesIO(code.encode("utf-8")),
                "text/x-python",
            )
        },
    )
    sub_id = sub_resp.json()["id"]

    # 4. Check initial processing status (FR-26)
    status_initial = client.get(f"/api/v1/evaluations/status/{sub_id}", headers=stud_headers)
    assert status_initial.status_code == 200
    assert status_initial.json()["status"] == "submitted"

    # 5. Non-professor (student) CANNOT trigger evaluation
    assert client.post(f"/api/v1/evaluations/run/{sub_id}", headers=stud_headers).status_code == 403

    # 6. Professor triggers evaluation synchronously (FR-15, FR-16)
    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_id}", headers=prof_headers)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    eval_id = eval_data["id"]

    assert eval_data["status"] == "tentative"
    assert eval_data["current_stage"] == "completed"
    assert len(eval_data["scores"]) == 1
    crit1_id = eval_data["scores"][0]["criterion_id"]

    # 7. FR-26: Verify status endpoint reflects completed evaluation
    status_after = client.get(f"/api/v1/evaluations/status/{sub_id}", headers=stud_headers)
    assert status_after.status_code == 200
    assert status_after.json()["evaluation_status"] == "tentative"
    assert status_after.json()["current_stage"] == "completed"

    # 8. FR-22, FR-23: Student CANNOT view evaluation while it is tentative
    stud_view_tentative = client.get(f"/api/v1/evaluations/{eval_id}", headers=stud_headers)
    assert stud_view_tentative.status_code == 403

    # 9. FR-24: History endpoint contains version 1 (AI draft)
    history_v1 = client.get(f"/api/v1/evaluations/{eval_id}/history", headers=prof_headers)
    assert history_v1.status_code == 200
    assert len(history_v1.json()) == 1
    assert history_v1.json()[0]["version"] == 1
    assert history_v1.json()[0]["action_note"] == "AI Tentative Evaluation"

    # 10. FR-21: Professor reviews and finalizes evaluation with score override
    review_resp = client.post(
        f"/api/v1/evaluations/{eval_id}/review",
        headers=prof_headers,
        json={
            "summary_feedback": "Well designed linked list insertion.",
            "overrides": [
                {
                    "criterion_id": crit1_id,
                    "final_score": 9.5,
                    "feedback": "Flawless head insertion and clean pointer assignment.",
                    "override_reason": "Clean style",
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

    # 11. FR-23: Now that evaluation is finalized, Student CAN view evaluation and permitted feedback
    stud_view_final = client.get(f"/api/v1/evaluations/{eval_id}", headers=stud_headers)
    assert stud_view_final.status_code == 200
    assert stud_view_final.json()["status"] == "finalized"
    assert stud_view_final.json()["scores"][0]["final_score"] == 9.5

    # 12. FR-24: History now contains version 2 (Professor Review)
    history_v2 = client.get(f"/api/v1/evaluations/{eval_id}/history", headers=prof_headers)
    assert history_v2.status_code == 200
    assert len(history_v2.json()) == 2
    assert history_v2.json()[0]["version"] == 2
    assert history_v2.json()[0]["status"] == "finalized"
