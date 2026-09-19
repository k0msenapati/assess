import os
import json
from datetime import datetime, timezone
from sqlmodel import Session
from app.core.db import engine, init_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.assignment import Assignment, RubricCriterion
from app.models.submission import Submission, SubmissionStatus
from app.models.evaluation import Evaluation, CriterionScore
from app.services.chunking import chunk_submission
from app.services.vector_store import index_submission_chunks


def seed_database():
    init_db()
    with Session(engine) as session:
        print("--- Seeding Users ---")
        users_to_create = [
            ("admin", "admin@university.edu", "password123", UserRole.ADMIN),
            (
                "professor",
                "professor@university.edu",
                "password123",
                UserRole.PROFESSOR,
            ),
            ("prof_alan", "alan.turing@outr.ac.in", "password123", UserRole.PROFESSOR),
            ("student", "student@university.edu", "password123", UserRole.STUDENT),
            ("student_ada", "ada.lovelace@outr.ac.in", "password123", UserRole.STUDENT),
            (
                "student_rohan",
                "rohan.sharma@outr.ac.in",
                "password123",
                UserRole.STUDENT,
            ),
            (
                "student_priya",
                "priya.patel@outr.ac.in",
                "password123",
                UserRole.STUDENT,
            ),
        ]

        user_map = {}
        for username, email, pwd, role in users_to_create:
            existing = session.query(User).filter(User.username == username).first()
            if not existing:
                u = User(
                    username=username,
                    email=email,
                    hashed_password=hash_password(pwd),
                    role=role,
                )
                session.add(u)
                session.commit()
                session.refresh(u)
                user_map[username] = u
                print(f"Created user: {username} ({role})")
            else:
                user_map[username] = existing

        prof1 = user_map["professor"]
        prof2 = user_map["prof_alan"]
        stud_ada = user_map["student_ada"]
        stud_rohan = user_map["student_rohan"]
        stud_priya = user_map["student_priya"]

        print("\n--- Seeding Assignments & Rubrics ---")
        assignments_spec = [
            {
                "key": "asgt_avl",
                "title": "CS301: Self-Balancing AVL Tree Implementation",
                "description": (
                    "Implement a robust self-balancing AVL Tree in Python with complete insertion and rebalancing routines.\n"
                    "Address all 4 rotation scenarios (LL, RR, LR, RL) and provide docstrings analyzing asymptotic complexities."
                ),
                "allowed_types": "py,txt",
                "max_file_size_mb": 10,
                "creator": prof1,
                "rubric": [
                    {
                        "name": "Algorithm Correctness & Rotations",
                        "description": "Accurately calculates balance factors and executes rotations preserving BST invariants.",
                        "max_marks": 10.0,
                        "weight": 0.5,
                    },
                    {
                        "name": "Complexity Analysis & Invariants",
                        "description": "Correct O(log n) worst-case time complexity explanations and height guarantees.",
                        "max_marks": 5.0,
                        "weight": 0.25,
                    },
                    {
                        "name": "Code Architecture & Modularity",
                        "description": "Clean separation of node representation, clean recursive helper functions, and docstrings.",
                        "max_marks": 5.0,
                        "weight": 0.25,
                    },
                ],
            },
            {
                "key": "asgt_os",
                "title": "CS402: Preemptive Round-Robin CPU Scheduler",
                "description": (
                    "Construct a preemptive CPU scheduler simulating Round-Robin dispatch with configurable time quanta.\n"
                    "Calculate average waiting times, turnaround times, and total context switch count."
                ),
                "allowed_types": "py,txt",
                "max_file_size_mb": 10,
                "creator": prof2,
                "rubric": [
                    {
                        "name": "Queue Logic & Preemption",
                        "description": "Proper ready queue dequeuing, quantum enforcement, and process re-enqueueing.",
                        "max_marks": 10.0,
                        "weight": 0.4,
                    },
                    {
                        "name": "Metrics Accuracy (TAT & WT)",
                        "description": "Mathematical correctness of completion, turnaround, and waiting time formulas.",
                        "max_marks": 10.0,
                        "weight": 0.4,
                    },
                    {
                        "name": "Clean Architecture & Types",
                        "description": "Dataclasses for Process Control Blocks and structured output.",
                        "max_marks": 5.0,
                        "weight": 0.2,
                    },
                ],
            },
            {
                "key": "asgt_nlp",
                "title": "CS503: Transformer Multi-Head Self-Attention Report",
                "description": (
                    "Submit an academic report analyzing the mathematical formulation of Scaled Dot-Product Attention,\n"
                    "Multi-Head projections, computational complexity, and empirical ROUGE summarization performance."
                ),
                "allowed_types": "txt,pdf",
                "max_file_size_mb": 15,
                "creator": prof1,
                "rubric": [
                    {
                        "name": "Mathematical Rigor & Formulation",
                        "description": "Accurate matrix formulas for Scaled Dot-Product Attention and Multi-Head projection.",
                        "max_marks": 10.0,
                        "weight": 0.5,
                    },
                    {
                        "name": "Empirical Benchmarking (ROUGE)",
                        "description": "Experimental discussion of ROUGE-1/2/L metrics and layer complexity comparisons.",
                        "max_marks": 5.0,
                        "weight": 0.25,
                    },
                    {
                        "name": "Academic Citations & Literature",
                        "description": "Appropriate references to foundational literature (Vaswani et al., Devlin et al.).",
                        "max_marks": 5.0,
                        "weight": 0.25,
                    },
                ],
            },
        ]

        assignment_map = {}
        criteria_map = {}

        for aspec in assignments_spec:
            asgt = session.query(Assignment).filter(Assignment.title == aspec["title"]).first()
            if not asgt:
                asgt = Assignment(
                    title=aspec["title"],
                    description=aspec["description"],
                    allowed_types=aspec["allowed_types"],
                    max_file_size_mb=aspec["max_file_size_mb"],
                    created_by=aspec["creator"].id,
                )
                session.add(asgt)
                session.commit()
                session.refresh(asgt)
                print(f"Created Assignment: {asgt.title} (ID: {asgt.id})")

                asgt_criteria = []
                for r in aspec["rubric"]:
                    c = RubricCriterion(
                        assignment_id=asgt.id,
                        name=r["name"],
                        description=r["description"],
                        max_marks=r["max_marks"],
                        weight=r["weight"],
                        levels_json="[]",
                    )
                    session.add(c)
                    session.commit()
                    session.refresh(c)
                    asgt_criteria.append(c)
                criteria_map[asgt.id] = asgt_criteria
            else:
                asgt_criteria = (
                    session.query(RubricCriterion)
                    .filter(RubricCriterion.assignment_id == asgt.id)
                    .all()
                )
                criteria_map[asgt.id] = asgt_criteria
            assignment_map[aspec["key"]] = asgt

        print("\n--- Seeding Submissions & Evaluations ---")
        base_uploads_dir = os.path.abspath("./uploads")
        os.makedirs(base_uploads_dir, exist_ok=True)

        submissions_spec = [
            {
                "file_name": "avl_tree_sub1.py",
                "student": stud_ada,
                "assignment": assignment_map["asgt_avl"],
                "status": SubmissionStatus.FINALIZED,
                "file_type": "py",
                "is_finalized": True,
                "override_note": "Exceptional AVL rotation clarity. Restored +0.5 pts.",
                "scores_data": [
                    {
                        "crit_idx": 0,
                        "tentative": 9.5,
                        "final": 10.0,
                        "is_overridden": True,
                        "evidence": [
                            "Lines 45-78: _rotate_left and _rotate_right accurately update heights"
                        ],
                        "feedback": "Flawless rotation implementations handling LL, RR, LR, and RL.",
                    },
                    {
                        "crit_idx": 1,
                        "tentative": 4.8,
                        "final": 4.8,
                        "is_overridden": False,
                        "evidence": ["Lines 85-92: Docstrings detail O(log n) bound"],
                        "feedback": "Clear explanation of height balancing invariants.",
                    },
                    {
                        "crit_idx": 2,
                        "tentative": 4.7,
                        "final": 4.7,
                        "is_overridden": False,
                        "evidence": ["Lines 8-15: AVLNode dataclass separation"],
                        "feedback": "Clean modular architecture with robust typing.",
                    },
                ],
                "summary": "Exemplary submission with mathematically sound AVL rotation routines and meticulous documentation.",
                "strengths": [
                    "Comprehensive LL, RR, LR, and RL rotation cases",
                    "Precise O(log n) time complexity guarantees",
                ],
                "improvements": ["Consider adding unit test suite for bulk randomized insertions"],
            },
            {
                "file_name": "bst_with_edge_bug_sub2.py",
                "student": stud_rohan,
                "assignment": assignment_map["asgt_avl"],
                "status": SubmissionStatus.FINALIZED,
                "file_type": "py",
                "is_finalized": True,
                "override_note": "Confirmed edge-case bug in successor deletion. Finalized with penalty.",
                "scores_data": [
                    {
                        "crit_idx": 0,
                        "tentative": 7.0,
                        "final": 6.5,
                        "is_overridden": True,
                        "evidence": [
                            "Line 68: node.right = successor.right missing recursive delete"
                        ],
                        "feedback": "Deletion routine fails to properly detach successor node from right subtree.",
                    },
                    {
                        "crit_idx": 1,
                        "tentative": 4.0,
                        "final": 4.0,
                        "is_overridden": False,
                        "evidence": ["Lines 52-57: Mentions recursion"],
                        "feedback": "Adequate complexity reasoning, but lacks depth regarding worst-case degenerate trees.",
                    },
                    {
                        "crit_idx": 2,
                        "tentative": 4.0,
                        "final": 4.0,
                        "is_overridden": False,
                        "evidence": ["Lines 14-25: Clean insertion loop"],
                        "feedback": "Well structured iteratively for insertion.",
                    },
                ],
                "summary": "Good baseline BST implementation, though deletion suffers from a subtle successor reference defect.",
                "strengths": [
                    "Clean iterative insertion logic",
                    "Good variable naming conventions",
                ],
                "improvements": [
                    "Fix the two-children deletion case to recursively delete the inorder successor"
                ],
            },
            {
                "file_name": "round_robin_os_sub3.py",
                "student": stud_priya,
                "assignment": assignment_map["asgt_os"],
                "status": SubmissionStatus.TENTATIVE,
                "file_type": "py",
                "is_finalized": False,
                "override_note": None,
                "scores_data": [
                    {
                        "crit_idx": 0,
                        "tentative": 9.0,
                        "final": 9.0,
                        "is_overridden": False,
                        "evidence": ["Lines 45-60: deque popleft and context switch tracker"],
                        "feedback": "Effective round robin preemption using double-ended queue.",
                    },
                    {
                        "crit_idx": 1,
                        "tentative": 9.2,
                        "final": 9.2,
                        "is_overridden": False,
                        "evidence": ["Lines 68-75: completion_time - arrival_time calculation"],
                        "feedback": "Precise waiting and turnaround time statistics.",
                    },
                    {
                        "crit_idx": 2,
                        "tentative": 4.8,
                        "final": 4.8,
                        "is_overridden": False,
                        "evidence": ["Lines 10-18: ProcessControlBlock dataclass"],
                        "feedback": "Elegant PCB data structure encapsulation.",
                    },
                ],
                "summary": "Tentative automated evaluation: Highly structured Round-Robin simulation with accurate metrics calculation.",
                "strengths": [
                    "Robust PCB state tracking",
                    "Accurate turnaround and waiting time formulas",
                ],
                "improvements": ["Consider supporting priority preemption as an extension"],
            },
            {
                "file_name": "nlp_transformer_essay_sub4.txt",
                "student": stud_ada,
                "assignment": assignment_map["asgt_nlp"],
                "status": SubmissionStatus.TENTATIVE,
                "file_type": "txt",
                "is_finalized": False,
                "override_note": None,
                "scores_data": [
                    {
                        "crit_idx": 0,
                        "tentative": 9.2,
                        "final": 9.2,
                        "is_overridden": False,
                        "evidence": [
                            "Section 1: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V"
                        ],
                        "feedback": "Rigorous matrix equations and clear rationale for scaling factor.",
                    },
                    {
                        "crit_idx": 1,
                        "tentative": 4.6,
                        "final": 4.6,
                        "is_overridden": False,
                        "evidence": ["Section 3: ROUGE-1 41.82, ROUGE-2 18.96 on CNN/DailyMail"],
                        "feedback": "Concrete empirical evaluation with standard NLP summarization benchmarks.",
                    },
                    {
                        "crit_idx": 2,
                        "tentative": 4.7,
                        "final": 4.7,
                        "is_overridden": False,
                        "evidence": ["Section 4: Vaswani et al. (2017), Devlin et al. (2018)"],
                        "feedback": "Authoritative citations to foundational academic literature.",
                    },
                ],
                "summary": "Tentative automated evaluation: Thorough technical analysis of Multi-Head Attention mechanisms with empirical results.",
                "strengths": [
                    "Exact mathematical attention formulations",
                    "Empirical ROUGE convergence data",
                ],
                "improvements": [
                    "Could compare sparse attention vs full self-attention complexity"
                ],
            },
        ]

        for s_spec in submissions_spec:
            file_path = os.path.join(base_uploads_dir, s_spec["file_name"])
            if not os.path.exists(file_path):
                print(f"Skipping submission for missing file: {file_path}")
                continue

            file_size = os.path.getsize(file_path)
            asgt = s_spec["assignment"]
            student = s_spec["student"]

            sub = (
                session.query(Submission)
                .filter(
                    Submission.assignment_id == asgt.id,
                    Submission.student_id == student.id,
                    Submission.file_name == s_spec["file_name"],
                )
                .first()
            )

            if not sub:
                sub = Submission(
                    assignment_id=asgt.id,
                    student_id=student.id,
                    file_name=s_spec["file_name"],
                    file_path=file_path,
                    file_type=s_spec["file_type"],
                    file_size_bytes=file_size,
                    submitted_at=datetime.now(timezone.utc),
                    status=s_spec["status"],
                )
                session.add(sub)
                session.commit()
                session.refresh(sub)
                print(
                    f"Created Submission: {sub.file_name} for Student {student.username} (ID: {sub.id})"
                )

                # Index submission chunks into ChromaDB
                try:
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                        code_content = f.read()
                    chunks = chunk_submission(code_content, s_spec["file_type"])
                    index_submission_chunks(sub.id, chunks)
                    print(f"  Indexed {len(chunks)} chunks into ChromaDB for submission {sub.id}")
                except Exception as e:
                    print(f"  Vector indexing warning: {e}")

                # Create Evaluation
                eval_criteria = criteria_map.get(asgt.id, [])
                total_final = sum(sd["final"] for sd in s_spec["scores_data"])
                total_max = sum(c.max_marks for c in eval_criteria)

                evaluation = Evaluation(
                    submission_id=sub.id,
                    status="finalized" if s_spec["is_finalized"] else "tentative",
                    total_score=round(total_final, 2),
                    total_max_score=round(total_max, 2),
                    summary_feedback=s_spec["summary"],
                    strengths_json=json.dumps(s_spec["strengths"]),
                    improvements_json=json.dumps(s_spec["improvements"]),
                    evaluated_at=datetime.now(timezone.utc),
                    reviewed_at=datetime.now(timezone.utc) if s_spec["is_finalized"] else None,
                    reviewer_id=prof1.id if s_spec["is_finalized"] else None,
                )
                session.add(evaluation)
                session.commit()
                session.refresh(evaluation)

                # Save Criterion Scores
                for s_data in s_spec["scores_data"]:
                    idx = s_data["crit_idx"]
                    crit_obj = eval_criteria[idx] if idx < len(eval_criteria) else eval_criteria[0]
                    c_score = CriterionScore(
                        evaluation_id=evaluation.id,
                        criterion_id=crit_obj.id,
                        tentative_score=s_data["tentative"],
                        final_score=s_data["final"],
                        feedback=s_data["feedback"],
                        evidence_quotes_json=json.dumps(s_data["evidence"]),
                        deductions_json=json.dumps([]),
                        confidence=0.95,
                        is_overridden=s_data["is_overridden"],
                        override_reason=s_spec["override_note"]
                        if s_data["is_overridden"]
                        else None,
                    )
                    session.add(c_score)
                session.commit()
                print(
                    f"  Created Evaluation (Status: {evaluation.status}, Score: {evaluation.total_score}/{evaluation.total_max_score})"
                )

        print("\n=== Seeding Finished Successfully ===")


if __name__ == "__main__":
    seed_database()
