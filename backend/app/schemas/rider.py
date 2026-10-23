from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class RiderStatusUpdate(BaseModel):
    is_online: bool


class RiderLocationUpdate(BaseModel):
    lat: float
    lng: float


class RiderProfileOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    user_id: str
    vehicle_type: str
    is_online: bool
    is_available: bool
    total_deliveries: int
    total_earnings: float
    rating: float


class NotificationOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    title: str
    body: str
    type: str
    is_read: bool
    created_at: datetime
