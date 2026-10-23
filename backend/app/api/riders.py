from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_rider
from app.models.rider import RiderLocation, RiderProfile
from app.schemas.rider import (
    NotificationOut,
    RiderLocationUpdate,
    RiderProfileOut,
    RiderStatusUpdate,
)
from app.websockets.manager import ws_manager

router = APIRouter(prefix="/rider", tags=["rider"])


async def _get_rider_profile(user_id: str, db: AsyncSession) -> RiderProfile:
    result = await db.execute(select(RiderProfile).where(RiderProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rider profile not found.")
    return profile


@router.get("/profile", response_model=RiderProfileOut)
async def get_rider_profile(
    payload: dict = Depends(require_rider),
    db: AsyncSession = Depends(get_db),
):
    return await _get_rider_profile(payload["sub"], db)


@router.patch("/status", response_model=RiderProfileOut)
async def update_rider_status(
    body: RiderStatusUpdate,
    payload: dict = Depends(require_rider),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_rider_profile(payload["sub"], db)
    profile.is_online = body.is_online
    if not body.is_online:
        profile.is_available = False
    else:
        profile.is_available = True
    await db.flush()
    return profile


@router.put("/location")
async def update_rider_location(
    body: RiderLocationUpdate,
    payload: dict = Depends(require_rider),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_rider_profile(payload["sub"], db)

    result = await db.execute(
        select(RiderLocation).where(RiderLocation.rider_id == profile.id)
    )
    loc = result.scalar_one_or_none()
    if loc:
        loc.lat = body.lat
        loc.lng = body.lng
    else:
        loc = RiderLocation(rider_id=profile.id, lat=body.lat, lng=body.lng)
        db.add(loc)
    await db.flush()

    # Broadcast location to any active order room for this rider
    from app.models.order import Order
    active_statuses = ["PICKED_UP", "ON_THE_WAY"]
    orders_result = await db.execute(
        select(Order).where(
            Order.rider_id == payload["sub"],
            Order.status.in_(active_statuses),
        )
    )
    for order in orders_result.scalars().all():
        await ws_manager.broadcast(
            f"order_{order.id}",
            {"type": "rider_location", "lat": body.lat, "lng": body.lng},
        )

    return {"status": "ok"}


@router.get("/deliveries")
async def get_delivery_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=50),
    payload: dict = Depends(require_rider),
    db: AsyncSession = Depends(get_db),
):
    from app.models.order import Order
    from app.schemas.order import OrderOut
    from sqlalchemy.orm import selectinload

    q = (
        select(Order)
        .where(Order.rider_id == payload["sub"], Order.status == "DELIVERED")
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    result = await db.execute(q)
    all_orders = result.scalars().all()
    total = len(all_orders)
    offset = (page - 1) * limit
    page_items = all_orders[offset: offset + limit]
    total_earnings = sum(float(o.delivery_fee) for o in all_orders)

    return {
        "data": [OrderOut.model_validate(o) for o in page_items],
        "meta": {"page": page, "limit": limit, "total": total, "pages": max(1, (total + limit - 1) // limit)},
        "total_earnings": round(total_earnings, 2),
    }
