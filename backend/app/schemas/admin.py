from typing import Optional, Dict
from datetime import datetime
from pydantic import BaseModel


class UserRoleUpdate(BaseModel):
    role: str


class AdminUserOut(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime


class SystemConfigItem(BaseModel):
    key: str
    value: str
    description: Optional[str] = None
    updated_at: Optional[datetime] = None


class SystemConfigUpdate(BaseModel):
    configs: Dict[str, str]
