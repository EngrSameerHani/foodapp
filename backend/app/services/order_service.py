"""Order placement, state machine, and rider assignment."""
import math
import random
import string
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models.cart import Cart, CartItem
from app.models.order import Order, OrderItem
from app.models.restaurant import MenuItem, Restaurant
from app.models.rider import RiderLocation, RiderProfile
from app.models.voucher import Voucher
from app.services.geo_service import haversine_km, calculate_delivery_fee
from app.services.notification_service import send_order_notification

# ---------------------------------------------------------------------------
# State machine
# ---------------------------------------------------------------------------

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    "PLACED":            {"ACCEPTED", "REJECTED", "CANCELLED"},
    "ACCEPTED":          {"PREPARING", "CANCELLED"},
    "PREPARING":         {"READY_FOR_PICKUP"},
    "READY_FOR_PICKUP":  {"PICKED_UP"},
    "PICKED_UP":         {"ON_THE_WAY"},
    "ON_THE_WAY":        {"DELIVERED", "FAILED"},
    "DELIVERED":         set(),
    "FAILED":            set(),
    "REJECTED":          set(),
    "CANCELLED":         set(),
}

# Who can trigger which status
ROLE_STATUS_MAP: dict[str, set[str]] = {
    "restaurant_owner": {"ACCEPTED", "REJECTED", "PREPARING", "READY_FOR_PICKUP"},
    "rider":            {"PICKED_UP", "ON_THE_WAY", "DELIVERED", "FAILED"},
    "customer":         {"CANCELLED"},
}


def _generate_order_number() -> str:
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ZF-{suffix}"


async def place_order(
    customer_id: str,
    address_id: str,
    payment_method: str,
    delivery_note: Optional[str],
    voucher_code: Optional[str],
    db: AsyncSession,
) -> Order:
    # Load cart
    cart_result = await db.execute(
        select(Cart)
        .where(Cart.customer_id == customer_id)
        .options(selectinload(Cart.items).selectinload(CartItem.menu_item))
    )
    cart: Cart | None = cart_result.scalar_one_or_none()
    if not cart or not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty.")

    # Load restaurant
    restaurant_result = await db.execute(
        select(Restaurant).where(Restaurant.id == cart.restaurant_id)
    )
    restaurant: Restaurant | None = restaurant_result.scalar_one_or_none()
    if not restaurant or not restaurant.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Restaurant unavailable.")

    # Load address
    from app.models.address import Address
    addr_result = await db.execute(
        select(Address).where(Address.id == address_id, Address.user_id == customer_id)
    )
    address = addr_result.scalar_one_or_none()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    # Compute pricing
    subtotal = 0.0
    order_items = []
    for ci in cart.items:
        item_price = float(ci.menu_item.price)
        options_delta = sum(float(o.get("price_delta", 0)) for o in (ci.selected_options or []))
        unit_price = item_price + options_delta
        line_total = unit_price * ci.quantity
        subtotal += line_total
        order_items.append(
            OrderItem(
                item_id=ci.item_id,
                item_name=ci.menu_item.name,
                quantity=ci.quantity,
                unit_price=unit_price,
                options_snapshot=ci.selected_options or [],
                special_note=ci.special_note,
            )
        )

    distance_km = haversine_km(address.lat, address.lng, restaurant.lat, restaurant.lng)
    delivery_fee = calculate_delivery_fee(
        distance_km,
        float(restaurant.delivery_fee),
        settings.PER_KM_RATE,
    )
    service_fee = settings.SERVICE_FEE
    tax = round(subtotal * settings.TAX_RATE, 2)

    # Voucher
    discount = 0.0
    if voucher_code:
        discount = await _apply_voucher(voucher_code, subtotal, db)

    total = round(subtotal + delivery_fee + service_fee + tax - discount, 2)

    order = Order(
        order_number=_generate_order_number(),
        customer_id=customer_id,
        restaurant_id=cart.restaurant_id,
        address_id=address_id,
        status="PLACED",
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        service_fee=service_fee,
        tax=tax,
        discount=discount,
        total=total,
        payment_method=payment_method,
        delivery_note=delivery_note,
        voucher_code=voucher_code,
        delivery_address_snapshot={
            "full_address": address.full_address,
            "lat": address.lat,
            "lng": address.lng,
        },
        estimated_delivery_minutes=restaurant.estimated_delivery_minutes,
        items=order_items,
    )
    db.add(order)
    await db.flush()

    # Clear cart
    for ci in cart.items:
        await db.delete(ci)
    cart.restaurant_id = None
    await db.flush()

    # Attempt rider assignment
    await assign_nearest_rider(order, restaurant, db)

    return order


async def transition_order(
    order_id: str,
    new_status: str,
    actor_role: str,
    actor_id: str,
    rejection_reason: Optional[str],
    db: AsyncSession,
    ws_manager=None,
) -> Order:
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items))
    )
    order: Order | None = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    allowed = ALLOWED_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot transition from {order.status} to {new_status}.",
        )

    role_allowed = ROLE_STATUS_MAP.get(actor_role, set())
    if new_status not in role_allowed:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot set this status.")

    # Validate ownership
    if actor_role == "customer" and order.customer_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    if actor_role == "restaurant_owner":
        # Check restaurant ownership
        from app.models.restaurant import Restaurant
        rest_result = await db.execute(select(Restaurant).where(Restaurant.id == order.restaurant_id))
        rest = rest_result.scalar_one_or_none()
        if not rest or rest.owner_id != actor_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    if actor_role == "rider" and order.rider_id != actor_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")

    order.status = new_status
    order.updated_at = datetime.now(timezone.utc)
    if rejection_reason:
        order.rejection_reason = rejection_reason

    await db.flush()

    # Broadcast via WebSocket
    if ws_manager:
        await ws_manager.broadcast(
            f"order_{order_id}",
            {"type": "status_update", "status": new_status, "order_id": order_id},
        )

    # Send push notifications
    await send_order_notification(order, new_status, db)

    return order


async def assign_nearest_rider(order: Order, restaurant: Restaurant, db: AsyncSession) -> None:
    """Assign the nearest online/available rider within 10 km."""
    riders_result = await db.execute(
        select(RiderProfile)
        .where(RiderProfile.is_online.is_(True), RiderProfile.is_available.is_(True))
        .options(selectinload(RiderProfile.location))
    )
    riders = riders_result.scalars().all()

    best_rider = None
    best_dist = math.inf

    for rider in riders:
        if not rider.location:
            continue
        dist = haversine_km(
            rider.location.lat, rider.location.lng,
            restaurant.lat, restaurant.lng,
        )
        if dist < best_dist and dist <= 10.0:
            best_dist = dist
            best_rider = rider

    if best_rider:
        order.rider_id = best_rider.user_id
        best_rider.is_available = False
        await db.flush()


async def _apply_voucher(code: str, subtotal: float, db: AsyncSession) -> float:
    result = await db.execute(select(Voucher).where(Voucher.code == code.upper(), Voucher.is_active.is_(True)))
    voucher: Voucher | None = result.scalar_one_or_none()
    if not voucher:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid voucher code.")
    if voucher.expires_at and datetime.now(timezone.utc) > voucher.expires_at:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher expired.")
    if voucher.max_uses is not None and voucher.used_count >= voucher.max_uses:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Voucher usage limit reached.")
    if subtotal < float(voucher.min_order):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Minimum order ${voucher.min_order:.2f} required.",
        )

    if voucher.discount_type == "percent":
        discount = round(subtotal * float(voucher.value) / 100, 2)
    else:
        discount = min(float(voucher.value), subtotal)

    voucher.used_count += 1
    return discount
