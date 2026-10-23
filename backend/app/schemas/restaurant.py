from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class VariationOptionSchema(BaseModel):
    name: str
    price_delta: float = 0.0


class ItemVariationOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    label: str
    is_required: bool
    is_multi_select: bool
    options: List[Dict[str, Any]]


class ItemVariationCreate(BaseModel):
    label: str
    is_required: bool = False
    is_multi_select: bool = False
    options: List[VariationOptionSchema]


class MenuItemOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    description: Optional[str]
    price: float
    photo_url: Optional[str]
    is_available: bool
    variations: List[ItemVariationOut] = []


class MenuItemCreate(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    price: float
    photo_url: Optional[str] = None
    is_available: bool = True
    variations: List[ItemVariationCreate] = []


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    photo_url: Optional[str] = None
    is_available: Optional[bool] = None


class MenuCategoryOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    sort_order: int
    items: List[MenuItemOut] = []


class MenuCategoryCreate(BaseModel):
    restaurant_id: str
    name: str
    sort_order: int = 0


class MenuCategoryUpdate(BaseModel):
    name: Optional[str] = None
    sort_order: Optional[int] = None


class RestaurantCreate(BaseModel):
    name: str
    description: Optional[str] = None
    cuisine_types: List[str] = []
    address: str
    lat: float
    lng: float
    delivery_fee: float = 2.99
    min_order: float = 10.0
    delivery_radius_km: float = 10.0
    estimated_delivery_minutes: int = 30
    opening_hours: Dict[str, Any] = {}


class RestaurantUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cuisine_types: Optional[List[str]] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    delivery_fee: Optional[float] = None
    min_order: Optional[float] = None
    delivery_radius_km: Optional[float] = None
    estimated_delivery_minutes: Optional[int] = None
    opening_hours: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class RestaurantOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    name: str
    description: Optional[str]
    cuisine_types: List[str]
    cover_url: Optional[str]
    logo_url: Optional[str]
    address: str
    lat: float
    lng: float
    rating: float
    review_count: int
    delivery_fee: float
    min_order: float
    delivery_radius_km: float
    estimated_delivery_minutes: int
    is_active: bool
    opening_hours: Dict[str, Any]
    created_at: datetime


class RestaurantWithMenuOut(RestaurantOut):
    categories: List[MenuCategoryOut] = []
