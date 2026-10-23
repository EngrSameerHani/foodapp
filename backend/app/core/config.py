from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import json


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

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

    CORS_ORIGINS: List[str] = ["http://localhost:8081", "exp://localhost:8081"]
    MEDIA_DIR: str = "./media"

    @classmethod
    def _parse_cors(cls, v):
        if isinstance(v, str):
            return json.loads(v)
        return v


settings = Settings()
