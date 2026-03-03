from typing import Optional

from pydantic import BaseModel, Field

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: str
    picture: Optional[str] = None

    class Config:
        populate_by_name = True
