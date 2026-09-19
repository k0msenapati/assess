import io
from fastapi.testclient import TestClient


def test_complete_professor_e2e_journey(client: TestClient):
    """
    E2E Journey - Professor Persona:
    Suggested MVP Boundary:
    Login -> Create Assignment -> Define Rubric -> View Submissions -> Run/Review AI Evaluation -> Modify Score/Feedback -> Release
    FR-01, FR-04, FR-05, FR-06, FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-20, FR-21, FR-22, FR-24, AI-01 to AI-08
    """
    # 1. Login Professor
    prof_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "prof_turing_e2e",
            "email": "turing@university.edu",
            "password": "profpassword123",
            "role": "professor",
        },
    )
    prof_token = prof_resp.json()["access_token"]
    prof_headers = {"Authorization": f"Bearer {prof_token}"}

    # 2. Create Assignment (FR-04)
    asgt_resp = client.post(
        "/api/v1/assignments",
        headers=prof_headers,
        json={
            "title": "Operating Systems: CPU Scheduling",
            "description": "Simulate Round Robin and Priority Scheduling algorithms.",
            "allowed_types": "py,txt",
            "max_file_size_mb": 10,
            "rubric": [
                {
                    "name": "Scheduling Correctness",
                    "description": "Context switching, quantum expiration, and queue fairness",
                    "max_marks": 10.0,
                    "weight": 0.6,
                    "levels_json": "[]",
                }
            ],
        },
    )
    assert asgt_resp.status_code == 200
    asgt_id = asgt_resp.json()["id"]

    # 3. Define / Add Another Rubric Criterion (FR-05, FR-06)
    crit2_resp = client.post(
        f"/api/v1/assignments/{asgt_id}/rubric",
        headers=prof_headers,
        json={
            "name": "Time Complexity & Profiling",
            "description": "Queue operations run in O(1) time per scheduling slice",
            "max_marks": 5.0,
            "weight": 0.4,
            "levels_json": "[]",
        },
    )
    assert "id" in crit2_resp.json()

    # 4. Student submits implementation
    stud_resp = client.post(
        "/api/v1/auth/register",
        json={
            "username": "student_linus_e2e",
            "email": "linus@university.edu",
            "password": "password123",
            "role": "student",
        },
    )
    stud_token = stud_resp.json()["access_token"]
    stud_headers = {"Authorization": f"Bearer {stud_token}"}

    os_code = """from collections import deque

class Process:
    def __init__(self, pid, burst_time):
        self.pid = pid
        self.burst_time = burst_time
        self.remaining_time = burst_time

def round_robin(processes, quantum):
    queue = deque(processes)
    current_time = 0
    completed = []

    while queue:
        p = queue.popleft()
        exec_time = min(quantum, p.remaining_time)
        p.remaining_time -= exec_time
        current_time += exec_time

        if p.remaining_time > 0:
            queue.append(p)
        else:
            completed.append((p.pid, current_time))
    return completed
"""
    sub_resp = client.post(
        "/api/v1/submissions",
        headers=stud_headers,
        data={"assignment_id": asgt_id},
        files={
            "file": (
                "scheduler.py",
                io.BytesIO(os_code.encode("utf-8")),
                "text/x-python",
            )
        },
    )
    sub_id = sub_resp.json()["id"]

    # 5. Professor Views Submissions (FR-20)
    subs_list = client.get(f"/api/v1/submissions/assignment/{asgt_id}", headers=prof_headers)
    assert subs_list.status_code == 200
    assert len(subs_list.json()) == 1
    assert subs_list.json()[0]["file_name"] == "scheduler.py"

    # 6. Run AI Evaluation (FR-15, AI-01, AI-02, AI-03, AI-04)
    eval_resp = client.post(f"/api/v1/evaluations/run/{sub_id}", headers=prof_headers)
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    eval_id = eval_data["id"]

    # Academic Integrity Rule: Status MUST be tentative (FR-22, NFR-05)
    assert eval_data["status"] == "tentative"
    assert eval_data["total_score"] > 0
    assert len(eval_data["scores"]) == 2

    # 7. Professor reviews system-generated evaluation (FR-20)
    review_view = client.get(f"/api/v1/evaluations/{eval_id}", headers=prof_headers)
    assert review_view.status_code == 200

    # 8. Professor modifies scores and feedback with academic reasoning (FR-21)
    target_crit = eval_data["scores"][0]
    review_action = client.post(
        f"/api/v1/evaluations/{eval_id}/review",
        headers=prof_headers,
        json={
            "summary_feedback": "Outstanding implementation of Round Robin scheduler using deque.",
            "overrides": [
                {
                    "criterion_id": target_crit["criterion_id"],
                    "final_score": 9.8,
                    "feedback": "Clean deque-based circular queue with precise quantum decrement.",
                    "override_reason": "Elegant complexity and edge-case handling",
                }
            ],
            "finalize": True,
        },
    )
    assert review_action.status_code == 200
    released_data = review_action.json()
    assert released_data["status"] == "finalized"
    assert released_data["scores"][0]["final_score"] == 9.8
    assert released_data["scores"][0]["is_overridden"] is True

    # 9. Verify History Audit (FR-24, NFR-22)
    history_resp = client.get(f"/api/v1/evaluations/{eval_id}/history", headers=prof_headers)
    assert history_resp.status_code == 200
    assert len(history_resp.json()) == 2

    # 10. Check Evaluation Quality & Analytics Metrics (AI-08)
    metrics_resp = client.get("/api/v1/metrics", headers=prof_headers)
    assert metrics_resp.status_code == 200
    metrics = metrics_resp.json()
    assert metrics["total_evaluations"] >= 1
    assert metrics["finalized_count"] >= 1
    assert metrics["rubric_coverage_pct"] == 100.0
    assert metrics["retrieval_quality_avg_similarity"] > 0
    assert metrics["feedback_quality_evidence_pct"] > 0
