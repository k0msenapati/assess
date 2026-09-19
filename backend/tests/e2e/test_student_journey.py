import io
from fastapi.testclient import TestClient


def test_complete_student_e2e_journey(client: TestClient):
    """
    E2E Journey - Student Persona:
    Suggested MVP Boundary:
    Login -> View Assignment -> Upload PDF/Code -> Track Processing -> View Released Feedback
    FR-01, FR-07, FR-08, FR-09, FR-10, FR-11, FR-23, FR-26, NFR-10, NFR-14
    """
    # 1. Setup Professor and Assignment
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_e2e_student_journey",
            "email": "prof_student_journey@university.edu",
            "password": "password123",
            "role": "professor",
        },
    )
    prof_token = prof_resp.json()["access_token"]
    prof_headers = {"Authorization": f"Bearer {prof_token}"}

    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Data Structures: Balanced Trees",
            "description": "Implement an AVL or Red-Black Tree with verified rotations",
            "allowed_types": "py,txt",
            "max_file_size_mb": 5,
            "rubric": [
                {
                    "name": "Rotation Invariant",
                    "description": "Rotations maintain search tree order and height balance",
                    "max_marks": 10.0,
                    "weight": 1.0,
                    "levels_json": "[]",
                }
            ],
        },
    )
    asgt_id = asgt_resp.json()["id"]

    # 2. Student Register & Login (FR-01, FR-02)
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_samyukta",
            "email": "samyukta@university.edu",
            "password": "studentpassword123",
            "role": "student",
        },
    )
    assert reg_resp.status_code == 200

    login_resp = client.post(
        "/api/v1/auth/token",
        data={"username": "student_samyukta", "password": "studentpassword123"},
    )
    assert login_resp.status_code == 200
    stud_token = login_resp.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # 3. Student Views Available Assignments (FR-07, NFR-14)
    list_resp = client.get("/api/v1/assignments", headers=stud_headers)
    assert list_resp.status_code == 200
    assert any(a["id"] == asgt_id for a in list_resp.json())

    # View assignment detail
    asgt_detail = client.get(f"/api/v1/assignments/{asgt_id}", headers=stud_headers)
    assert asgt_detail.status_code == 200
    assert asgt_detail.json()["title"] == "Data Structures: Balanced Trees"
    assert len(asgt_detail.json()["rubric"]) == 1

    # 4. Student Uploads Submission (FR-08, FR-09, FR-10)
    student_code = """class AVLNode:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None
        self.height = 1

def left_rotate(z):
    y = z.right
    t2 = y.left
    y.left = z
    z.right = t2
    z.height = 1 + max(get_height(z.left), get_height(z.right))
    y.height = 1 + max(get_height(y.left), get_height(y.right))
    return y

def get_height(root):
    return root.height if root else 0
"""
    upload_resp = client.post(
        "/api/v1/submissions",
        headers=stud_headers,
        data={"assignment_id": asgt_id},
        files={
            "file": (
                "avl_tree.py",
                io.BytesIO(student_code.encode("utf-8")),
                "text/x-python",
            )
        },
    )
    assert upload_resp.status_code == 200
    sub_data = upload_resp.json()
    sub_id = sub_data["id"]
    assert sub_data["status"] == "submitted"
    assert sub_data["file_name"] == "avl_tree.py"

    # 5. Track Processing Status (FR-26)
    status_resp = client.get(f"/api/v1/evaluations/status/{sub_id}", headers=stud_headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "submitted"

    # Student cannot view feedback yet (it does not exist yet)
    assert (
        client.get(f"/api/v1/evaluations/submission/{sub_id}", headers=stud_headers).status_code
        == 404
    )

    # 6. Faculty evaluates and releases the grade
    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_id}", headers=prof_headers)
    assert eval_resp.status_code == 200
    eval_id = eval_resp.json()["id"]

    # While tentative, student is forbidden from accessing (FR-22, NFR-05)
    assert (
        client.get(f"/api/v1/evaluations/submission/{sub_id}", headers=stud_headers).status_code
        == 403
    )

    # Professor reviews and finalizes
    client.post(
        f"/api/v1/evaluations/{eval_id}/review",
        headers=prof_headers,
        json={
            "summary_feedback": "Well-implemented AVL rotation and balance maintenance.",
            "overrides": [],
            "finalize": True,
        },
    )

    # 7. Student Views Released Feedback (FR-23)
    final_feedback = client.get(f"/api/v1/evaluations/submission/{sub_id}", headers=stud_headers)
    assert final_feedback.status_code == 200
    feedback_data = final_feedback.json()

    assert feedback_data["status"] == "finalized"
    assert feedback_data["total_score"] > 0
    assert len(feedback_data["scores"]) == 1
    assert feedback_data["scores"][0]["criterion_name"] == "Rotation Invariant"
    assert len(feedback_data["scores"][0]["feedback"]) > 0

    # Student can check their submissions list showing finalized score
    my_subs = client.get("/api/v1/submissions/my", headers=stud_headers)
    assert my_subs.status_code == 200
    my_sub_entry = next(s for s in my_subs.json() if s["id"] == sub_id)
    assert my_sub_entry["status"] == "finalized"
    assert my_sub_entry["total_score"] is not None
