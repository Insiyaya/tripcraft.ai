from fastapi import APIRouter, Depends

from ..models.user import UserResponse
from ..services.auth_service import get_current_user

router = APIRouter()

@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
