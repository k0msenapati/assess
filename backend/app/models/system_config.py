from datetime import datetime, timezone
from typing import Optional
from sqlmodel import SQLModel, Field


class SystemConfig(SQLModel, table=True):
    __tablename__ = "system_config"
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(index=True, unique=True)
    value: str
    description: Optional[str] = None
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
