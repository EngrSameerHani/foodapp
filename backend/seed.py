"""
Seed script — populates the database with demo data.
Usage: python seed.py
Demo OTP for all accounts: use the last 6 digits of the phone number.
  e.g. +15550000001 → OTP is 000001 (mocked; in dev the real OTP is logged to console)
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.models.user import User
from app.models.restaurant import Restaurant, MenuCategory, MenuItem, ItemVariation
from app.models.rider import RiderProfile, RiderLocation
from app.models.voucher import Voucher
from app.models.address import Address
from app.models.cart import Cart


ENGINE = create_async_engine(settings.DATABASE_URL, echo=False)
SessionLocal = async_sessionmaker(ENGINE, expire_on_commit=False)


async def seed():
    async with ENGINE.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with SessionLocal() as db:
        print("🌱 Seeding database...")

        # --------------- Users ---------------
        customers = [
            User(id=str(uuid.uuid4()), phone="+15550000001", name="Alice Johnson", role="customer"),
            User(id=str(uuid.uuid4()), phone="+15550000002", name="Bob Smith", role="customer"),
            User(id=str(uuid.uuid4()), phone="+15550000003", name="Carol White", role="customer"),
            User(id=str(uuid.uuid4()), phone="+15550000004", name="David Brown", role="customer"),
            User(id=str(uuid.uuid4()), phone="+15550000005", name="Emma Davis", role="customer"),
        ]
        owners = [
            User(id=str(uuid.uuid4()), phone="+15550000010", name="Frank Miller", role="restaurant_owner"),
            User(id=str(uuid.uuid4()), phone="+15550000011", name="Grace Lee", role="restaurant_owner"),
            User(id=str(uuid.uuid4()), phone="+15550000012", name="Henry Wilson", role="restaurant_owner"),
        ]
        rider_users = [
            User(id=str(uuid.uuid4()), phone="+15550000020", name="Ivan Martinez", role="rider"),
            User(id=str(uuid.uuid4()), phone="+15550000021", name="Julia Thompson", role="rider"),
            User(id=str(uuid.uuid4()), phone="+15550000022", name="Kevin Anderson", role="rider"),
        ]
        all_users = customers + owners + rider_users
        db.add_all(all_users)
        await db.flush()

        # --------------- Rider Profiles + Locations ---------------
        rider_coords = [
            (37.7749, -122.4194),  # SF
            (37.7830, -122.4100),
            (37.7700, -122.4300),
        ]
        for i, ru in enumerate(rider_users):
            lat, lng = rider_coords[i]
            profile = RiderProfile(
                id=str(uuid.uuid4()),
                user_id=ru.id,
                vehicle_type="motorcycle",
                is_online=True,
                is_available=True,
                rating=4.8,
            )
            db.add(profile)
            await db.flush()
            db.add(RiderLocation(rider_id=profile.id, lat=lat, lng=lng))

        await db.flush()

        # --------------- Customer Addresses ---------------
        for i, c in enumerate(customers):
            addr = Address(
                id=str(uuid.uuid4()),
                user_id=c.id,
                label="Home",
                full_address=f"{100 + i} Main Street, San Francisco, CA",
                lat=37.7749 + i * 0.001,
                lng=-122.4194 + i * 0.001,
                is_default=True,
            )
            db.add(addr)
            db.add(Cart(id=str(uuid.uuid4()), customer_id=c.id))

        await db.flush()

        # --------------- Restaurant 1: Zawadi Burgers ---------------
        r1 = Restaurant(
            id=str(uuid.uuid4()),
            owner_id=owners[0].id,
            name="Zawadi Burgers",
            description="Gourmet smash burgers made with 100% Kenyan beef",
            cuisine_types=["Burgers", "American", "Fast Food"],
            address="501 Castro St, San Francisco, CA",
            lat=37.7609,
            lng=-122.4350,
            rating=4.7,
            review_count=243,
            delivery_fee=2.99,
            min_order=12.0,
            delivery_radius_km=10.0,
            estimated_delivery_minutes=25,
            is_active=True,
            opening_hours={
                "mon": {"open": "10:00", "close": "22:00"},
                "tue": {"open": "10:00", "close": "22:00"},
                "wed": {"open": "10:00", "close": "22:00"},
                "thu": {"open": "10:00", "close": "22:00"},
                "fri": {"open": "10:00", "close": "23:00"},
                "sat": {"open": "11:00", "close": "23:00"},
                "sun": {"open": "11:00", "close": "21:00"},
            },
        )
        db.add(r1)
        await db.flush()

        cat1a = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r1.id, name="Burgers", sort_order=0)
        cat1b = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r1.id, name="Sides", sort_order=1)
        cat1c = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r1.id, name="Drinks", sort_order=2)
        db.add_all([cat1a, cat1b, cat1c])
        await db.flush()

        burger_items = [
            MenuItem(id=str(uuid.uuid4()), category_id=cat1a.id, name="Classic Smash", description="Double patty, American cheese, pickles, special sauce", price=12.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat1a.id, name="BBQ Bacon Smash", description="Crispy bacon, BBQ sauce, cheddar, caramelised onions", price=14.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat1a.id, name="Mushroom Swiss", description="Sautéed mushrooms, Swiss cheese, garlic aioli", price=13.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat1b.id, name="Crispy Fries", description="Golden fries with sea salt", price=4.49),
            MenuItem(id=str(uuid.uuid4()), category_id=cat1b.id, name="Onion Rings", description="Beer-battered onion rings", price=4.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat1c.id, name="Craft Soda", description="Locally brewed ginger beer or cola", price=2.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat1c.id, name="Milkshake", description="Chocolate, vanilla, or strawberry", price=5.99),
        ]
        db.add_all(burger_items)
        await db.flush()

        # Add variation to Classic Smash
        db.add(ItemVariation(
            id=str(uuid.uuid4()),
            item_id=burger_items[0].id,
            label="Size",
            is_required=True,
            is_multi_select=False,
            options=[{"name": "Single", "price_delta": 0}, {"name": "Double", "price_delta": 3.0}],
        ))

        # --------------- Restaurant 2: Nairobi Kitchen ---------------
        r2 = Restaurant(
            id=str(uuid.uuid4()),
            owner_id=owners[1].id,
            name="Nairobi Kitchen",
            description="Authentic Kenyan and East African cuisine",
            cuisine_types=["Kenyan", "African", "Halal"],
            address="1200 Mission St, San Francisco, CA",
            lat=37.7749,
            lng=-122.4188,
            rating=4.5,
            review_count=189,
            delivery_fee=1.99,
            min_order=15.0,
            delivery_radius_km=8.0,
            estimated_delivery_minutes=35,
            is_active=True,
            opening_hours={
                "mon": {"open": "11:00", "close": "21:00"},
                "tue": {"open": "11:00", "close": "21:00"},
                "wed": {"open": "11:00", "close": "21:00"},
                "thu": {"open": "11:00", "close": "21:00"},
                "fri": {"open": "11:00", "close": "22:00"},
                "sat": {"open": "10:00", "close": "22:00"},
                "sun": {"open": "10:00", "close": "20:00"},
            },
        )
        db.add(r2)
        await db.flush()

        cat2a = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r2.id, name="Rice Dishes", sort_order=0)
        cat2b = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r2.id, name="Grills", sort_order=1)
        cat2c = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r2.id, name="Stews", sort_order=2)
        cat2d = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r2.id, name="Sides & Drinks", sort_order=3)
        db.add_all([cat2a, cat2b, cat2c, cat2d])
        await db.flush()

        kenyan_items = [
            MenuItem(id=str(uuid.uuid4()), category_id=cat2a.id, name="Pilau", description="Spiced rice with beef and whole spices", price=13.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2a.id, name="Biryani", description="Fragrant basmati with slow-cooked chicken", price=15.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2b.id, name="Nyama Choma", description="Fire-grilled goat or beef ribs", price=18.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2b.id, name="Kuku Choma", description="Whole grilled chicken, served with kachumbari", price=16.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2c.id, name="Githeri", description="Mixed beans and maize in a rich tomato sauce", price=9.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2c.id, name="Beef Stew", description="Tender beef in a slow-cooked tomato gravy", price=13.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2d.id, name="Ugali", description="Stiff maize porridge — the classic accompaniment", price=2.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat2d.id, name="Dawa Cocktail", description="Honey, lime, and vodka — the Kenyan classic", price=7.99),
        ]
        db.add_all(kenyan_items)

        # --------------- Restaurant 3: Sakura Ramen ---------------
        r3 = Restaurant(
            id=str(uuid.uuid4()),
            owner_id=owners[2].id,
            name="Sakura Ramen",
            description="Handcrafted Japanese ramen and street food",
            cuisine_types=["Japanese", "Ramen", "Asian"],
            address="300 Fillmore St, San Francisco, CA",
            lat=37.7751,
            lng=-122.4309,
            rating=4.6,
            review_count=312,
            delivery_fee=3.49,
            min_order=18.0,
            delivery_radius_km=12.0,
            estimated_delivery_minutes=40,
            is_active=True,
            opening_hours={
                "mon": {"open": "12:00", "close": "22:00"},
                "tue": {"open": "12:00", "close": "22:00"},
                "wed": {"open": "12:00", "close": "22:00"},
                "thu": {"open": "12:00", "close": "22:00"},
                "fri": {"open": "12:00", "close": "23:00"},
                "sat": {"open": "11:00", "close": "23:00"},
                "sun": {"open": "11:00", "close": "21:00"},
            },
        )
        db.add(r3)
        await db.flush()

        cat3a = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r3.id, name="Ramen", sort_order=0)
        cat3b = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r3.id, name="Starters", sort_order=1)
        cat3c = MenuCategory(id=str(uuid.uuid4()), restaurant_id=r3.id, name="Drinks", sort_order=2)
        db.add_all([cat3a, cat3b, cat3c])
        await db.flush()

        ramen_items = [
            MenuItem(id=str(uuid.uuid4()), category_id=cat3a.id, name="Tonkotsu Ramen", description="Rich pork bone broth, chashu, egg, nori", price=17.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat3a.id, name="Spicy Miso Ramen", description="Red miso base with chilli oil and corn", price=16.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat3a.id, name="Shoyu Ramen", description="Light soy broth, chicken, bamboo shoots", price=15.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat3b.id, name="Gyoza (6 pcs)", description="Pan-fried pork and cabbage dumplings", price=8.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat3b.id, name="Takoyaki (8 pcs)", description="Octopus balls with bonito, mayo, tonkatsu", price=9.99),
            MenuItem(id=str(uuid.uuid4()), category_id=cat3c.id, name="Matcha Latte", description="Premium Japanese matcha, hot or iced", price=5.49),
            MenuItem(id=str(uuid.uuid4()), category_id=cat3c.id, name="Ramune Soda", description="Original Japanese marble soda", price=3.99),
        ]
        db.add_all(ramen_items)
        await db.flush()

        # Add size variation to Tonkotsu
        db.add(ItemVariation(
            id=str(uuid.uuid4()),
            item_id=ramen_items[0].id,
            label="Broth Level",
            is_required=False,
            is_multi_select=False,
            options=[
                {"name": "Regular", "price_delta": 0},
                {"name": "Extra Rich", "price_delta": 1.5},
            ],
        ))

        # --------------- Vouchers ---------------
        vouchers = [
            Voucher(
                id=str(uuid.uuid4()),
                code="WELCOME20",
                discount_type="percent",
                value=20.0,
                min_order=15.0,
                max_uses=100,
                expires_at=datetime.now(timezone.utc) + timedelta(days=365),
            ),
            Voucher(
                id=str(uuid.uuid4()),
                code="SAVE5",
                discount_type="flat",
                value=5.0,
                min_order=20.0,
                max_uses=50,
                expires_at=datetime.now(timezone.utc) + timedelta(days=180),
            ),
        ]
        db.add_all(vouchers)
        await db.commit()

    print("\n✅ Seed complete! Demo accounts:")
    print("=" * 50)
    print("CUSTOMERS (role: customer)")
    for c in customers:
        print(f"  Phone: {c.phone}  Name: {c.name}")
    print("\nRESTAURANT OWNERS (role: restaurant_owner)")
    for o in owners:
        print(f"  Phone: {o.phone}  Name: {o.name}")
    print("\nRIDERS (role: rider)")
    for r in rider_users:
        print(f"  Phone: {r.phone}  Name: {r.name}")
    print("\nVOUCHER CODES")
    print("  WELCOME20 — 20% off orders over $15")
    print("  SAVE5     — $5 off orders over $20")
    print("\n📱 In dev, the OTP is printed to the backend console.")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(seed())
