from typing import Optional
from sqlmodel import Session, select
from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_username(self, session: Session, username: str) -> Optional[User]:
        return session.exec(select(User).where(User.username == username)).first()

    def get_by_email(self, session: Session, email: str) -> Optional[User]:
        return session.exec(select(User).where(User.email == email)).first()


user_repo = UserRepository()
