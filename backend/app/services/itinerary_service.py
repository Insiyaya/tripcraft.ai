from datetime import datetime, timezone

from bson import ObjectId

from ..database import get_database


async def get_itinerary_by_trip_id(trip_id: str) -> dict | None:
    db = get_database()
    doc = await db.itineraries.find_one(
        {"trip_id": trip_id},
        sort=[("version", -1)],
    )
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def save_itinerary(trip_id: str, itinerary_data: dict) -> dict:
    db = get_database()
    existing = await get_itinerary_by_trip_id(trip_id)
    version = (existing["version"] + 1) if existing else 1

    doc = {
        "trip_id": trip_id,
        "version": version,
        **itinerary_data,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.itineraries.insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await db.trips.update_one(
        {"_id": ObjectId(trip_id)},
        {"$set": {"status": "planned", "updated_at": datetime.now(timezone.utc)}},
    )
    return doc
