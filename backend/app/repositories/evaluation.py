from typing import List, Optional
from sqlmodel import Session, select
from app.models.evaluation import Evaluation, CriterionScore, EvaluationHistory
from app.repositories.base import BaseRepository


class EvaluationRepository(BaseRepository[Evaluation]):
    def __init__(self):
        super().__init__(Evaluation)

    def get_by_submission(self, session: Session, submission_id: int) -> Optional[Evaluation]:
        return session.exec(
            select(Evaluation).where(Evaluation.submission_id == submission_id)
        ).first()

    def get_scores(self, session: Session, evaluation_id: int) -> List[CriterionScore]:
        return list(
            session.exec(
                select(CriterionScore).where(CriterionScore.evaluation_id == evaluation_id)
            ).all()
        )

    def save_score(self, session: Session, score: CriterionScore) -> CriterionScore:
        session.add(score)
        session.commit()
        session.refresh(score)
        return score

    def get_history(self, session: Session, evaluation_id: int) -> List[EvaluationHistory]:
        return list(
            session.exec(
                select(EvaluationHistory)
                .where(EvaluationHistory.evaluation_id == evaluation_id)
                .order_by(EvaluationHistory.version.desc())  # type: ignore
            ).all()
        )

    def save_history(self, session: Session, history: EvaluationHistory) -> EvaluationHistory:
        session.add(history)
        session.commit()
        session.refresh(history)
        return history


evaluation_repo = EvaluationRepository()
