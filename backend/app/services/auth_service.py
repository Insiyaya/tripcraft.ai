import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import bcrypt
import jwt
from fastapi import Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pymongo.errors import DuplicateKeyError

from ..config import settings
from ..database import ensure_indexes, get_database

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

# bcrypt only hashes the first 72 bytes of a password and silently ignores the
# rest, which would make any two long passwords sharing a 72-byte prefix
# interchangeable. Reject over-long passwords at the edge rather than truncate.
MAX_PASSWORD_BYTES = 72
MIN_PASSWORD_LENGTH = 8

# Compared against when the email doesn't exist, so a login attempt costs the
# same bcrypt work either way and response time doesn't reveal which addresses
# are registered. Generated once at import; the value is never a real password.
_DUMMY_HASH = bcrypt.hashpw(b"not-a-real-password", bcrypt.gensalt()).decode()


def normalize_email(email: str) -> str:
    """Emails are the login identifier, so casing must not create two accounts."""
    return email.strip().lower()


def _public_user(user: dict) -> dict:
    """Strip secrets before a user document leaves this module.

    The response models would filter `password_hash` out today, but nothing
    stops a future caller from serialising the dict directly, so the hash never
    gets handed out in the first place.
    """
    public = {k: v for k, v in user.items() if k != "password_hash"}
    public["_id"] = str(user["_id"])
    return public


def _hash_password_sync(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode()


def _verify_password_sync(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed stored hash — treat as a failed login rather than a 500.
        logger.warning("Stored password hash is not valid bcrypt")
        return False


async def hash_password(password: str) -> str:
    """Hash a password with bcrypt, off the event loop."""
    # bcrypt is intentionally slow (~100ms). On the event loop it would stall
    # every other in-flight request for the duration.
    return await run_in_threadpool(_hash_password_sync, password)


async def verify_password(password: str, password_hash: str) -> bool:
    """Constant-time compare a password against a bcrypt hash, off the event loop."""
    return await run_in_threadpool(_verify_password_sync, password, password_hash)


def create_jwt(user_id: str) -> str:
    """Issue a signed JWT for the given user."""
    now = datetime.now(timezone.utc)
    payload = {
        "user_id": user_id,
        "exp": now + timedelta(days=settings.jwt_expiry_days),
        "iat": now,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def verify_jwt(token: str) -> dict[str, Any]:
    """Decode and verify a self-issued JWT."""
    try:
        return jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.")
    except jwt.InvalidTokenError as err:
        logger.warning("JWT verification failed: %s", err)
        raise HTTPException(status_code=401, detail="Invalid token")


async def register_user(email: str, password: str, name: str) -> dict:
    """Create a new account. Raises 409 if the email is already registered."""
    email = normalize_email(email)
    name = name.strip() or email.split("@")[0]
    now = datetime.now(timezone.utc)

    db = get_database()

    # Retry index creation here rather than trusting the one attempt at startup:
    # if the database was unreachable then, this is the point where it matters.
    index_ready = await ensure_indexes()

    # Non-atomic pre-check. Two concurrent signups can both pass it, which is
    # why the unique index is the real guard — but when the index could not be
    # built this is the only thing standing between a repeat signup and a
    # duplicate account, so it is not redundant.
    if await db.users.find_one({"email": email}, {"_id": 1}) is not None:
        raise HTTPException(
            status_code=409, detail="An account with that email already exists."
        )

    if not index_ready:
        logger.error(
            "Registering %s without the unique email index in place — concurrent "
            "signups for this address could still create duplicates.",
            email,
        )

    user_doc = {
        "email": email,
        "name": name,
        "picture": None,
        "password_hash": await hash_password(password),
        "created_at": now,
        "last_login": now,
    }

    try:
        result = await db.users.insert_one(user_doc)
    except DuplicateKeyError:
        # Lost the race against a concurrent signup; the index caught it.
        raise HTTPException(
            status_code=409, detail="An account with that email already exists."
        )

    user_doc["_id"] = str(result.inserted_id)
    return _public_user(user_doc)


async def authenticate_user(email: str, password: str) -> dict:
    """Verify email + password and return the user. Raises 401 on any mismatch."""
    email = normalize_email(email)
    db = get_database()
    user = await db.users.find_one({"email": email})

    stored_hash = (user or {}).get("password_hash")

    # Run bcrypt even when there's no such account, so the timing of a failed
    # login doesn't distinguish "wrong password" from "no such user".
    password_ok = await verify_password(password, stored_hash or _DUMMY_HASH)

    if user and not stored_hash:
        # Account predates password auth (created via the old Google sign-in), so
        # there is no password to check. Deliberately NOT offering to set one
        # here: without email verification, "claim the account for this address"
        # hands whoever types the email every trip the original user saved.
        # Migrating these accounts is a one-time admin job — see the note in
        # backend/README-auth.md.
        logger.warning("Login attempt on a password-less legacy account: %s", email)
        raise HTTPException(
            status_code=409,
            detail="This account predates password sign-in and needs to be migrated. "
            "Please contact support.",
        )

    if not user or not password_ok:
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    await db.users.update_one(
        {"_id": user["_id"]}, {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    return _public_user(user)


async def _get_user_by_id(user_id: str) -> dict:
    """Look up a user by MongoDB _id."""
    from bson import ObjectId
    from bson.errors import InvalidId

    db = get_database()
    try:
        object_id = ObjectId(user_id)
    except (InvalidId, TypeError):
        # The id came out of a JWT we signed, so a bad one means a stale or
        # forged token, not a server fault.
        raise HTTPException(status_code=401, detail="Invalid user ID")

    user = await db.users.find_one({"_id": object_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return _public_user(user)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency for HTTP endpoints — reads Bearer token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_jwt(credentials.credentials)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return await _get_user_by_id(user_id)


async def get_current_user_from_token(token: str) -> dict:
    """For WebSocket auth — takes raw token string."""
    payload = verify_jwt(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    return await _get_user_by_id(user_id)
