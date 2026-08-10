import logging

from fastapi import APIRouter

from ..database import get_database

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health")
async def health_check():
    """Report app and database reachability.

    The database check matters because motor connects lazily: the app starts and
    serves fine with an unusable MONGO_URI, and the first request to touch a
    collection is what fails. Without this, that shows up as an opaque 500 on
    whatever endpoint the user happened to hit.

    Only the exception *type* is returned — enough to tell an auth failure from a
    network/allowlist problem — because the message can carry the connection
    string. The full detail goes to the server log.
    """
    database = get_database()

    if database is None:
        logger.error("Health check: database was never initialised")
        return {"status": "degraded", "database": "uninitialised"}

    try:
        await database.command("ping")
    except Exception as err:
        logger.exception("Health check: database ping failed")
        return {
            "status": "degraded",
            "database": "unreachable",
            "error_type": type(err).__name__,
        }

    return {"status": "healthy", "database": "ok"}
