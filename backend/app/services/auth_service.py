import logging
from datetime import datetime, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..config import settings
from ..database import get_database

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)
_jwk_client: jwt.PyJWKClient | None = None


def _get_jwk_client() -> jwt.PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        jwks_url = settings.clerk_jwks_url
        if not jwks_url and settings.clerk_issuer:
            jwks_url = f"{settings.clerk_issuer.rstrip('/')}/.well-known/jwks.json"
        if not jwks_url:
            raise HTTPException(status_code=500, detail="CLERK_ISSUER or CLERK_JWKS_URL must be configured")
        _jwk_client = jwt.PyJWKClient(jwks_url)
    return _jwk_client


def verify_clerk_token(token: str) -> dict[str, Any]:
    """Validate Clerk JWT and return claims."""
    try:
        signing_key = _get_jwk_client().get_signing_key_from_jwt(token)
        options = {"verify_aud": bool(settings.clerk_audience)}
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            audience=settings.clerk_audience or None,
            issuer=settings.clerk_issuer or None,
            options=options,
        )
        return payload
    except Exception as err:
        logger.warning("Clerk token verification failed: %s", err)
        raise HTTPException(status_code=401, detail="Invalid token")


def _extract_name(payload: dict[str, Any]) -> str:
    full_name = payload.get("full_name")
    if isinstance(full_name, str) and full_name.strip():
        return full_name.strip()
    first_name = payload.get("given_name")
    last_name = payload.get("family_name")
    if isinstance(first_name, str) and first_name.strip():
        if isinstance(last_name, str) and last_name.strip():
            return f"{first_name.strip()} {last_name.strip()}"
        return first_name.strip()
    username = payload.get("username")
    if isinstance(username, str) and username.strip():
        return username.strip()
    return "TripCraft User"


def _extract_email(payload: dict[str, Any], clerk_user_id: str) -> str:
    for key in ("email", "email_address", "primary_email_address"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return f"{clerk_user_id}@clerk.local"


def _extract_picture(payload: dict[str, Any]) -> str:
    for key in ("picture", "image_url", "avatar_url"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


async def find_or_create_user_from_clerk(payload: dict[str, Any]) -> dict:
    """Find existing user by Clerk ID or create one."""
    clerk_user_id = payload.get("sub")
    if not isinstance(clerk_user_id, str) or not clerk_user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    db = get_database()
    user = await db.users.find_one({"clerk_user_id": clerk_user_id})

    user_fields = {
        "email": _extract_email(payload, clerk_user_id),
        "name": _extract_name(payload),
        "picture": _extract_picture(payload),
        "last_login": datetime.now(timezone.utc),
    }

    if user:
        await db.users.update_one({"_id": user["_id"]}, {"$set": user_fields})
        user.update(user_fields)
    else:
        user_doc = {
            "clerk_user_id": clerk_user_id,
            "created_at": datetime.now(timezone.utc),
            **user_fields,
        }
        result = await db.users.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        user = user_doc

    user["_id"] = str(user["_id"])
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = verify_clerk_token(credentials.credentials)
    return await find_or_create_user_from_clerk(payload)


async def get_current_user_from_token(token: str) -> dict:
    payload = verify_clerk_token(token)
    return await find_or_create_user_from_clerk(payload)
