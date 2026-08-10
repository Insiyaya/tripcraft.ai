import logging

import pymongo
from fastapi import APIRouter

from ..config import settings
from ..database import get_database

logger = logging.getLogger(__name__)

router = APIRouter()


def _uri_scheme() -> str:
    """Just the scheme, never the host or credentials.

    Distinguishes the two failure modes worth knowing about from outside: a
    `mongodb+srv` URI needs DNS SRV resolution and dnspython, a plain `mongodb`
    one doesn't. Reported as "unset" when MONGO_URI was never provided and the
    built-in localhost default is in play.
    """
    uri = settings.mongo_uri
    if not uri or uri == "mongodb://localhost:27017":
        return "unset (defaulting to localhost)"
    return uri.split("://", 1)[0] if "://" in uri else "malformed"


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
            # Both non-sensitive, and together they separate the usual causes:
            # an unset URI, a bad SRV/DNS setup, or a driver too new for the
            # server it's talking to. The message itself stays in the log.
            "uri_scheme": _uri_scheme(),
            "pymongo_version": pymongo.version,
        }

    return {"status": "healthy", "database": "ok"}
