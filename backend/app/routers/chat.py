import json
import traceback

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from ..services.auth_service import decode_jwt
from ..services.trip_service import get_trip_by_id
from ..services.agent_service import run_agent_stream

router = APIRouter()


@router.websocket("/ws/trips/{trip_id}/chat")
async def trip_chat(websocket: WebSocket, trip_id: str, token: str = Query(default="")):
    await websocket.accept()

    # Validate auth token
    if not token:
        await websocket.send_json({"type": "error", "content": "Authentication required"})
        await websocket.close()
        return

    try:
        payload = decode_jwt(token)
        user_id = payload.get("sub")
    except Exception:
        await websocket.send_json({"type": "error", "content": "Invalid token"})
        await websocket.close()
        return

    trip = await get_trip_by_id(trip_id, user_id)
    if not trip:
        await websocket.send_json({"type": "error", "content": "Trip not found"})
        await websocket.close()
        return

    try:
        while True:
            data = await websocket.receive_json()
            action = data.get("action", "chat")
            message = data.get("message", "")

            try:
                async for event in run_agent_stream(trip, message, action):
                    await websocket.send_json(event)
            except Exception as e:
                traceback.print_exc()
                await websocket.send_json({
                    "type": "error",
                    "content": str(e),
                })

    except WebSocketDisconnect:
        pass
