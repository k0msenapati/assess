import io
from fastapi.testclient import TestClient


def test_file_validation_and_submission_access_controls(client: TestClient):
    """
    FR-08, FR-09, FR-10, NFR-10, NFR-11, NFR-12:
    File validation for permitted type and size limits.
    Role-based submission isolation.
    """
    # 1. Register Professor
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_sub_manager",
            "email": "manager@university.edu",
            "password": "password123",
            "role": "professor",
        },
    )
    prof_token = prof_resp.json()["access_token"]
    prof_headers = {"Authorization": f"Bearer {prof_token}"}

    # 2. Register Student A and Student B
    s_a_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_alice_sub",
            "email": "alice_sub@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    token_a = s_a_resp.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    s_b_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_bob_sub",
            "email": "bob_sub@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    token_b = s_b_resp.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Create assignment allowing only py and txt with max size 1MB
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Strict Validation Assignment",
            "description": "Only py and txt up to 1MB",
            "allowed_types": "py,txt",
            "max_file_size_mb": 1,
            "rubric": [{"name": "Correctness", "description": "Logic", "max_marks": 10.0}],
        },
    )
    asgt_id = asgt_resp.json()["id"]

    # 4. FR-09: Rejection of unsupported file extension (.exe)
    invalid_ext_resp = client.post(
        "/api/v1/submissions",
        headers=headers_a,
        data={"assignment_id": asgt_id},
        files={"file": ("malicious.exe", b"binary content", "application/octet-stream")},
    )
    assert invalid_ext_resp.status_code == 400
    assert "not allowed" in invalid_ext_resp.json()["detail"].lower()

    # 5. FR-09: Rejection of oversized file (> 1MB)
    oversized_data = b"x" * (1024 * 1024 + 1024)  # ~1.001 MB
    oversized_resp = client.post(
        "/api/v1/submissions",
        headers=headers_a,
        data={"assignment_id": asgt_id},
        files={"file": ("big_file.py", oversized_data, "text/x-python")},
    )
    assert oversized_resp.status_code == 400
    assert "exceeds limit" in oversized_resp.json()["detail"].lower()

    # 6. Valid submission upload by Student A
    valid_code = "print('Hello, world!')"
    valid_resp = client.post(
        "/api/v1/submissions",
        headers=headers_a,
        data={"assignment_id": asgt_id},
        files={
            "file": (
                "solution.py",
                io.BytesIO(valid_code.encode("utf-8")),
                "text/x-python",
            )
        },
    )
    assert valid_resp.status_code == 200
    sub_a_id = valid_resp.json()["id"]

    # 7. Student A can list own submissions (/my)
    my_subs = client.get("/api/v1/submissions/my", headers=headers_a)
    assert my_subs.status_code == 200
    assert any(s["id"] == sub_a_id for s in my_subs.json())

    # 8. NFR-10: Student B CANNOT view Student A's submission content
    b_access_resp = client.get(f"/api/v1/submissions/{sub_a_id}/content", headers=headers_b)
    assert b_access_resp.status_code == 403

    # 9. Student A can view their own submission content
    a_access_resp = client.get(f"/api/v1/submissions/{sub_a_id}/content", headers=headers_a)
    assert a_access_resp.status_code == 200
    assert "Hello, world!" in a_access_resp.json()["content"]

    # 10. Professor of assignment can view submission content
    prof_access_resp = client.get(f"/api/v1/submissions/{sub_a_id}/content", headers=prof_headers)
    assert prof_access_resp.status_code == 200
    assert "Hello, world!" in prof_access_resp.json()["content"]
