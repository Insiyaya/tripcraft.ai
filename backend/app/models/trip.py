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
    origin: str = ""
    destination: str
    start_date: str
    end_date: str
    # NOT in USD, despite the name. Holds the number the user typed, in the
    # `currency` below — kept for backwards compatibility with stored documents.
    # Itinerary costs (cost_estimate_usd, total_cost_usd) ARE in real USD, so the
    # two must never be formatted the same way: converting this one again shows
    # an Indian user their ₹80,000 budget as ₹6,640,000.
    # nodes._budget_in_usd() divides by the exchange rate to get true USD.
    budget_usd: float
    currency: str = "USD"
    interests: list[str]
    travelers: int = 1
    accommodation_area: str = ""


class TripUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget_usd: Optional[float] = None
    currency: Optional[str] = None
    interests: Optional[list[str]] = None
    travelers: Optional[int] = None
    accommodation_area: Optional[str] = None


class TripResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str = ""
    origin: str = ""
    destination: str
    start_date: str
    end_date: str
    budget_usd: float
    currency: str = "USD"
    interests: list[str]
    travelers: int
    accommodation_area: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
