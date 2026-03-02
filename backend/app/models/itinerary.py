from typing import Optional

from pydantic import BaseModel, Field


class Activity(BaseModel):
    name: str
    category: str
    lat: float
    lng: float
    estimated_duration_hrs: float
    cost_estimate_usd: float
    opening_hours: str = ""
    rating: float = 0.0
    description: str = ""
    start_time: str = ""
    end_time: str = ""


class DayPlan(BaseModel):
    day_number: int
    date: str
    activities: list[Activity]
    travel_times_min: list[int] = []
    weather_summary: str = ""
    total_cost_usd: float = 0.0


class ItineraryResponse(BaseModel):
    id: str = Field(alias="_id")
    trip_id: str
    version: int = 1
    destination_info: str = ""
    currency: dict = {}
    weather_forecast: list[dict] = []
    attractions: list[dict] = []
    days: list[DayPlan] = []
    total_cost_usd: float = 0.0

    class Config:
        populate_by_name = True
