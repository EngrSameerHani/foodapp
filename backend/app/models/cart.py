import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Cart(Base):
    __tablename__ = "carts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    restaurant_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("restaurants.id", ondelete="SET NULL"))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer: Mapped["User"] = relationship("User", back_populates="cart")
    restaurant: Mapped["Restaurant | None"] = relationship("Restaurant")
    items: Mapped[list["CartItem"]] = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    cart_id: Mapped[str] = mapped_column(String(36), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    selected_options: Mapped[list] = mapped_column(JSON, default=list)
    # [{"variation_id": "...", "option_name": "Large", "price_delta": 2.00}]
    special_note: Mapped[str | None] = mapped_column(Text)

    cart: Mapped["Cart"] = relationship("Cart", back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem")
