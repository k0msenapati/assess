from typing import List, Optional
from sqlmodel import Session, select
from app.models.assignment import Assignment, RubricCriterion
from app.repositories.base import BaseRepository


class AssignmentRepository(BaseRepository[Assignment]):
    def __init__(self):
        super().__init__(Assignment)

    def list_by_creator(self, session: Session, creator_id: int) -> List[Assignment]:
        return list(
            session.exec(select(Assignment).where(Assignment.created_by == creator_id)).all()
        )

    def get_criteria(self, session: Session, assignment_id: int) -> List[RubricCriterion]:
        return list(
            session.exec(
                select(RubricCriterion).where(RubricCriterion.assignment_id == assignment_id)
            ).all()
        )

    def add_criterion(self, session: Session, criterion: RubricCriterion) -> RubricCriterion:
        session.add(criterion)
        session.commit()
        session.refresh(criterion)
        return criterion

    def get_criterion(self, session: Session, criterion_id: int) -> Optional[RubricCriterion]:
        return session.get(RubricCriterion, criterion_id)

    def update_criterion(self, session: Session, criterion: RubricCriterion) -> RubricCriterion:
        session.add(criterion)
        session.commit()
        session.refresh(criterion)
        return criterion

    def delete_criterion(self, session: Session, criterion_id: int) -> bool:
        crit = session.get(RubricCriterion, criterion_id)
        if crit:
            session.delete(crit)
            session.commit()
            return True
        return False


assignment_repo = AssignmentRepository()
