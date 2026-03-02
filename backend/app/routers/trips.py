from fastapi import APIRouter, HTTPException

from ..models.trip import TripCreate, TripUpdate, TripResponse
from ..services.trip_service import (
    create_trip,
    get_trips,
    get_trip_by_id,
    update_trip,
    delete_trip,
)

router = APIRouter()


@router.post("/trips", response_model=TripResponse)
async def create_trip_endpoint(trip: TripCreate):
    result = await create_trip(trip)
    return result


@router.get("/trips", response_model=list[TripResponse])
async def list_trips_endpoint():
    return await get_trips()


@router.get("/trips/{trip_id}", response_model=TripResponse)
async def get_trip_endpoint(trip_id: str):
    trip = await get_trip_by_id(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.put("/trips/{trip_id}", response_model=TripResponse)
async def update_trip_endpoint(trip_id: str, trip_update: TripUpdate):
    trip = await update_trip(trip_id, trip_update)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip


@router.delete("/trips/{trip_id}")
async def delete_trip_endpoint(trip_id: str):
    deleted = await delete_trip(trip_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")
    return {"message": "Trip deleted"}
