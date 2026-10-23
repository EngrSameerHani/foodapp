"""Order state machine tests — valid transitions, invalid transitions, cancellation."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.order import Order
from app.models.user import User
from app.models.restaurant import Restaurant, MenuCategory, MenuItem
from app.models.address import Address
from app.models.cart import Cart, CartItem
from app.core.security import create_access_token


def make_token(user_id: str, role: str) -> str:
    return create_access_token(user_id, role)


async def _seed_order(db: AsyncSession) -> tuple[Order, str, str, str]:
    """Returns (order, customer_token, owner_token, rider_token)."""
    import uuid

    customer = User(id=str(uuid.uuid4()), phone="+1555order1", role="customer")
    owner = User(id=str(uuid.uuid4()), phone="+1555order2", role="restaurant_owner")
    rider = User(id=str(uuid.uuid4()), phone="+1555order3", role="rider")
    db.add_all([customer, owner, rider])
    await db.flush()

    restaurant = Restaurant(
        id=str(uuid.uuid4()),
        owner_id=owner.id,
        name="Test Burgers",
        address="1 Test St",
        lat=0.0,
        lng=0.0,
        delivery_fee=2.99,
        min_order=5.0,
    )
    db.add(restaurant)
    await db.flush()

    category = MenuCategory(id=str(uuid.uuid4()), restaurant_id=restaurant.id, name="Mains")
    db.add(category)
    await db.flush()

    item = MenuItem(
        id=str(uuid.uuid4()),
        category_id=category.id,
        name="Burger",
        price=9.99,
    )
    db.add(item)
    await db.flush()

    address = Address(
        id=str(uuid.uuid4()),
        user_id=customer.id,
        full_address="456 Customer Ave",
        lat=0.01,
        lng=0.01,
    )
    db.add(address)
    await db.flush()

    cart = Cart(id=str(uuid.uuid4()), customer_id=customer.id, restaurant_id=restaurant.id)
    db.add(cart)
    await db.flush()

    cart_item = CartItem(cart_id=cart.id, item_id=item.id, quantity=1)
    db.add(cart_item)
    await db.flush()

    # Directly create the order to avoid rider assignment complexity in tests
    from app.services.order_service import _generate_order_number
    order = Order(
        order_number=_generate_order_number(),
        customer_id=customer.id,
        restaurant_id=restaurant.id,
        rider_id=rider.id,
        address_id=address.id,
        status="PLACED",
        subtotal=9.99,
        delivery_fee=2.99,
        service_fee=1.99,
        tax=0.80,
        discount=0.0,
        total=15.77,
        payment_method="cash",
    )
    db.add(order)
    await db.flush()

    return (
        order,
        make_token(customer.id, "customer"),
        make_token(owner.id, "restaurant_owner"),
        make_token(rider.id, "rider"),
    )


@pytest.mark.asyncio
async def test_full_order_lifecycle(client: AsyncClient, db_session: AsyncSession):
    order, cust_token, owner_token, rider_token = await _seed_order(db_session)
    oid = order.id

    transitions = [
        ("ACCEPTED", owner_token),
        ("PREPARING", owner_token),
        ("READY_FOR_PICKUP", owner_token),
        ("PICKED_UP", rider_token),
        ("ON_THE_WAY", rider_token),
        ("DELIVERED", rider_token),
    ]

    for new_status, token in transitions:
        resp = await client.patch(
            f"/api/v1/orders/{oid}/status",
            json={"status": new_status},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200, f"Failed at {new_status}: {resp.text}"
        assert resp.json()["status"] == new_status


@pytest.mark.asyncio
async def test_invalid_transition_placed_to_preparing(client: AsyncClient, db_session: AsyncSession):
    order, _, owner_token, _ = await _seed_order(db_session)
    resp = await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "PREPARING"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_invalid_transition_placed_to_delivered(client: AsyncClient, db_session: AsyncSession):
    order, _, _, rider_token = await _seed_order(db_session)
    resp = await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "DELIVERED"},
        headers={"Authorization": f"Bearer {rider_token}"},
    )
    assert resp.status_code in (409, 403)


@pytest.mark.asyncio
async def test_customer_cannot_accept_order(client: AsyncClient, db_session: AsyncSession):
    order, cust_token, _, _ = await _seed_order(db_session)
    resp = await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "ACCEPTED"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_customer_cancel_placed_order(client: AsyncClient, db_session: AsyncSession):
    order, cust_token, _, _ = await _seed_order(db_session)
    resp = await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "CANCELLED"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "CANCELLED"


@pytest.mark.asyncio
async def test_cannot_transition_from_terminal_state(client: AsyncClient, db_session: AsyncSession):
    order, cust_token, owner_token, _ = await _seed_order(db_session)
    # Cancel first
    await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "CANCELLED"},
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    # Try to accept after cancel
    resp = await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "ACCEPTED"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_reject_with_reason(client: AsyncClient, db_session: AsyncSession):
    order, _, owner_token, _ = await _seed_order(db_session)
    resp = await client.patch(
        f"/api/v1/orders/{order.id}/status",
        json={"status": "REJECTED", "rejection_reason": "Closed for the evening"},
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "REJECTED"
    assert data["rejection_reason"] == "Closed for the evening"
