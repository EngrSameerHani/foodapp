import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cuisine_types: Mapped[list] = mapped_column(JSON, default=list)  # ["Pizza", "Italian"]
    cover_url: Mapped[str | None] = mapped_column(Text)
    logo_url: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=2.99)
    min_order: Mapped[float] = mapped_column(Numeric(10, 2), default=10.00)
    delivery_radius_km: Mapped[float] = mapped_column(Float, default=10.0)
    estimated_delivery_minutes: Mapped[int] = mapped_column(Integer, default=30)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    opening_hours: Mapped[dict] = mapped_column(JSON, default=dict)
    # {"mon": {"open": "09:00", "close": "22:00"}, ...}
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    owner: Mapped["User"] = relationship("User", back_populates="restaurant")
    categories: Mapped[list["MenuCategory"]] = relationship("MenuCategory", back_populates="restaurant", cascade="all, delete-orphan", order_by="MenuCategory.sort_order")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="restaurant")


class MenuCategory(Base):
    __tablename__ = "menu_categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="categories")
    items: Mapped[list["MenuItem"]] = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    category_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    photo_url: Mapped[str | None] = mapped_column(Text)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    category: Mapped["MenuCategory"] = relationship("MenuCategory", back_populates="items")
    variations: Mapped[list["ItemVariation"]] = relationship("ItemVariation", back_populates="item", cascade="all, delete-orphan")


class ItemVariation(Base):
    __tablename__ = "item_variations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g. "Size", "Add-ons"
    is_required: Mapped[bool] = mapped_column(Boolean, default=False)
    is_multi_select: Mapped[bool] = mapped_column(Boolean, default=False)
    options: Mapped[list] = mapped_column(JSON, default=list)
    # [{"name": "Large", "price_delta": 2.00}, ...]

    item: Mapped["MenuItem"] = relationship("MenuItem", back_populates="variations")
