"""Auth endpoint tests — OTP flow, rate limiting, token refresh, logout."""
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.rate_limit import otp_rate_limiter
from app.models.user import OTPAttempt


PHONE = "+15550000001"


async def _request_otp(client: AsyncClient, phone: str = PHONE) -> dict:
    resp = await client.post("/api/v1/auth/request-otp", json={"phone": phone})
    return resp


async def _get_otp_from_db(session: AsyncSession, phone: str) -> str:
    """Helper: return the raw OTP by comparing hashes — NOT possible directly.
    Instead we patch the service to capture the OTP. For tests we override
    the OTP generation to return a fixed value via monkeypatching."""
    result = await session.execute(
        select(OTPAttempt).where(OTPAttempt.phone == phone, OTPAttempt.is_used.is_(False))
        .order_by(OTPAttempt.created_at.desc()).limit(1)
    )
    return result.scalar_one_or_none()


@pytest.mark.asyncio
async def test_request_otp_success(client: AsyncClient):
    resp = await _request_otp(client)
    assert resp.status_code == 200
    data = resp.json()
    assert "expires_in" in data


@pytest.mark.asyncio
async def test_request_otp_invalid_phone(client: AsyncClient):
    resp = await client.post("/api/v1/auth/request-otp", json={"phone": "abc"})
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_full_otp_login_flow(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    """Happy-path: request OTP → intercept code → verify → get tokens."""
    captured = {}

    original_generate = __import__("app.core.security", fromlist=["generate_otp"]).generate_otp

    def mock_generate_otp(length=6):
        code = "123456"
        captured["code"] = code
        return code

    monkeypatch.setattr("app.core.security.generate_otp", mock_generate_otp)
    monkeypatch.setattr("app.services.auth_service.generate_otp", mock_generate_otp)

    # Request OTP
    resp = await _request_otp(client)
    assert resp.status_code == 200

    # Verify OTP
    resp2 = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": PHONE, "code": "123456", "role": "customer"},
    )
    assert resp2.status_code == 200
    tokens = resp2.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens
    assert tokens["role"] == "customer"


@pytest.mark.asyncio
async def test_wrong_otp_increments_attempts(client: AsyncClient, monkeypatch):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda **kw: "999999")
    monkeypatch.setattr("app.core.security.generate_otp", lambda **kw: "999999")

    await _request_otp(client, "+19990000002")   # non-demo phone

    resp = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": "+19990000002", "code": "000000", "role": "customer"},
    )
    assert resp.status_code == 400
    assert "Invalid OTP" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_expired_otp(client: AsyncClient, db_session: AsyncSession, monkeypatch):
    from datetime import datetime, timedelta, timezone
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda **kw: "111111")
    monkeypatch.setattr("app.core.security.generate_otp", lambda **kw: "111111")

    phone = "+19990000003"   # non-demo phone
    await _request_otp(client, phone)

    # Expire the OTP manually
    from sqlalchemy import update
    await db_session.execute(
        update(OTPAttempt)
        .where(OTPAttempt.phone == phone)
        .values(expires_at=datetime.now(timezone.utc) - timedelta(seconds=1))
    )
    await db_session.commit()

    resp = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": phone, "code": "111111", "role": "customer"},
    )
    assert resp.status_code == 400
    assert "expired" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient, monkeypatch):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda **kw: "222222")
    monkeypatch.setattr("app.core.security.generate_otp", lambda **kw: "222222")

    phone = "+19990000004"   # non-demo phone
    await _request_otp(client, phone)
    login = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": phone, "code": "222222", "role": "customer"},
    )
    tokens = login.json()

    refresh_resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert refresh_resp.status_code == 200
    new_tokens = refresh_resp.json()
    # Refresh token must rotate (new token issued)
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    # The new refresh token must differ from the old one
    assert new_tokens["refresh_token"] != tokens["refresh_token"]


@pytest.mark.asyncio
async def test_logout_revokes_token(client: AsyncClient, monkeypatch):
    monkeypatch.setattr("app.services.auth_service.generate_otp", lambda **kw: "333333")
    monkeypatch.setattr("app.core.security.generate_otp", lambda **kw: "333333")

    phone = "+19990000005"   # non-demo phone
    await _request_otp(client, phone)
    login = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": phone, "code": "333333", "role": "customer"},
    )
    tokens = login.json()

    logout = await client.post("/api/v1/auth/logout", json={"refresh_token": tokens["refresh_token"]})
    assert logout.status_code == 200

    # Using the revoked refresh token should fail
    resp = await client.post(
        "/api/v1/auth/refresh", json={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_rate_limiting(client: AsyncClient):
    phone = "+15550000099"
    # Reset any previous state
    otp_rate_limiter.reset(phone)

    for _ in range(3):
        resp = await client.post("/api/v1/auth/request-otp", json={"phone": phone})
        assert resp.status_code == 200

    resp4 = await client.post("/api/v1/auth/request-otp", json={"phone": phone})
    assert resp4.status_code == 429

    # Cleanup
    otp_rate_limiter.reset(phone)


@pytest.mark.asyncio
async def test_demo_login_always_works(client: AsyncClient):
    """Demo phones always accept OTP 123456 — no DB lookup, no expiry."""
    resp = await client.post("/api/v1/auth/request-otp", json={"phone": "+15550000001"})
    assert resp.status_code == 200

    # Correct demo OTP always works
    resp2 = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": "+15550000001", "code": "123456", "role": "customer"},
    )
    assert resp2.status_code == 200
    data = resp2.json()
    assert data["role"] == "customer"
    assert "access_token" in data

    # Wrong OTP still rejected
    resp3 = await client.post(
        "/api/v1/auth/verify-otp",
        json={"phone": "+15550000001", "code": "000000", "role": "customer"},
    )
    assert resp3.status_code == 400
    assert "123456" in resp3.json()["detail"]
