"""WebSocket endpoint for live order tracking."""
import asyncio
import logging

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.core.security import decode_access_token
from app.websockets.manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/orders/{order_id}")
async def order_tracking_ws(
    websocket: WebSocket,
    order_id: str,
    token: str = Query(...),
):
    # Authenticate via query param
    try:
        decode_access_token(token)
    except jwt.PyJWTError:
        await websocket.close(code=4001)
        return

    room_id = f"order_{order_id}"
    await ws_manager.connect(websocket, room_id)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, room_id)
    except Exception as exc:
        logger.warning("WS error room=%s: %s", room_id, exc)
        ws_manager.disconnect(websocket, room_id)
