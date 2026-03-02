from fastapi import APIRouter, Depends

from ..models.user import GoogleAuthRequest, AuthResponse, UserResponse
from ..services.auth_service import (
    verify_google_token,
    find_or_create_user,
    create_jwt,
    get_current_user,
)

router = APIRouter()


@router.post("/auth/google", response_model=AuthResponse)
async def google_login(request: GoogleAuthRequest):
    google_info = await verify_google_token(request.credential)
    user = await find_or_create_user(google_info)
    token = create_jwt(user["_id"])
    return {
        "access_token": token,
        "user": user,
    }


@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
