from fastapi.testclient import TestClient


def test_unauthorized_access(client: TestClient):
    # Trying to fetch current user profile without token
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_invalid_login_credentials(client: TestClient):
    # Attempt login with non-existent user or bad password
    resp = client.post(
        "/api/v1/auth/token",
        data={"username": "non_existent_user", "password": "wrongpassword"},
    )
    assert resp.status_code == 401


def test_student_cannot_create_assignment(client: TestClient):
    # Register student
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_bob",
            "email": "bob@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    assert reg_resp.status_code == 200
    student_token = reg_resp.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}

    # Student attempts to create assignment -> Must be 403 Forbidden
    create_resp = client.post(
        "/api/v1/assignments",
        headers=student_headers,
        json={
            "title": "Hacked Assignment",
            "description": "Unauthorized attempt",
            "allowed_types": "py",
            "max_file_size_mb": 5,
            "rubric": [],
        },
    )
    assert create_resp.status_code == 403


def test_submission_to_nonexistent_assignment(client: TestClient):
    # Register student
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_carol",
            "email": "carol@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Try to submit to non-existent assignment ID 99999
    sub_resp = client.post(
        "/api/v1/submissions",
        headers=headers,
        data={"assignment_id": 99999},
        files={"file": ("test.py", b"print('hello')", "text/x-python")},
    )
    assert sub_resp.status_code == 404
