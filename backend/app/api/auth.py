from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limit import otp_rate_limiter
from app.schemas.auth import OTPRequestSchema, OTPVerifySchema, RefreshRequest, TokenResponse
from app.schemas.common import MessageResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/request-otp", response_model=dict)
async def request_otp(body: OTPRequestSchema, db: AsyncSession = Depends(get_db)):
    if not otp_rate_limiter.is_allowed(body.phone):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please wait before trying again.",
        )
    result = await auth_service.request_otp(body.phone, db)
    return result


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(body: OTPVerifySchema, db: AsyncSession = Depends(get_db)):
    result = await auth_service.verify_otp_and_login(body.phone, body.code, body.role, db)
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    result = await auth_service.refresh_tokens(body.refresh_token, db)
    return result


@router.post("/logout", response_model=MessageResponse)
async def logout(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    await auth_service.logout(body.refresh_token, db)
    return {"message": "Logged out successfully."}
