import re
from pydantic import BaseModel, field_validator


class OTPRequestSchema(BaseModel):
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        # Allow +<digits> or digits only, 7-15 chars
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if not re.match(r"^\+?\d{7,15}$", cleaned):
            raise ValueError("Invalid phone number format")
        return cleaned


class OTPVerifySchema(BaseModel):
    phone: str
    code: str
    role: str = "customer"  # customer / restaurant_owner / rider

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("customer", "restaurant_owner", "rider"):
            raise ValueError("Invalid role")
        return v


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user_id: str
    role: str


class RefreshRequest(BaseModel):
    refresh_token: str
