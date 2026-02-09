import asyncio
import logging
from pathlib import Path

import aiofiles

from app.db.session import async_session
from app.services.broadcast import ConnectionManager
from app.services.eve_parser import eve_to_alert, eve_to_flow, eve_to_raw, parse_eve_line
from app.models.eve_event import EventType

logger = logging.getLogger(__name__)


class EveWatcher:
    """Watches the eve.json file for new lines (poll-based tail).

    Polling is used instead of inotify for compatibility with Docker
    shared volumes and cross-platform support.
    """

    def __init__(
        self,
        eve_path: Path,
        ws_manager: ConnectionManager,
        poll_interval: float = 0.5,
        start_at_end: bool = True,
    ):
        self.eve_path = eve_path
        self.ws_manager = ws_manager
        self.poll_interval = poll_interval
        self.start_at_end = start_at_end
        self._offset: int = 0
        self._running: bool = False
        self._task: asyncio.Task | None = None
        self.lines_processed: int = 0
        self.last_event_at: str | None = None

    async def start(self) -> None:
        self._running = True
        # Optionally seek to end on startup so we don't replay history
        if self.eve_path.exists() and self.start_at_end:
            self._offset = self.eve_path.stat().st_size
        self._task = asyncio.create_task(self._watch_loop())
        logger.info("EveWatcher started, watching %s", self.eve_path)

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("EveWatcher stopped")

    async def _watch_loop(self) -> None:
        while self._running:
            try:
                if self.eve_path.exists():
                    current_size = self.eve_path.stat().st_size
                    if current_size > self._offset:
                        async with aiofiles.open(self.eve_path, "r") as f:
                            await f.seek(self._offset)
                            new_data = await f.read()
                            self._offset = current_size

                            for line in new_data.strip().split("\n"):
                                if line.strip():
                                    await self._process_line(line)
                    elif current_size < self._offset:
                        # File was rotated / truncated
                        logger.info("EVE file rotated, resetting offset")
                        self._offset = 0
            except Exception:
                logger.exception("EveWatcher error")

            await asyncio.sleep(self.poll_interval)

    async def _process_line(self, raw_line: str) -> None:
        event = parse_eve_line(raw_line)
        if event is None:
            return

        self.lines_processed += 1
        self.last_event_at = event.timestamp.isoformat()

        async with async_session() as session:
            # Always store raw event
            raw_record = eve_to_raw(event, raw_line)
            session.add(raw_record)

            # Route by event type
            if event.event_type == EventType.ALERT:
                alert = eve_to_alert(event)
                if alert:
                    session.add(alert)
                    await session.commit()
                    await session.refresh(alert)
                    # Broadcast to WS clients
                    await self.ws_manager.broadcast({
                        "type": "new_alert",
                        "data": {
                            "id": alert.id,
                            "timestamp": alert.timestamp.isoformat(),
                            "src_ip": alert.src_ip,
                            "src_port": alert.src_port,
                            "dest_ip": alert.dest_ip,
                            "dest_port": alert.dest_port,
                            "proto": alert.proto,
                            "action": alert.action,
                            "signature_id": alert.signature_id,
                            "signature": alert.signature,
                            "category": alert.category,
                            "severity": alert.severity,
                        },
                    })
                    return  # Already committed

            elif event.event_type == EventType.FLOW:
                flow = eve_to_flow(event)
                if flow:
                    session.add(flow)

            await session.commit()
