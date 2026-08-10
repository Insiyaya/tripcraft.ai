import logging

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

from .config import settings

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None
db = None

# Whether the unique email index is confirmed present. Starts false and is only
# set once creation actually succeeds, so a failure at startup gets retried
# later instead of leaving the guarantee silently absent for the process's whole
# lifetime.
_indexes_ready = False


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.database_name]
    # Best effort: motor connects lazily, so the database may well be
    # unreachable right now. ensure_indexes() is retried from the write paths
    # that depend on it.
    await ensure_indexes()


async def ensure_indexes() -> bool:
    """Ensure the unique index on users.email exists. Idempotent and cheap.

    Returns True when the index is confirmed present.

    This index, not an application-level lookup, is what makes registration
    race-safe: two concurrent signups for the same address both pass a
    read-then-insert check, and only the index rejects the loser.

    It must be retryable rather than startup-only. A paused Atlas cluster (or
    any transient outage) makes the startup attempt fail, and PyMongo then
    recovers the connection on its own via SRV re-polling — with no restart to
    trigger a second attempt. That combination silently left the collection with
    no uniqueness guarantee, which is exactly how duplicate accounts got in.

    Scoped to non-empty strings so it tolerates pre-existing documents with a
    missing or blank email (the old Google sign-in stored "" when the token
    carried no email claim) — several of those would otherwise collide on null
    and the index would never build.
    """
    global _indexes_ready

    if _indexes_ready:
        return True

    if db is None:
        return False

    try:
        await db.users.create_index(
            "email",
            unique=True,
            partialFilterExpression={"email": {"$gt": ""}},
            name="uniq_email",
        )
    except PyMongoError:
        # Either the database is unreachable, or duplicate emails already in the
        # collection block the build. Callers fall back to a non-atomic check, so
        # this degrades rather than failing the request outright.
        logger.exception(
            "Could not create the unique index on users.email — concurrent signups "
            "for the same address are not fully guarded until this succeeds. If the "
            "database is reachable, look for existing duplicate emails."
        )
        return False

    _indexes_ready = True
    logger.info("Unique index on users.email is present")
    return True


async def close_db():
    global client
    if client:
        client.close()


def get_database():
    return db
