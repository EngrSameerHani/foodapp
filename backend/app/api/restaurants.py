from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user_payload, require_owner
from app.models.restaurant import MenuCategory, MenuItem, ItemVariation, Restaurant
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.restaurant import (
    MenuCategoryCreate,
    MenuCategoryOut,
    MenuCategoryUpdate,
    MenuItemCreate,
    MenuItemOut,
    MenuItemUpdate,
    RestaurantCreate,
    RestaurantOut,
    RestaurantUpdate,
    RestaurantWithMenuOut,
)
from app.services.geo_service import haversine_km

router = APIRouter(tags=["restaurants"])


# ---------------------------------------------------------------------------
# Restaurants
# ---------------------------------------------------------------------------

@router.get("/restaurants", response_model=PaginatedResponse[RestaurantOut])
async def list_restaurants(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    cuisine: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_delivery_minutes: Optional[int] = None,
    sort: str = Query(default="relevance", pattern="^(relevance|rating|delivery_time|distance)$"),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, le=50),
    db: AsyncSession = Depends(get_db),
):
    q = select(Restaurant).where(Restaurant.is_active.is_(True))

    if min_rating is not None:
        q = q.where(Restaurant.rating >= min_rating)
    if max_delivery_minutes is not None:
        q = q.where(Restaurant.estimated_delivery_minutes <= max_delivery_minutes)

    result = await db.execute(q)
    restaurants: List[Restaurant] = result.scalars().all()

    # Filter by cuisine (JSONB contains)
    if cuisine:
        restaurants = [r for r in restaurants if cuisine.lower() in [c.lower() for c in (r.cuisine_types or [])]]

    # Filter by delivery radius from user location
    if lat is not None and lng is not None:
        restaurants = [
            r for r in restaurants
            if haversine_km(lat, lng, r.lat, r.lng) <= r.delivery_radius_km
        ]

    # Sort
    if sort == "rating":
        restaurants.sort(key=lambda r: r.rating, reverse=True)
    elif sort == "delivery_time":
        restaurants.sort(key=lambda r: r.estimated_delivery_minutes)
    elif sort == "distance" and lat is not None and lng is not None:
        restaurants.sort(key=lambda r: haversine_km(lat, lng, r.lat, r.lng))

    total = len(restaurants)
    offset = (page - 1) * limit
    page_items = restaurants[offset: offset + limit]
    pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "data": page_items,
        "meta": {"page": page, "limit": limit, "total": total, "pages": pages},
    }


@router.get("/restaurants/mine", response_model=RestaurantWithMenuOut)
async def get_my_restaurant(
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    """Returns the restaurant owned by the authenticated restaurant_owner."""
    result = await db.execute(
        select(Restaurant)
        .where(Restaurant.owner_id == payload["sub"])
        .options(
            selectinload(Restaurant.categories)
            .selectinload(MenuCategory.items)
            .selectinload(MenuItem.variations)
        )
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No restaurant found. Please register your restaurant first.")
    return r


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantWithMenuOut)
async def get_restaurant(restaurant_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Restaurant)
        .where(Restaurant.id == restaurant_id)
        .options(
            selectinload(Restaurant.categories)
            .selectinload(MenuCategory.items)
            .selectinload(MenuItem.variations)
        )
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found.")
    return r


@router.post("/restaurants", response_model=RestaurantOut, status_code=201)
async def create_restaurant(
    body: RestaurantCreate,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    owner_id = payload["sub"]
    # One restaurant per owner in MVP
    existing = await db.execute(select(Restaurant).where(Restaurant.owner_id == owner_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="You already have a restaurant.")

    r = Restaurant(owner_id=owner_id, **body.model_dump())
    db.add(r)
    await db.flush()
    return r


@router.patch("/restaurants/{restaurant_id}", response_model=RestaurantOut)
async def update_restaurant(
    restaurant_id: str,
    body: RestaurantUpdate,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Restaurant).where(Restaurant.id == restaurant_id, Restaurant.owner_id == payload["sub"])
    )
    r = result.scalar_one_or_none()
    if not r:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found.")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(r, field, val)
    await db.flush()
    return r


# ---------------------------------------------------------------------------
# Menu — categories
# ---------------------------------------------------------------------------

@router.get("/restaurants/{restaurant_id}/menu", response_model=List[MenuCategoryOut])
async def get_menu(restaurant_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.restaurant_id == restaurant_id)
        .options(selectinload(MenuCategory.items).selectinload(MenuItem.variations))
        .order_by(MenuCategory.sort_order)
    )
    return result.scalars().all()


@router.post("/menu/categories", response_model=MenuCategoryOut, status_code=201)
async def create_category(
    body: MenuCategoryCreate,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    rest = await db.execute(
        select(Restaurant).where(Restaurant.id == body.restaurant_id, Restaurant.owner_id == payload["sub"])
    )
    if not rest.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden.")
    cat = MenuCategory(**body.model_dump())
    db.add(cat)
    await db.flush()
    return cat


@router.patch("/menu/categories/{cat_id}", response_model=MenuCategoryOut)
async def update_category(
    cat_id: str,
    body: MenuCategoryUpdate,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.id == cat_id)
        .options(selectinload(MenuCategory.items))
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, val)
    await db.flush()
    return cat


@router.delete("/menu/categories/{cat_id}", status_code=204)
async def delete_category(
    cat_id: str,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MenuCategory).where(MenuCategory.id == cat_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    await db.delete(cat)


# ---------------------------------------------------------------------------
# Menu — items
# ---------------------------------------------------------------------------

@router.post("/menu/items", response_model=MenuItemOut, status_code=201)
async def create_item(
    body: MenuItemCreate,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    variations = [
        ItemVariation(
            label=v.label,
            is_required=v.is_required,
            is_multi_select=v.is_multi_select,
            options=[o.model_dump() for o in v.options],
        )
        for v in body.variations
    ]
    item_data = body.model_dump(exclude={"variations"})
    item = MenuItem(**item_data, variations=variations)
    db.add(item)
    await db.flush()
    await db.refresh(item, ["variations"])
    return item


@router.patch("/menu/items/{item_id}", response_model=MenuItemOut)
async def update_item(
    item_id: str,
    body: MenuItemUpdate,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id).options(selectinload(MenuItem.variations))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    for field, val in body.model_dump(exclude_unset=True).items():
        setattr(item, field, val)
    await db.flush()
    return item


@router.delete("/menu/items/{item_id}", status_code=204)
async def delete_item(
    item_id: str,
    payload: dict = Depends(require_owner),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found.")
    await db.delete(item)
