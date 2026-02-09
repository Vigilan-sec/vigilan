from fastapi import APIRouter, Request

router = APIRouter(tags=["system"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@router.get("/status")
async def status(request: Request):
    watcher = getattr(request.app.state, "watcher", None)
    watcher_info = {
        "running": watcher is not None and watcher._running,
        "eve_path": str(watcher.eve_path) if watcher else None,
        "lines_processed": watcher.lines_processed if watcher else 0,
        "last_event_at": watcher.last_event_at if watcher else None,
    }
    return {
        "watcher": watcher_info,
        "database": {"status": "connected"},
    }
