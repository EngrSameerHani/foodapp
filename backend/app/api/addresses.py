from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user_payload
from app.models.address import Address
from app.schemas.address import AddressCreate, AddressOut, AddressUpdate

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=List[AddressOut])
async def list_addresses(
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Address).where(Address.user_id == payload["sub"]).order_by(Address.is_default.desc())
    )
    return result.scalars().all()


@router.post("", response_model=AddressOut, status_code=201)
async def create_address(
    body: AddressCreate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload["sub"]
    if body.is_default:
        await db.execute(
            update(Address).where(Address.user_id == user_id).values(is_default=False)
        )
    addr = Address(user_id=user_id, **body.model_dump())
    db.add(addr)
    await db.flush()
    return addr


@router.patch("/{addr_id}", response_model=AddressOut)
async def update_address(
    addr_id: str,
    body: AddressUpdate,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    user_id = payload["sub"]
    result = await db.execute(
        select(Address).where(Address.id == addr_id, Address.user_id == user_id)
    )
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")

    if body.is_default:
        await db.execute(
            update(Address).where(Address.user_id == user_id).values(is_default=False)
        )

    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(addr, field, val)
    await db.flush()
    return addr


@router.delete("/{addr_id}", status_code=204)
async def delete_address(
    addr_id: str,
    payload: dict = Depends(get_current_user_payload),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Address).where(Address.id == addr_id, Address.user_id == payload["sub"])
    )
    addr = result.scalar_one_or_none()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found.")
    await db.delete(addr)
