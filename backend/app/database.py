import logging

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

from .config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.database_name]
    await _create_indexes()


async def _create_indexes():
    """Enforce one account per email address.

    This index, not an application-level lookup, is what makes registration
    safe: two concurrent signups for the same address both pass a
    read-then-insert check, and only the index rejects the loser.

    Scoped to non-empty strings so it tolerates pre-existing documents with a
    missing or blank email (the old Google sign-in stored "" when the token
    carried no email claim) — several of those would otherwise collide on null
    and the index would never build.
    """
    try:
        await db.users.create_index(
            "email",
            unique=True,
            partialFilterExpression={"email": {"$gt": ""}},
            name="uniq_email",
        )
    except PyMongoError:
        # Almost always duplicate emails already in the collection. Registration
        # would silently allow duplicate accounts, so make it loud rather than
        # taking the whole app down.
        logger.exception(
            "Could not create the unique index on users.email — duplicate accounts "
            "are possible until this is resolved. Check for existing duplicate emails."
        )


async def close_db():
    global client
    if client:
        client.close()


def get_database():
    return db
