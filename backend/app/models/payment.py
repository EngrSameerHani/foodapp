import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    method: Mapped[str] = mapped_column(String(30), nullable=False)  # cash / card / wallet
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending / completed / failed / refunded
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    provider_ref: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    order: Mapped["Order"] = relationship("Order", back_populates="payment")
