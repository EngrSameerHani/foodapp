from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import require_customer
from app.models.cart import Cart, CartItem
from app.models.restaurant import MenuItem, Restaurant
from app.schemas.order import CartOut, CartItemOut, CartUpdateRequest

router = APIRouter(prefix="/cart", tags=["cart"])


async def _compute_cart(cart: Cart, restaurant: Restaurant | None) -> CartOut:
    items_out = []
    subtotal = 0.0

    for ci in cart.items:
        item_price = float(ci.menu_item.price) if ci.menu_item else 0.0
        options_delta = sum(float(o.get("price_delta", 0)) for o in (ci.selected_options or []))
        unit_price = item_price + options_delta
        line_total = unit_price * ci.quantity
        subtotal += line_total
        items_out.append(
            CartItemOut(
                id=ci.id,
                item_id=ci.item_id,
                quantity=ci.quantity,
                selected_options=ci.selected_options or [],
                special_note=ci.special_note,
                item_name=ci.menu_item.name if ci.menu_item else "",
                unit_price=unit_price,
                line_total=line_total,
            )
        )

    delivery_fee = float(restaurant.delivery_fee) if restaurant else 0.0
    service_fee = settings.SERVICE_FEE
    tax = round(subtotal * settings.TAX_RATE, 2)
    total = round(subtotal + delivery_fee + service_fee + tax, 2)

    return CartOut(
        restaurant_id=cart.restaurant_id,
        restaurant_name=restaurant.name if restaurant else "",
        items=items_out,
        subtotal=round(subtotal, 2),
        delivery_fee=delivery_fee,
        service_fee=service_fee,
        tax=tax,
        total=total,
    )


@router.get("", response_model=CartOut)
async def get_cart(
    payload: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    customer_id = payload["sub"]
    result = await db.execute(
        select(Cart)
        .where(Cart.customer_id == customer_id)
        .options(selectinload(Cart.items).selectinload(CartItem.menu_item))
    )
    cart = result.scalar_one_or_none()
    if not cart:
        return CartOut(
            restaurant_id=None, items=[], subtotal=0, delivery_fee=0, service_fee=0, tax=0, total=0
        )

    restaurant = None
    if cart.restaurant_id:
        r = await db.execute(select(Restaurant).where(Restaurant.id == cart.restaurant_id))
        restaurant = r.scalar_one_or_none()

    return await _compute_cart(cart, restaurant)


@router.put("", response_model=CartOut)
async def update_cart(
    body: CartUpdateRequest,
    payload: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    customer_id = payload["sub"]

    # Verify restaurant
    r_result = await db.execute(select(Restaurant).where(Restaurant.id == body.restaurant_id))
    restaurant = r_result.scalar_one_or_none()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found.")

    # Verify all items belong to this restaurant
    item_ids = [i.item_id for i in body.items]
    items_result = await db.execute(
        select(MenuItem).where(MenuItem.id.in_(item_ids))
    )
    items_map = {i.id: i for i in items_result.scalars().all()}

    # Get or create cart
    cart_result = await db.execute(
        select(Cart)
        .where(Cart.customer_id == customer_id)
        .options(selectinload(Cart.items))
    )
    cart = cart_result.scalar_one_or_none()
    if not cart:
        cart = Cart(customer_id=customer_id, restaurant_id=body.restaurant_id)
        db.add(cart)
        await db.flush()
    else:
        # Clear existing items
        for old_item in cart.items:
            await db.delete(old_item)
        cart.restaurant_id = body.restaurant_id
        await db.flush()

    new_items = []
    for ci_req in body.items:
        if ci_req.item_id not in items_map:
            raise HTTPException(status_code=404, detail=f"Item {ci_req.item_id} not found.")
        new_item = CartItem(
            cart_id=cart.id,
            item_id=ci_req.item_id,
            quantity=ci_req.quantity,
            selected_options=ci_req.selected_options,
            special_note=ci_req.special_note,
        )
        db.add(new_item)
        new_item.menu_item = items_map[ci_req.item_id]
        new_items.append(new_item)

    cart.items = new_items
    await db.flush()

    return await _compute_cart(cart, restaurant)


@router.delete("", status_code=204)
async def clear_cart(
    payload: dict = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Cart)
        .where(Cart.customer_id == payload["sub"])
        .options(selectinload(Cart.items))
    )
    cart = result.scalar_one_or_none()
    if cart:
        for item in cart.items:
            await db.delete(item)
        cart.restaurant_id = None
        await db.flush()
