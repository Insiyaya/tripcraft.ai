from fastapi import APIRouter, HTTPException

from ..services.itinerary_service import get_itinerary_by_trip_id
from ..services.trip_service import get_trip_by_id

router = APIRouter()


@router.get("/trips/{trip_id}/itinerary")
async def get_itinerary_endpoint(trip_id: str):
    trip = await get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    itinerary = await get_itinerary_by_trip_id(trip_id)
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerary not found. Generate one first.")
    return itinerary
