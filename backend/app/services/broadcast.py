import asyncio
import json
import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)
        logger.info("WebSocket client connected (%d total)", len(self.active_connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self.active_connections.discard(websocket)
        logger.info("WebSocket client disconnected (%d total)", len(self.active_connections))

    async def broadcast(self, message: dict) -> None:
        async with self._lock:
            dead: set[WebSocket] = set()
            for conn in self.active_connections:
                try:
                    await conn.send_text(json.dumps(message, default=str))
                except Exception:
                    dead.add(conn)
            self.active_connections -= dead


ws_manager = ConnectionManager()
