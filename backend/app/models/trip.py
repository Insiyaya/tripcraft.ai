from datetime import datetime
from typing import Optional

from bson import ObjectId
from pydantic import BaseModel, Field


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)


class TripCreate(BaseModel):
    destination: str
    start_date: str
    end_date: str
    budget_usd: float
    interests: list[str]
    travelers: int = 1
    accommodation_area: str = ""


class TripUpdate(BaseModel):
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_usd: Optional[float] = None
    interests: Optional[list[str]] = None
    travelers: Optional[int] = None
    accommodation_area: Optional[str] = None


class TripResponse(BaseModel):
    id: str = Field(alias="_id")
    destination: str
    start_date: str
    end_date: str
    budget_usd: float
    interests: list[str]
    travelers: int
    accommodation_area: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
