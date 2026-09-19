from typing import Optional
from sqlmodel import Session
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.repositories.user import user_repo


def register_user(session: Session, username: str, email: str, password: str, role: str) -> User:
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        role=role,
    )
    return user_repo.create(session, user)


def authenticate_user(session: Session, username: str, password: str) -> Optional[User]:
    user = user_repo.get_by_username(session, username)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def generate_user_token(user: User) -> str:
    return create_access_token({"sub": user.username, "role": user.role, "id": user.id})
