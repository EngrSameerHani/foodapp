"""Push notification service — sends via Expo Push API and stores in DB."""
import logging
from typing import Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)

STATUS_MESSAGES = {
    "ACCEPTED":         ("Order Accepted! 🎉", "Your order has been accepted by the restaurant."),
    "REJECTED":         ("Order Rejected 😔", "Unfortunately your order was rejected."),
    "PREPARING":        ("Preparing Your Order 🍳", "The restaurant is preparing your food."),
    "READY_FOR_PICKUP": ("Ready for Pickup 🛵", "Your order is ready — rider is on the way!"),
    "PICKED_UP":        ("Rider Picked Up 🛵", "Your order has been picked up by the rider."),
    "ON_THE_WAY":       ("On the Way! 🗺️", "Your rider is heading to you."),
    "DELIVERED":        ("Delivered! ✅", "Enjoy your meal! Don't forget to rate your experience."),
    "CANCELLED":        ("Order Cancelled", "Your order has been cancelled."),
    "FAILED":           ("Delivery Failed", "There was an issue with your delivery. Please contact support."),
}


async def send_order_notification(order, new_status: str, db: AsyncSession) -> None:
    msg = STATUS_MESSAGES.get(new_status)
    if not msg:
        return
    title, body = msg

    # Notify customer
    await _notify_user(order.customer_id, title, body, {"order_id": order.id, "status": new_status}, db)


async def _notify_user(
    user_id: str,
    title: str,
    body: str,
    data: dict,
    db: AsyncSession,
) -> None:
    # Store in-app notification
    db.add(Notification(user_id=user_id, title=title, body=body, data=data))

    # Send push if token available
    user_result = await db.execute(select(User).where(User.id == user_id))
    user: User | None = user_result.scalar_one_or_none()
    if user and user.expo_push_token:
        await _send_expo_push(user.expo_push_token, title, body, data)


async def _send_expo_push(token: str, title: str, body: str, data: dict) -> None:
    payload = {
        "to": token,
        "title": title,
        "body": body,
        "data": data,
        "sound": "default",
    }
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(settings.EXPO_PUSH_URL, json=payload)
            resp.raise_for_status()
    except Exception as exc:
        logger.warning("Push notification failed: %s", exc)
