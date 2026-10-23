import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RiderProfile(Base):
    __tablename__ = "rider_profiles"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    vehicle_type: Mapped[str] = mapped_column(String(30), default="motorcycle")  # motorcycle / bicycle / car
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)  # not on active delivery
    total_deliveries: Mapped[int] = mapped_column(default=0)
    total_earnings: Mapped[float] = mapped_column(Numeric(10, 2), default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    bank_account: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship("User", back_populates="rider_profile")
    location: Mapped["RiderLocation | None"] = relationship("RiderLocation", back_populates="rider", uselist=False)


class RiderLocation(Base):
    __tablename__ = "rider_locations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4()))
    rider_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    rider: Mapped["RiderProfile"] = relationship("RiderProfile", back_populates="location")
