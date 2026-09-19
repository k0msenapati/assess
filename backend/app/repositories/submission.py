from typing import List, Optional
from sqlmodel import Session, select
from app.models.submission import Submission
from app.repositories.base import BaseRepository


class SubmissionRepository(BaseRepository[Submission]):
    def __init__(self):
        super().__init__(Submission)

    def list_by_student(self, session: Session, student_id: int) -> List[Submission]:
        return list(
            session.exec(select(Submission).where(Submission.student_id == student_id)).all()
        )

    def list_by_assignment(self, session: Session, assignment_id: int) -> List[Submission]:
        return list(
            session.exec(select(Submission).where(Submission.assignment_id == assignment_id)).all()
        )

    def get_by_student_and_assignment(
        self, session: Session, student_id: int, assignment_id: int
    ) -> Optional[Submission]:
        return session.exec(
            select(Submission)
            .where(Submission.student_id == student_id)
            .where(Submission.assignment_id == assignment_id)
        ).first()


submission_repo = SubmissionRepository()
