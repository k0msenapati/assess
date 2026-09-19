from fastapi.testclient import TestClient


def test_rubric_criteria_create_edit_delete_lifecycle(client: TestClient):
    """
    FR-05, FR-06, NFR-11:
    The Professor shall be able to create, edit, and delete rubric criteria for an assignment.
    Role-based authorization must prevent unauthorized modifications.
    """
    # 1. Register Owner Professor
    prof1_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_rubric_owner",
            "email": "owner@university.edu",
            "password": "password123",
            "role": "professor",
        },
    )
    prof1_token = prof1_resp.json()["access_token"]
    prof1_headers = {"Authorization": f"Bearer {prof1_token}"}

    # 2. Register Another Professor
    prof2_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_rubric_stranger",
            "email": "stranger@university.edu",
            "password": "password123",
            "role": "professor",
        },
    )
    prof2_token = prof2_resp.json()["access_token"]
    prof2_headers = {"Authorization": f"Bearer {prof2_token}"}

    # 3. Register Student
    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "stud_rubric_tester",
            "email": "student_rubric@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    stud_token = stud_resp.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    # 4. Professor 1 creates assignment with 1 initial criterion
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof1_headers,
        json={
            "title": "Software Engineering Lab 1",
            "description": "API Architecture assignment",
            "allowed_types": "py",
            "max_file_size_mb": 5,
            "rubric": [
                {
                    "name": "Design Quality",
                    "description": "Adherence to SOLID design principles",
                    "max_marks": 10.0,
                    "weight": 0.5,
                    "levels_json": "[]",
                }
            ],
        },
    )
    assert asgt_resp.status_code == 200
    asgt_id = asgt_resp.json()["id"]

    # 5. Professor 1 adds a new criterion to the assignment (FR-05)
    add_crit_resp = client.post(
        f"/api/v1/assignments/{asgt_id}/rubric",
        headers=prof1_headers,
        json={
            "name": "Test Coverage",
            "description": "Pytest coverage must exceed 80%",
            "max_marks": 5.0,
            "weight": 0.5,
            "levels_json": "[]",
        },
    )
    assert add_crit_resp.status_code == 200
    crit_data = add_crit_resp.json()
    crit_id = crit_data["id"]
    assert crit_data["name"] == "Test Coverage"
    assert crit_data["max_marks"] == 5.0

    # 6. Unauthorized check: Student and Stranger Professor cannot edit/delete criterion (NFR-11)
    assert (
        client.put(
            f"/api/v1/assignments/{asgt_id}/rubric/{crit_id}",
            headers=stud_headers,
            json={"max_marks": 10.0},
        ).status_code
        == 403
    )

    assert (
        client.put(
            f"/api/v1/assignments/{asgt_id}/rubric/{crit_id}",
            headers=prof2_headers,
            json={"max_marks": 10.0},
        ).status_code
        == 403
    )

    # 7. Professor 1 updates the criterion (FR-05)
    update_resp = client.put(
        f"/api/v1/assignments/{asgt_id}/rubric/{crit_id}",
        headers=prof1_headers,
        json={
            "name": "Comprehensive Test Coverage",
            "max_marks": 8.0,
            "description": "Pytest and mock tests exceeding 85%",
        },
    )
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["name"] == "Comprehensive Test Coverage"
    assert updated_data["max_marks"] == 8.0

    # 8. Check assignment detail reflects updated rubric
    detail_resp = client.get(f"/api/v1/assignments/{asgt_id}")
    assert detail_resp.status_code == 200
    assert len(detail_resp.json()["rubric"]) == 2

    # 9. Professor 1 deletes the criterion (FR-05)
    del_crit_resp = client.delete(
        f"/api/v1/assignments/{asgt_id}/rubric/{crit_id}", headers=prof1_headers
    )
    assert del_crit_resp.status_code == 204

    # 10. Detail now has only 1 criterion
    detail_after = client.get(f"/api/v1/assignments/{asgt_id}").json()
    assert len(detail_after["rubric"]) == 1
    assert detail_after["rubric"][0]["name"] == "Design Quality"
