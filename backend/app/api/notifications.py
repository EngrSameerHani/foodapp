from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.models.notification import Notification
from app.schemas.rider import NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[NotificationOut])
async def list_notifications(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=30, le=100),
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == payload["sub"])
        .order_by(Notification.is_read.asc(), Notification.created_at.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    )
    return result.scalars().all()


@router.patch("/{notif_id}/read", response_model=NotificationOut)
async def mark_read(
    notif_id: str,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    from fastapi import HTTPException, status
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id, Notification.user_id == payload["sub"]
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")
    notif.is_read = True
    await db.flush()
    return notif


@router.patch("/read-all", status_code=204)
async def mark_all_read(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == payload["sub"], Notification.is_read.is_(False))
        .values(is_read=True)
    )
