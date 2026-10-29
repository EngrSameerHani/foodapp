import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    customer_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    restaurant_id: Mapped[str] = mapped_column(String(36), ForeignKey("restaurants.id"), nullable=False, index=True)
    rider_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), index=True)
    address_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("addresses.id"))

    status: Mapped[str] = mapped_column(String(30), nullable=False, default="PLACED")
    # PLACED / ACCEPTED / REJECTED / PREPARING / READY_FOR_PICKUP / PICKED_UP / ON_THE_WAY / DELIVERED / FAILED / CANCELLED

    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    service_fee: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    tax: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    discount: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    payment_method: Mapped[str] = mapped_column(String(30), default="cash")
    payment_status: Mapped[str] = mapped_column(String(20), default="pending")

    voucher_code: Mapped[str | None] = mapped_column(String(50))
    delivery_note: Mapped[str | None] = mapped_column(Text)
    rejection_reason: Mapped[str | None] = mapped_column(Text)

    delivery_address_snapshot: Mapped[dict | None] = mapped_column(JSON)

    estimated_delivery_minutes: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer: Mapped["User"] = relationship("User", foreign_keys=[customer_id], back_populates="orders")
    restaurant: Mapped["Restaurant"] = relationship("Restaurant", back_populates="orders")
    rider: Mapped["User | None"] = relationship("User", foreign_keys=[rider_id])
    address: Mapped["Address | None"] = relationship("Address")
    items: Mapped[list["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment: Mapped["Payment | None"] = relationship("Payment", back_populates="order", uselist=False)
    review: Mapped["Review | None"] = relationship("Review", back_populates="order", uselist=False)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("menu_items.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(150), nullable=False)  # snapshot
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    options_snapshot: Mapped[list] = mapped_column(JSON, default=list)
    special_note: Mapped[str | None] = mapped_column(Text)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    menu_item: Mapped["MenuItem"] = relationship("MenuItem")
