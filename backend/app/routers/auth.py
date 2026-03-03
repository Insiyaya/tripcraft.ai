from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..models.user import UserResponse
from ..services.auth_service import (
    get_current_user,
    verify_google_token,
    find_or_create_user,
    create_jwt,
)

router = APIRouter()


class GoogleLoginRequest(BaseModel):
    credential: str


class LoginResponse(BaseModel):
    token: str
    user: UserResponse


@router.post("/auth/google", response_model=LoginResponse)
async def google_login(body: GoogleLoginRequest):
    """Exchange a Google ID token for a self-issued JWT + user profile."""
    google_payload = verify_google_token(body.credential)
    user = await find_or_create_user(google_payload)
    token = create_jwt(user["_id"])
    return {"token": token, "user": user}


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
