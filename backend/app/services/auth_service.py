import logging
from datetime import datetime, timedelta, timezone

import jwt
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..config import settings
from ..database import get_database

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


async def verify_google_token(credential: str) -> dict:
    """Validate a Google ID token and return user info."""
    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.google_client_id,
        )
        return {
            "google_id": idinfo["sub"],
            "email": idinfo["email"],
            "name": idinfo.get("name", ""),
            "picture": idinfo.get("picture", ""),
        }
    except ValueError as e:
        logger.error("Google token verification failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )


async def find_or_create_user(google_info: dict) -> dict:
    """Find existing user by google_id or create a new one."""
    db = get_database()
    user = await db.users.find_one({"google_id": google_info["google_id"]})

    if user:
        # Update profile info on each login
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "name": google_info["name"],
                "picture": google_info["picture"],
                "last_login": datetime.now(timezone.utc),
            }},
        )
        user["name"] = google_info["name"]
        user["picture"] = google_info["picture"]
    else:
        user_doc = {
            "google_id": google_info["google_id"],
            "email": google_info["email"],
            "name": google_info["name"],
            "picture": google_info["picture"],
            "created_at": datetime.now(timezone.utc),
            "last_login": datetime.now(timezone.utc),
        }
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc

    user["_id"] = str(user["_id"])
    return user


def create_jwt(user_id: str) -> str:
    """Create a JWT token for the given user."""
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expiration_hours),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """FastAPI dependency to extract the current user from JWT."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_jwt(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    db = get_database()
    from bson import ObjectId
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    user["_id"] = str(user["_id"])
    return user
