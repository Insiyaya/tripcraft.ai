from datetime import datetime, timezone

from bson import ObjectId

from ..database import get_database
from ..models.trip import TripCreate, TripUpdate


async def create_trip(trip: TripCreate, user_id: str) -> dict:
    db = get_database()
    now = datetime.now(timezone.utc)
    doc = {
        **trip.model_dump(),
        "user_id": user_id,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    result = await db.trips.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def get_trips(user_id: str) -> list[dict]:
    db = get_database()
    trips = []
    cursor = db.trips.find({"user_id": user_id}).sort("created_at", -1)
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        trips.append(doc)
    return trips


async def get_trip_by_id(trip_id: str, user_id: str | None = None) -> dict | None:
    db = get_database()
    if not ObjectId.is_valid(trip_id):
        return None
    query = {"_id": ObjectId(trip_id)}
    if user_id:
        query["user_id"] = user_id
    doc = await db.trips.find_one(query)
    if doc:
        doc["_id"] = str(doc["_id"])
    return doc


async def update_trip(trip_id: str, trip_update: TripUpdate, user_id: str) -> dict | None:
    db = get_database()
    if not ObjectId.is_valid(trip_id):
        return None
    update_data = {k: v for k, v in trip_update.model_dump().items() if v is not None}
    if not update_data:
        return await get_trip_by_id(trip_id, user_id)
    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.trips.update_one(
        {"_id": ObjectId(trip_id), "user_id": user_id},
        {"$set": update_data},
    )
    return await get_trip_by_id(trip_id, user_id)


async def delete_trip(trip_id: str, user_id: str) -> bool:
    db = get_database()
    if not ObjectId.is_valid(trip_id):
        return False
    result = await db.trips.delete_one({"_id": ObjectId(trip_id), "user_id": user_id})
    if result.deleted_count:
        await db.itineraries.delete_many({"trip_id": trip_id})
        await db.chat_history.delete_many({"trip_id": trip_id})
    return result.deleted_count > 0
