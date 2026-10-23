"""WebSocket connection manager — room-based broadcast."""
import asyncio
import logging
from collections import defaultdict

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, ws: WebSocket, room_id: str) -> None:
        await ws.accept()
        self.rooms[room_id].add(ws)
        logger.debug("WS connect room=%s total=%d", room_id, len(self.rooms[room_id]))

    def disconnect(self, ws: WebSocket, room_id: str) -> None:
        self.rooms[room_id].discard(ws)
        if not self.rooms[room_id]:
            del self.rooms[room_id]
        logger.debug("WS disconnect room=%s", room_id)

    async def broadcast(self, room_id: str, message: dict) -> None:
        sockets = list(self.rooms.get(room_id, set()))
        if not sockets:
            return
        dead = []
        for ws in sockets:
            try:
                await ws.send_json(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws, room_id)


ws_manager = ConnectionManager()
