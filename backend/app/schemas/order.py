from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel


class CartItemCreate(BaseModel):
    item_id: str
    quantity: int = 1
    selected_options: List[Dict[str, Any]] = []
    special_note: Optional[str] = None


class CartItemOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    item_id: str
    quantity: int
    selected_options: List[Dict[str, Any]]
    special_note: Optional[str]
    # Computed fields added in service layer
    item_name: str = ""
    unit_price: float = 0.0
    line_total: float = 0.0


class CartOut(BaseModel):
    restaurant_id: Optional[str]
    restaurant_name: str = ""
    items: List[CartItemOut]
    subtotal: float
    delivery_fee: float
    service_fee: float
    tax: float
    total: float


class CartUpdateRequest(BaseModel):
    restaurant_id: str
    items: List[CartItemCreate]


class OrderPlaceRequest(BaseModel):
    address_id: str
    payment_method: str = "cash"
    delivery_note: Optional[str] = None
    voucher_code: Optional[str] = None


class OrderItemOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    item_id: str
    item_name: str
    quantity: int
    unit_price: float
    options_snapshot: List[Dict[str, Any]]
    special_note: Optional[str]


class OrderOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    order_number: str
    customer_id: str
    restaurant_id: str
    rider_id: Optional[str]
    status: str
    subtotal: float
    delivery_fee: float
    service_fee: float
    tax: float
    discount: float
    total: float
    payment_method: str
    payment_status: str
    delivery_note: Optional[str]
    rejection_reason: Optional[str]
    delivery_address_snapshot: Optional[Dict[str, Any]]
    estimated_delivery_minutes: Optional[int]
    items: List[OrderItemOut] = []
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None


class VoucherValidateRequest(BaseModel):
    code: str
    subtotal: float


class VoucherValidateResponse(BaseModel):
    code: str
    discount_type: str
    value: float
    discount_amount: float


class ReviewCreate(BaseModel):
    order_id: str
    restaurant_rating: int  # 1-5
    rider_rating: Optional[int] = None
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    model_config = {"from_attributes": True}
    id: str
    order_id: str
    restaurant_rating: int
    rider_rating: Optional[int]
    comment: Optional[str]
    created_at: datetime
