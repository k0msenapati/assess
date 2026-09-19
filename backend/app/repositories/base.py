from typing import Generic, TypeVar, Type, Optional, List
from sqlmodel import SQLModel, Session, select

ModelType = TypeVar("ModelType", bound=SQLModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: Type[ModelType]):
        self.model = model

    def get(self, session: Session, id: int) -> Optional[ModelType]:
        return session.get(self.model, id)

    def list(self, session: Session, skip: int = 0, limit: int = 100) -> List[ModelType]:
        return list(session.exec(select(self.model).offset(skip).limit(limit)).all())

    def create(self, session: Session, obj: ModelType) -> ModelType:
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    def update(self, session: Session, obj: ModelType) -> ModelType:
        session.add(obj)
        session.commit()
        session.refresh(obj)
        return obj

    def delete(self, session: Session, id: int) -> bool:
        obj = self.get(session, id)
        if not obj:
            return False
        session.delete(obj)
        session.commit()
        return True
