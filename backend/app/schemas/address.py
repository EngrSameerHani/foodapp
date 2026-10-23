from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AddressCreate(BaseModel):
    label: str = "Home"
    full_address: str
    lat: float
    lng: float
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    full_address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    is_default: Optional[bool] = None


class AddressOut(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    label: str
    full_address: str
    lat: float
    lng: float
    is_default: bool
    created_at: datetime
