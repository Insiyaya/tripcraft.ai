from typing import Annotated, Literal, TypedDict

from langgraph.graph.message import add_messages


class Attraction(TypedDict, total=False):
    name: str
    category: str
    lat: float
    lng: float
    estimated_duration_hrs: float
    cost_estimate_usd: float
    opening_hours: str
    rating: float
    description: str


class DayPlan(TypedDict, total=False):
    day_number: int
    date: str
    activities: list[Attraction]
    travel_times_min: list[int]
    weather_summary: str
    total_cost_usd: float


class ValidationIssue(TypedDict, total=False):
    day_number: int
    activity_index: int
    issue_type: str
    description: str
    severity: str


class TripState(TypedDict, total=False):
    # User inputs
    destination: str
    start_date: str
    end_date: str
    budget_usd: float
    currency: str
    interests: list[str]
    travelers: int
    accommodation_area: str

    # Messages for chat
    messages: Annotated[list, add_messages]

    # Research outputs
    destination_info: str
    attractions: list[Attraction]
    weather_forecast: list[dict]
    currency_info: dict

    # Planning outputs
    itinerary: list[DayPlan]

    # Validation outputs
    validation_issues: list[ValidationIssue]
    validation_pass: bool

    # Optimization
    optimized: bool

    # Control flow
    research_sufficient: bool
    iteration_count: int
    current_phase: str
    error: str
