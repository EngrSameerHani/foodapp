from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator
from typing import List
import json
import os


def _fix_db_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str = "postgresql+asyncpg://zawadi:secret@localhost:5432/zawadi_food"
    SECRET_KEY: str = "dev-secret-key-change-in-production-32b"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    OTP_EXPIRE_SECONDS: int = 300
    OTP_MAX_ATTEMPTS: int = 3
    OTP_RATE_LIMIT_WINDOW_SECONDS: int = 600
    OTP_RATE_LIMIT_MAX_REQUESTS: int = 3

    EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"
    PER_KM_RATE: float = 0.50
    SERVICE_FEE: float = 1.99
    TAX_RATE: float = 0.08

    # CORS_ORIGINS — NOT set via env var to avoid parsing issues.
    # Change this list directly for production restrictions.
    CORS_ORIGINS: List[str] = ["*"]
    MEDIA_DIR: str = "./media"
    PYTHON_VERSION: str = "3.12.0"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors(cls, v):
        if isinstance(v, str):
            v = v.strip()
            # Handle JSON array string: ["*"] or ["url1","url2"]
            if v.startswith("["):
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Handle comma-separated: * or http://a.com,http://b.com
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    def model_post_init(self, __context) -> None:
        object.__setattr__(self, "DATABASE_URL", _fix_db_url(self.DATABASE_URL))


settings = Settings()
