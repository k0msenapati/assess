from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class UserRole:
    STUDENT = "student"
    PROFESSOR = "professor"
    ADMIN = "admin"


class User(SQLModel, table=True):
    __tablename__ = "users"
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    role: str = Field(default=UserRole.STUDENT)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
