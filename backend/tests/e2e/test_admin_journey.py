from fastapi.testclient import TestClient


def test_complete_admin_e2e_journey(client: TestClient):
    """
    E2E Journey - Administrator Persona:
    FR-02, FR-03, FR-25, NFR-08, NFR-09:
    Login -> Manage Users -> Role Promotion -> System Configuration Management -> System Audit
    """
    # 1. Admin Login
    admin_reg = client.post(
        "/api/v1/auth/register",
        json={
            "username": "super_admin_e2e",
            "email": "super_admin@university.edu",
            "password": "adminsecure123",
            "role": "admin",
        },
    )
    admin_token = admin_reg.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Register candidate user
    user_reg = client.post(
        "/api/v1/auth/register",
        json={
            "username": "adjunct_candidate",
            "email": "candidate@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    candidate_id = user_reg.json()["user_id"]

    # 3. Admin audits user roster (FR-25)
    roster_resp = client.get("/api/v1/admin/users", headers=admin_headers)
    assert roster_resp.status_code == 200
    roster = roster_resp.json()
    assert any(u["id"] == candidate_id for u in roster)

    # 4. Admin promotes candidate to Professor (FR-02, FR-03, FR-25)
    role_change = client.put(
        f"/api/v1/admin/users/{candidate_id}/role",
        headers=admin_headers,
        json={"role": "professor"},
    )
    assert role_change.status_code == 200
    assert role_change.json()["role"] == "professor"

    # 5. Admin reviews and updates university system settings (FR-25)
    config_resp = client.get("/api/v1/admin/config", headers=admin_headers)
    assert config_resp.status_code == 200

    update_config = client.put(
        "/api/v1/admin/config",
        headers=admin_headers,
        json={
            "configs": {
                "max_file_size_mb": "20",
                "enable_semantic_chunking": "true",
                "rag_top_k": "5",
            }
        },
    )
    assert update_config.status_code == 200
    assert update_config.json()["max_file_size_mb"] == "20"
    assert update_config.json()["rag_top_k"] == "5"

    # 6. Admin removes an obsolete user account
    delete_user_resp = client.delete(f"/api/v1/admin/users/{candidate_id}", headers=admin_headers)
    assert delete_user_resp.status_code == 204

    # 7. Check user is removed
    roster_final = client.get("/api/v1/admin/users", headers=admin_headers).json()
    assert not any(u["id"] == candidate_id for u in roster_final)
