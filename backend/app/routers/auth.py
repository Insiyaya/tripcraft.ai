from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import AfterValidator, BaseModel, EmailStr, Field

from ..models.user import UserResponse
from ..services.auth_service import (
    MAX_PASSWORD_BYTES,
    MIN_PASSWORD_LENGTH,
    authenticate_user,
    create_jwt,
    get_current_user,
    register_user,
)

router = APIRouter()


def _check_password_bytes(value: str) -> str:
    """bcrypt ignores anything past 72 bytes — refuse rather than silently truncate."""
    if len(value.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(
            f"Password must be at most {MAX_PASSWORD_BYTES} bytes "
            "(non-ASCII characters count as more than one)."
        )
    return value


NewPassword = Annotated[
    str, Field(min_length=MIN_PASSWORD_LENGTH), AfterValidator(_check_password_bytes)
]
# Existing passwords are only compared, never stored, so the minimum doesn't
# apply — accounts created before a rule change must still be able to sign in.
ExistingPassword = Annotated[
    str, Field(min_length=1), AfterValidator(_check_password_bytes)
]


class RegisterRequest(BaseModel):
    email: EmailStr
    password: NewPassword
    name: str = Field(default="", max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: ExistingPassword


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


@router.post("/auth/register", response_model=LoginResponse, status_code=201)
async def register(body: RegisterRequest):
    """Create an account and return a JWT so the client is signed in immediately."""
    user = await register_user(body.email, body.password, body.name)
    return {"token": create_jwt(user["_id"]), "user": user}


@router.post("/auth/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    """Exchange email + password for a JWT."""
    user = await authenticate_user(body.email, body.password)
    return {"token": create_jwt(user["_id"]), "user": user}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
