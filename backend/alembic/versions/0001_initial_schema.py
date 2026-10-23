"""initial_schema

Revision ID: 0001
Revises:
Create Date: 2026-10-23
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ------------------------------------------------------------------ users
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("phone", sa.String(20), nullable=False, unique=True, index=True),
        sa.Column("name", sa.String(100), nullable=True),
        sa.Column("avatar_url", sa.Text, nullable=True),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("expo_push_token", sa.Text, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # --------------------------------------------------------------- otp_attempts
    op.create_table(
        "otp_attempts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("phone", sa.String(20), nullable=False, index=True),
        sa.Column("code_hash", sa.String(100), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("attempts", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("is_used", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ------------------------------------------------------------- refresh_tokens
    op.create_table(
        "refresh_tokens",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("token_hash", sa.String(100), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ---------------------------------------------------------------- addresses
    op.create_table(
        "addresses",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("label", sa.String(50), nullable=False, server_default=sa.text("'Home'")),
        sa.Column("full_address", sa.Text, nullable=False),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
        sa.Column("is_default", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # --------------------------------------------------------------- restaurants
    op.create_table(
        "restaurants",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("cuisine_types", sa.JSON, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("cover_url", sa.Text, nullable=True),
        sa.Column("logo_url", sa.Text, nullable=True),
        sa.Column("address", sa.Text, nullable=False),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
        sa.Column("rating", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("review_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("delivery_fee", sa.Numeric(10, 2), nullable=False, server_default=sa.text("2.99")),
        sa.Column("min_order", sa.Numeric(10, 2), nullable=False, server_default=sa.text("10.00")),
        sa.Column("delivery_radius_km", sa.Float, nullable=False, server_default=sa.text("10")),
        sa.Column("estimated_delivery_minutes", sa.Integer, nullable=False, server_default=sa.text("30")),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("opening_hours", sa.JSON, nullable=False, server_default=sa.text("'{}'")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ----------------------------------------------------------- menu_categories
    op.create_table(
        "menu_categories",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("restaurant_id", sa.String(36), sa.ForeignKey("restaurants.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("sort_order", sa.Integer, nullable=False, server_default=sa.text("0")),
    )

    # --------------------------------------------------------------- menu_items
    op.create_table(
        "menu_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("category_id", sa.String(36), sa.ForeignKey("menu_categories.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("photo_url", sa.Text, nullable=True),
        sa.Column("is_available", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ---------------------------------------------------------- item_variations
    op.create_table(
        "item_variations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("item_id", sa.String(36), sa.ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("is_required", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("is_multi_select", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("options", sa.JSON, nullable=False, server_default=sa.text("'[]'")),
    )

    # ------------------------------------------------------------------ carts
    op.create_table(
        "carts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("customer_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("restaurant_id", sa.String(36), sa.ForeignKey("restaurants.id", ondelete="SET NULL"), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # --------------------------------------------------------------- cart_items
    op.create_table(
        "cart_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("cart_id", sa.String(36), sa.ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("item_id", sa.String(36), sa.ForeignKey("menu_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False, server_default=sa.text("1")),
        sa.Column("selected_options", sa.JSON, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("special_note", sa.Text, nullable=True),
    )

    # ------------------------------------------------------------------ orders
    op.create_table(
        "orders",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_number", sa.String(20), nullable=False, unique=True),
        sa.Column("customer_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("restaurant_id", sa.String(36), sa.ForeignKey("restaurants.id"), nullable=False, index=True),
        sa.Column("rider_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True, index=True),
        sa.Column("address_id", sa.String(36), sa.ForeignKey("addresses.id"), nullable=True),
        sa.Column("status", sa.String(30), nullable=False, server_default=sa.text("'PLACED'")),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("delivery_fee", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("service_fee", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("tax", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("discount", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("total", sa.Numeric(10, 2), nullable=False),
        sa.Column("payment_method", sa.String(30), nullable=False, server_default=sa.text("'cash'")),
        sa.Column("payment_status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("voucher_code", sa.String(50), nullable=True),
        sa.Column("delivery_note", sa.Text, nullable=True),
        sa.Column("rejection_reason", sa.Text, nullable=True),
        sa.Column("delivery_address_snapshot", sa.JSON, nullable=True),
        sa.Column("estimated_delivery_minutes", sa.Integer, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # -------------------------------------------------------------- order_items
    op.create_table(
        "order_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("item_id", sa.String(36), sa.ForeignKey("menu_items.id"), nullable=False),
        sa.Column("item_name", sa.String(150), nullable=False),
        sa.Column("quantity", sa.Integer, nullable=False),
        sa.Column("unit_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("options_snapshot", sa.JSON, nullable=False, server_default=sa.text("'[]'")),
        sa.Column("special_note", sa.Text, nullable=True),
    )

    # --------------------------------------------------------------- payments
    op.create_table(
        "payments",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("method", sa.String(30), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("provider_ref", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # --------------------------------------------------------------- vouchers
    op.create_table(
        "vouchers",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("code", sa.String(50), nullable=False, unique=True, index=True),
        sa.Column("discount_type", sa.String(10), nullable=False),
        sa.Column("value", sa.Numeric(10, 2), nullable=False),
        sa.Column("min_order", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("max_uses", sa.Integer, nullable=True),
        sa.Column("used_count", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # --------------------------------------------------------------- reviews
    op.create_table(
        "reviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("reviewer_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("restaurant_id", sa.String(36), sa.ForeignKey("restaurants.id"), nullable=False, index=True),
        sa.Column("rider_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("restaurant_rating", sa.Integer, nullable=False),
        sa.Column("rider_rating", sa.Integer, nullable=True),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ----------------------------------------------------------- rider_profiles
    op.create_table(
        "rider_profiles",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("vehicle_type", sa.String(30), nullable=False, server_default=sa.text("'motorcycle'")),
        sa.Column("is_online", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("is_available", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("total_deliveries", sa.Integer, nullable=False, server_default=sa.text("0")),
        sa.Column("total_earnings", sa.Numeric(10, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("rating", sa.Float, nullable=False, server_default=sa.text("0")),
        sa.Column("bank_account", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # --------------------------------------------------------- rider_locations
    op.create_table(
        "rider_locations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("rider_id", sa.String(36), sa.ForeignKey("rider_profiles.id", ondelete="CASCADE"), nullable=False, unique=True, index=True),
        sa.Column("lat", sa.Float, nullable=False),
        sa.Column("lng", sa.Float, nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )

    # ------------------------------------------------------------- notifications
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("type", sa.String(50), nullable=False, server_default=sa.text("'order_update'")),
        sa.Column("data", sa.JSON, nullable=True),
        sa.Column("is_read", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("rider_locations")
    op.drop_table("rider_profiles")
    op.drop_table("reviews")
    op.drop_table("vouchers")
    op.drop_table("payments")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("cart_items")
    op.drop_table("carts")
    op.drop_table("item_variations")
    op.drop_table("menu_items")
    op.drop_table("menu_categories")
    op.drop_table("restaurants")
    op.drop_table("addresses")
    op.drop_table("refresh_tokens")
    op.drop_table("otp_attempts")
    op.drop_table("users")
