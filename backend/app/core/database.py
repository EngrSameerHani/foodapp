import re
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings


def _clean_url(url: str) -> str:
    """Strip all SSL/sslmode params — pass SSL via connect_args instead."""
    url = re.sub(r"[?&]sslmode=[^&]*", "", url)
    url = re.sub(r"[?&]ssl=[^&]*", "", url)
    url = re.sub(r"[?&]$", "", url)
    # Ensure asyncpg scheme
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


_db_url = _clean_url(settings.DATABASE_URL)

# Fly.io internal network (.flycast) = no SSL needed
# External Postgres (Supabase, etc.) = SSL required
_is_internal = ".flycast" in _db_url or "localhost" in _db_url or "127.0.0.1" in _db_url
_connect_args = {"ssl": False} if _is_internal else {}

engine = create_async_engine(
    _db_url,
    echo=False,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:  # type: ignore[return]
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
