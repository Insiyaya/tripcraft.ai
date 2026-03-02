from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class GoogleAuthRequest(BaseModel):
    credential: str


class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: Optional[str] = None

    class Config:
        populate_by_name = True


class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse
