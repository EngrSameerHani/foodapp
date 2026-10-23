from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.models.order import Order
from app.models.voucher import Voucher
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.order import (
    OrderOut,
    OrderPlaceRequest,
    OrderStatusUpdate,
    ReviewCreate,
    ReviewOut,
    VoucherValidateRequest,
    VoucherValidateResponse,
)
from app.services import order_service
from app.websockets.manager import ws_manager

router = APIRouter(tags=["orders"])


@router.post("/orders", response_model=OrderOut, status_code=201)
async def place_order(
    body: OrderPlaceRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    if payload["role"] != "customer":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Customers only.")
    order = await order_service.place_order(
        customer_id=payload["sub"],
        address_id=body.address_id,
        payment_method=body.payment_method,
        delivery_note=body.delivery_note,
        voucher_code=body.voucher_code,
        db=db,
    )
    result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    return result.scalar_one()


@router.get("/orders", response_model=PaginatedResponse[OrderOut])
async def list_orders(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=50),
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    role = payload["role"]
    user_id = payload["sub"]

    q = select(Order).options(selectinload(Order.items)).order_by(Order.created_at.desc())

    if role == "customer":
        q = q.where(Order.customer_id == user_id)
    elif role == "restaurant_owner":
        from app.models.restaurant import Restaurant
        rest_result = await db.execute(select(Restaurant).where(Restaurant.owner_id == user_id))
        rest = rest_result.scalar_one_or_none()
        if not rest:
            return {"data": [], "meta": {"page": page, "limit": limit, "total": 0, "pages": 1}}
        q = q.where(Order.restaurant_id == rest.id)
    elif role == "rider":
        q = q.where(Order.rider_id == user_id)

    all_result = await db.execute(q)
    all_orders = all_result.scalars().all()
    total = len(all_orders)
    offset = (page - 1) * limit
    page_items = all_orders[offset: offset + limit]

    return {
        "data": page_items,
        "meta": {"page": page, "limit": limit, "total": total, "pages": max(1, (total + limit - 1) // limit)},
    }


@router.get("/orders/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id).options(selectinload(Order.items))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    user_id = payload["sub"]
    role = payload["role"]
    if role == "customer" and order.customer_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    if role == "rider" and order.rider_id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    return order


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    order = await order_service.transition_order(
        order_id=order_id,
        new_status=body.status.upper(),
        actor_role=payload["role"],
        actor_id=payload["sub"],
        rejection_reason=body.rejection_reason,
        db=db,
        ws_manager=ws_manager,
    )
    result = await db.execute(
        select(Order).where(Order.id == order.id).options(selectinload(Order.items))
    )
    return result.scalar_one()


# ---------------------------------------------------------------------------
# Vouchers
# ---------------------------------------------------------------------------

@router.post("/vouchers/validate", response_model=VoucherValidateResponse)
async def validate_voucher(
    body: VoucherValidateRequest,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timezone
    result = await db.execute(
        select(Voucher).where(Voucher.code == body.code.upper(), Voucher.is_active.is_(True))
    )
    voucher = result.scalar_one_or_none()
    if not voucher:
        raise HTTPException(status_code=400, detail="Invalid voucher code.")
    if voucher.expires_at and datetime.now(timezone.utc) > voucher.expires_at:
        raise HTTPException(status_code=400, detail="Voucher expired.")
    if voucher.max_uses is not None and voucher.used_count >= voucher.max_uses:
        raise HTTPException(status_code=400, detail="Voucher usage limit reached.")
    if body.subtotal < float(voucher.min_order):
        raise HTTPException(status_code=400, detail=f"Minimum order ${voucher.min_order:.2f} required.")

    if voucher.discount_type == "percent":
        discount = round(body.subtotal * float(voucher.value) / 100, 2)
    else:
        discount = min(float(voucher.value), body.subtotal)

    return VoucherValidateResponse(
        code=voucher.code,
        discount_type=voucher.discount_type,
        value=float(voucher.value),
        discount_amount=discount,
    )


# ---------------------------------------------------------------------------
# Reviews
# ---------------------------------------------------------------------------

@router.post("/reviews", response_model=ReviewOut, status_code=201)
async def create_review(
    body: ReviewCreate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    from app.models.review import Review

    # Verify order belongs to customer and is delivered
    result = await db.execute(select(Order).where(Order.id == body.order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    if order.customer_id != payload["sub"]:
        raise HTTPException(status_code=403, detail="Forbidden.")
    if order.status != "DELIVERED":
        raise HTTPException(status_code=400, detail="Can only review delivered orders.")

    # Prevent duplicate
    existing = await db.execute(select(Review).where(Review.order_id == body.order_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Review already submitted.")

    if not 1 <= body.restaurant_rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")

    review = Review(
        order_id=body.order_id,
        reviewer_id=payload["sub"],
        restaurant_id=order.restaurant_id,
        rider_id=order.rider_id,
        restaurant_rating=body.restaurant_rating,
        rider_rating=body.rider_rating,
        comment=body.comment,
    )
    db.add(review)

    # Update restaurant rating
    from app.models.restaurant import Restaurant
    rest = await db.execute(select(Restaurant).where(Restaurant.id == order.restaurant_id))
    restaurant = rest.scalar_one_or_none()
    if restaurant:
        new_count = restaurant.review_count + 1
        new_rating = ((restaurant.rating * restaurant.review_count) + body.restaurant_rating) / new_count
        restaurant.rating = round(new_rating, 2)
        restaurant.review_count = new_count

    await db.flush()
    return review
