import json
import traceback
from contextlib import suppress

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from ..services.auth_service import decode_jwt
from ..services.trip_service import get_trip_by_id
from ..services.agent_service import run_agent_stream

router = APIRouter()


async def _safe_send_json(websocket: WebSocket, payload: dict) -> bool:
    """Send a WS payload if the connection is still open."""
    try:
        await websocket.send_json(payload)
        return True
    except (WebSocketDisconnect, RuntimeError):
        return False


@router.websocket("/ws/trips/{trip_id}/chat")
async def trip_chat(websocket: WebSocket, trip_id: str, token: str = Query(default="")):
    await websocket.accept()

    # Validate auth token
    if not token:
        await _safe_send_json(websocket, {"type": "error", "content": "Authentication required"})
        with suppress(Exception):
            await websocket.close()
        return

    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except Exception:
        await _safe_send_json(websocket, {"type": "error", "content": "Invalid token"})
        with suppress(Exception):
            await websocket.close()
        return

    trip = await get_trip_by_id(trip_id, user_id)
    if not trip:
        await _safe_send_json(websocket, {"type": "error", "content": "Trip not found"})
        with suppress(Exception):
            await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action", "chat")
            message = data.get("message", "")
            client_connected = True

            try:
                async for event in run_agent_stream(trip, message, action):
                    # Keep consuming stream even if client disconnects so itinerary can still be saved.
                    if client_connected:
                        client_connected = await _safe_send_json(websocket, event)
                if not client_connected:
                    break
            except Exception as e:
                traceback.print_exc()
                delivered = await _safe_send_json(websocket, {
                    "type": "error",
                    "content": str(e),
                })
                if not delivered:
                    break

    except WebSocketDisconnect:
        pass
