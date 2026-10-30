"""Authentication service — OTP flow, token issuance, refresh, logout."""
import logging
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_otp,
    generate_refresh_token,
    hash_otp,
    hash_token,
    verify_otp,
)
from app.models.user import OTPAttempt, RefreshToken, User

logger = logging.getLogger(__name__)

# ─── Demo accounts — OTP is always 123456 ────────────────────────────────────
DEMO_OTP = "123456"
DEMO_PHONES = {
    "+15550000001": "customer",
    "+15550000002": "customer",
    "+15550000003": "customer",
    "+15550000004": "customer",
    "+15550000005": "customer",
    "+15550000010": "restaurant_owner",
    "+15550000011": "restaurant_owner",
    "+15550000012": "restaurant_owner",
    "+15550000020": "rider",
    "+15550000021": "rider",
    "+15550000022": "rider",
}


def _is_demo(phone: str) -> bool:
    return phone in DEMO_PHONES


# ─── Request OTP ─────────────────────────────────────────────────────────────

async def request_otp(phone: str, db: AsyncSession) -> dict:
    if _is_demo(phone):
        # Demo accounts: log the fixed OTP and skip DB storage
        logger.info("📱 OTP for %s: %s  [DEMO — always 123456]", phone, DEMO_OTP)
        return {"expires_in": settings.OTP_EXPIRE_SECONDS}

    # Real accounts: invalidate old OTPs, generate new random one
    await db.execute(
        update(OTPAttempt)
        .where(OTPAttempt.phone == phone, OTPAttempt.is_used.is_(False))
        .values(is_used=True)
    )

    otp = generate_otp()
    logger.info("📱 OTP for %s: %s", phone, otp)

    expires_at = datetime.now(timezone.utc) + timedelta(seconds=settings.OTP_EXPIRE_SECONDS)
    attempt = OTPAttempt(
        phone=phone,
        code_hash=hash_otp(otp),
        expires_at=expires_at,
    )
    db.add(attempt)
    await db.flush()
    return {"expires_in": settings.OTP_EXPIRE_SECONDS}


# ─── Verify OTP ──────────────────────────────────────────────────────────────

async def verify_otp_and_login(phone: str, code: str, role: str, db: AsyncSession) -> dict:
    if _is_demo(phone):
        # Demo accounts: accept only "123456", no DB lookup needed
        if code != DEMO_OTP:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid OTP. Demo accounts always use {DEMO_OTP}.",
            )
        # Get or create demo user
        user_result = await db.execute(select(User).where(User.phone == phone))
        user: User | None = user_result.scalar_one_or_none()
        if not user:
            user = User(phone=phone, role=DEMO_PHONES[phone])
            db.add(user)
            await db.flush()
        elif user.role != role and role in ("customer", "restaurant_owner", "rider"):
            # Allow role override only if supplied role matches demo role
            if role != DEMO_PHONES[phone]:
                role = DEMO_PHONES[phone]  # enforce correct demo role
        return await _issue_tokens(user, db)

    # ── Real accounts ──
    result = await db.execute(
        select(OTPAttempt)
        .where(OTPAttempt.phone == phone, OTPAttempt.is_used.is_(False))
        .order_by(OTPAttempt.created_at.desc())
        .limit(1)
    )
    attempt: OTPAttempt | None = result.scalar_one_or_none()

    if not attempt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Please request a new one.",
        )

    # Normalize expires_at to UTC for safe comparison
    expires = attempt.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP expired.",
        )

    if attempt.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many attempts. Request a new OTP.",
        )

    if not verify_otp(code, attempt.code_hash):
        attempt.attempts += 1
        await db.flush()
        remaining = settings.OTP_MAX_ATTEMPTS - attempt.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining.",
        )

    attempt.is_used = True

    user_result = await db.execute(select(User).where(User.phone == phone))
    user: User | None = user_result.scalar_one_or_none()
    if not user:
        user = User(phone=phone, role=role)
        db.add(user)
        await db.flush()
    else:
        if user.role != role:
            user.role = role

    return await _issue_tokens(user, db)


# ─── Refresh / logout ─────────────────────────────────────────────────────────

async def refresh_tokens(raw_token: str, db: AsyncSession) -> dict:
    token_hash = hash_token(raw_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked.is_(False),
        )
    )
    stored: RefreshToken | None = result.scalar_one_or_none()

    if not stored:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    exp = stored.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > exp:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired.")

    stored.revoked = True

    user_result = await db.execute(select(User).where(User.id == stored.user_id))
    user: User | None = user_result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    return await _issue_tokens(user, db)


async def logout(raw_token: str, db: AsyncSession) -> None:
    token_hash = hash_token(raw_token)
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .values(revoked=True)
    )


async def _issue_tokens(user: User, db: AsyncSession) -> dict:
    access_token = create_access_token(user.id, user.role)
    raw_refresh = generate_refresh_token()
    refresh_hash = hash_token(raw_refresh)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(RefreshToken(user_id=user.id, token_hash=refresh_hash, expires_at=expires_at))
    await db.flush()

    return {
        "access_token": access_token,
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "user_id": user.id,
        "role": user.role,
    }
