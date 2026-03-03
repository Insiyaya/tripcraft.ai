import logging
from datetime import datetime, timezone, timedelta
from typing import Any

import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..config import settings
from ..database import get_database

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)

_google_transport = google_requests.Request()


def verify_google_token(credential: str) -> dict[str, Any]:
    """Verify a Google OAuth2 ID token and return the payload."""
    try:
        payload = id_token.verify_oauth2_token(
            credential,
            _google_transport,
            audience=settings.google_client_id,
        )
        return payload
    except Exception as err:
        logger.warning("Google token verification failed: %s", err)
        raise HTTPException(status_code=401, detail="Invalid Google token")


def create_jwt(user_id: str) -> str:
    """Issue a signed HS256 JWT for the given user."""
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
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
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError as err:
        logger.warning("JWT verification failed: %s", err)
        raise HTTPException(status_code=401, detail="Invalid token")


async def find_or_create_user(google_payload: dict[str, Any]) -> dict:
    """Find existing user by Google sub or create a new one."""
    google_sub = google_payload.get("sub", "")
    email = google_payload.get("email", "")
    name = google_payload.get("name", "TripCraft User")
    picture = google_payload.get("picture", "")

    if not google_sub:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    db = get_database()

    user_fields = {
        "email": email,
        "name": name,
        "picture": picture,
        "last_login": datetime.now(timezone.utc),
    }

    # Try finding by google_sub first
    user = await db.users.find_one({"google_sub": google_sub})
    if not user:
        # Migration: link legacy users (from Clerk or earlier) by email
        user = await db.users.find_one({"email": email})

    if user:
        user_fields["google_sub"] = google_sub
        await db.users.update_one({"_id": user["_id"]}, {"$set": user_fields})
        user.update(user_fields)
    else:
        user_doc = {
            "google_sub": google_sub,
            "created_at": datetime.now(timezone.utc),
            **user_fields,
        }
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc

    user["_id"] = str(user["_id"])
    return user


async def _get_user_by_id(user_id: str) -> dict:
    """Look up a user by MongoDB _id."""
    from bson import ObjectId

    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user ID")

    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user["_id"] = str(user["_id"])
    return user


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
