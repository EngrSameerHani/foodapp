from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class UserOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    phone: str
    name: Optional[str]
    avatar_url: Optional[str]
    role: str
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    expo_push_token: Optional[str] = None
