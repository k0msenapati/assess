from fastapi.testclient import TestClient


def test_admin_user_and_system_config_management(client: TestClient):
    """
    FR-25, FR-02, FR-03, NFR-08, NFR-09:
    Administrator can manage users (list, change role, delete) and system configuration.
    Non-administrators are forbidden from accessing admin endpoints.
    """
    # 1. Register admin
    admin_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "sys_admin",
            "email": "admin@university.edu",
            "password": "adminpassword123",
            "role": "admin",
        },
    )
    assert admin_resp.status_code == 200
    admin_token = admin_resp.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register regular student and professor
    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "admin_test_student",
            "email": "student_test@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    assert stud_resp.status_code == 200
    stud_id = stud_resp.json()["user_id"]
    stud_token = stud_resp.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "admin_test_prof",
            "email": "prof_test@university.edu",
            "password": "password123",
            "role": "professor",
        },
    )
    prof_token = prof_resp.json()["access_token"]
    prof_headers = {"Authorization": f"Bearer {prof_token}"}

    # 3. Security Guard: Student and Professor CANNOT access admin endpoints (403)
    assert client.get("/api/v1/admin/users", headers=stud_headers).status_code == 403
    assert client.get("/api/v1/admin/users", headers=prof_headers).status_code == 403
    assert client.get("/api/v1/admin/config", headers=stud_headers).status_code == 403
    assert client.get("/api/v1/admin/config", headers=prof_headers).status_code == 403

    # 4. Admin lists all users
    users_resp = client.get("/api/v1/admin/users", headers=admin_headers)
    assert users_resp.status_code == 200
    users_list = users_resp.json()
    assert any(u["username"] == "admin_test_student" for u in users_list)
    assert any(u["username"] == "admin_test_prof" for u in users_list)

    # 5. Admin promotes student to professor
    role_update_resp = client.put(
        f"/api/v1/admin/users/{stud_id}/role",
        headers=admin_headers,
        json={"role": "professor"},
    )
    assert role_update_resp.status_code == 200
    assert role_update_resp.json()["role"] == "professor"

    # 6. Admin checks and updates system configuration
    cfg_get = client.get("/api/v1/admin/config", headers=admin_headers)
    assert cfg_get.status_code == 200
    assert "max_file_size_mb" in cfg_get.json()

    cfg_update = client.put(
        "/api/v1/admin/config",
        headers=admin_headers,
        json={"configs": {"max_file_size_mb": "30", "llm_temperature": "0.15"}},
    )
    assert cfg_update.status_code == 200
    assert cfg_update.json()["max_file_size_mb"] == "30"
    assert cfg_update.json()["llm_temperature"] == "0.15"

    # 7. Admin deletes a user
    del_resp = client.delete(f"/api/v1/admin/users/{stud_id}", headers=admin_headers)
    assert del_resp.status_code == 204

    # Verify deleted user no longer in users list
    users_after = client.get("/api/v1/admin/users", headers=admin_headers).json()
    assert not any(u["id"] == stud_id for u in users_after)
