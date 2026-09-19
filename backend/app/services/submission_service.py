import os
from typing import Optional, List, Dict, Any
from sqlmodel import Session, select
from app.models.submission import Submission, SubmissionStatus
from app.models.assignment import Assignment
from app.models.user import User
from app.models.evaluation import Evaluation
from app.repositories.submission import submission_repo
from app.services.doc_processor import process_submission_file


def create_submission(
    session: Session,
    assignment_id: int,
    student_id: int,
    file_name: str,
    file_path: str,
    file_type: str,
    file_size_bytes: int,
) -> Submission:
    existing = submission_repo.get_by_student_and_assignment(session, student_id, assignment_id)
    if existing:
        existing.file_name = file_name
        existing.file_path = file_path
        existing.file_type = file_type
        existing.file_size_bytes = file_size_bytes
        existing.status = SubmissionStatus.SUBMITTED
        return submission_repo.update(session, existing)

    sub = Submission(
        assignment_id=assignment_id,
        student_id=student_id,
        file_name=file_name,
        file_path=file_path,
        file_type=file_type,
        file_size_bytes=file_size_bytes,
        status=SubmissionStatus.SUBMITTED,
    )
    return submission_repo.create(session, sub)


def get_submission_detail(session: Session, submission_id: int) -> Optional[Dict[str, Any]]:
    sub = submission_repo.get(session, submission_id)
    if not sub:
        return None
    student = session.get(User, sub.student_id)
    asgt = session.get(Assignment, sub.assignment_id)
    evaluation = session.exec(select(Evaluation).where(Evaluation.submission_id == sub.id)).first()

    return {
        "submission": sub,
        "student_username": student.username if student else "Unknown",
        "assignment_title": asgt.title if asgt else "Unknown",
        "evaluation_id": evaluation.id if evaluation else None,
        "total_score": evaluation.total_score if evaluation else None,
        "total_max_score": evaluation.total_max_score if evaluation else None,
    }


def list_assignment_submissions(session: Session, assignment_id: int) -> List[Dict[str, Any]]:
    subs = submission_repo.list_by_assignment(session, assignment_id)
    results = []
    for s in subs:
        detail = get_submission_detail(session, s.id)  # type: ignore
        if detail:
            results.append(detail)
    return results


def list_student_submissions(session: Session, student_id: int) -> List[Dict[str, Any]]:
    subs = submission_repo.list_by_student(session, student_id)
    results = []
    for s in subs:
        detail = get_submission_detail(session, s.id)  # type: ignore
        if detail:
            results.append(detail)
    return results


def read_submission_raw_content(sub: Submission) -> str:
    if not os.path.exists(sub.file_path):
        return "File content not found on server."
    return process_submission_file(sub.file_path, sub.file_type)
