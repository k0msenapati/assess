import io
from fastapi.testclient import TestClient


def test_strict_rbac_and_student_professor_isolation(client: TestClient):
    """
    NFR-08, NFR-09, NFR-10, NFR-11, NFR-13:
    Security and Role-Based Access Control verification:
    - Unauthenticated calls rejected with 401
    - Students isolated to their own submissions/evaluations
    - Professors isolated to their own assignments/submissions
    - Passwords and backend secret tokens never exposed in responses
    """
    # 1. NFR-08: Unauthenticated access rejected
    assert client.get("/api/v1/auth/me").status_code == 401
    assert client.get("/api/v1/submissions/my").status_code == 401
    assert client.post("/api/v1/assignments", json={}).status_code == 401

    # 2. Register Professor A and Professor B
    p_a_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_alpha",
            "email": "alpha@university.edu",
            "password": "secretpassword123",
            "role": "professor",
        },
    )
    headers_prof_a = {"Authorization": f"Bearer {p_a_resp.json()['access_token']}"}

    p_b_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_beta",
            "email": "beta@university.edu",
            "password": "secretpassword123",
            "role": "professor",
        },
    )
    headers_prof_b = {"Authorization": f"Bearer {p_b_resp.json()['access_token']}"}

    # 3. Register Student X and Student Y
    s_x_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_x",
            "email": "x@university.edu",
            "password": "secretpassword123",
            "role": "student",
        },
    )
    headers_stud_x = {"Authorization": f"Bearer {s_x_resp.json()['access_token']}"}

    s_y_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_y",
            "email": "y@university.edu",
            "password": "secretpassword123",
            "role": "student",
        },
    )
    headers_stud_y = {"Authorization": f"Bearer {s_y_resp.json()['access_token']}"}

    # 4. NFR-13: User profile (/auth/me) does NOT expose password or hash
    me_resp = client.get("/api/v1/auth/me", headers=headers_stud_x)
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert "hashed_password" not in user_data
    assert "password" not in user_data

    # 5. Professor A creates Assignment A
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=headers_prof_a,
        json={
            "title": "Assignment Alpha",
            "description": "Alpha description",
            "allowed_types": "py",
            "max_file_size_mb": 5,
            "rubric": [{"name": "Core", "description": "Core logic", "max_marks": 10.0}],
        },
    )
    asgt_id = asgt_resp.json()["id"]

    # 6. NFR-11: Professor B CANNOT delete or modify Professor A's assignment
    assert (
        client.delete(f"/api/v1/assignments/{asgt_id}", headers=headers_prof_b).status_code == 403
    )

    # 7. Student X submits to Assignment A
    sub_x_resp = client.post(
        "/api/v1/submissions",
        headers=headers_stud_x,
        data={"assignment_id": asgt_id},
        files={"file": ("work.py", io.BytesIO(b"print('x')"), "text/x-python")},
    )
    sub_x_id = sub_x_resp.json()["id"]

    # 8. NFR-11: Professor B CANNOT view submissions of Professor A's assignment
    assert (
        client.get(f"/api/v1/submissions/assignment/{asgt_id}", headers=headers_prof_b).status_code
        == 403
    )

    # 9. Professor A evaluates Student X's submission
    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_x_id}", headers=headers_prof_a)
    eval_id = eval_resp.json()["id"]

    # Finalize the evaluation
    client.post(
        f"/api/v1/evaluations/{eval_id}/review",
        headers=headers_prof_a,
        json={"summary_feedback": "Approved", "overrides": [], "finalize": True},
    )

    # 10. NFR-10: Even when finalized, Student Y CANNOT access Student X's evaluation
    assert client.get(f"/api/v1/evaluations/{eval_id}", headers=headers_stud_y).status_code == 403
    assert (
        client.get(f"/api/v1/evaluations/submission/{sub_x_id}", headers=headers_stud_y).status_code
        == 403
    )
    assert (
        client.get(f"/api/v1/evaluations/{eval_id}/history", headers=headers_stud_y).status_code
        == 403
    )

    # 11. Student X CAN access their own finalized evaluation
    assert client.get(f"/api/v1/evaluations/{eval_id}", headers=headers_stud_x).status_code == 200
