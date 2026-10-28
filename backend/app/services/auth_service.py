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


async def request_otp(phone: str, db: AsyncSession) -> dict:
    # Invalidate any existing unused OTPs for this phone
    await db.execute(
        update(OTPAttempt)
        .where(OTPAttempt.phone == phone, OTPAttempt.is_used.is_(False))
        .values(is_used=True)
    )

    otp = generate_otp()
    # In production replace with real SMS gateway
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


async def verify_otp_and_login(phone: str, code: str, role: str, db: AsyncSession) -> dict:
    # Get latest unused OTP
    result = await db.execute(
        select(OTPAttempt)
        .where(OTPAttempt.phone == phone, OTPAttempt.is_used.is_(False))
        .order_by(OTPAttempt.created_at.desc())
        .limit(1)
    )
    attempt: OTPAttempt | None = result.scalar_one_or_none()

    if not attempt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No OTP found. Please request a new one.")

    # Normalize expires_at to UTC for safe comparison
    expires = attempt.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired.")

    if attempt.attempts >= settings.OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many attempts. Request a new OTP.")

    if not verify_otp(code, attempt.code_hash):
        attempt.attempts += 1
        await db.flush()
        remaining = settings.OTP_MAX_ATTEMPTS - attempt.attempts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OTP. {remaining} attempt(s) remaining.",
        )

    # Mark OTP as used
    attempt.is_used = True

    # Get or create user
    user_result = await db.execute(select(User).where(User.phone == phone))
    user: User | None = user_result.scalar_one_or_none()

    if not user:
        user = User(phone=phone, role=role)
        db.add(user)
        await db.flush()
    else:
        # Update role if it changed (e.g. new role signup)
        if user.role != role:
            user.role = role

    tokens = await _issue_tokens(user, db)
    return tokens


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

    if datetime.now(timezone.utc) > (stored.expires_at.replace(tzinfo=timezone.utc) if stored.expires_at.tzinfo is None else stored.expires_at):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired.")

    # Revoke old token
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
