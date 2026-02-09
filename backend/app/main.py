import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.config import settings
from app.db.init_db import init_db
from app.services.broadcast import ws_manager
from app.services.eve_watcher import EveWatcher

logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Vigilan IDS backend")
    await init_db()

    watcher = None
    if settings.eve_watcher_enabled:
        watcher = EveWatcher(
            eve_path=settings.eve_json_path,
            ws_manager=ws_manager,
            poll_interval=settings.eve_watcher_poll_interval,
            start_at_end=settings.eve_watcher_start_at_end,
        )
        await watcher.start()
        app.state.watcher = watcher

    yield

    # Shutdown
    if watcher:
        await watcher.stop()
    logger.info("Vigilan IDS backend stopped")


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "message": "Vigilan IDS backend is running",
        "health": "/api/health",
        "docs": "/docs",
    }
