from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from fastapi import APIRouter, Depends, Request

from app.config import settings
from app.db.session import get_session
from app.models.database import UserRecord
from app.security.auth import require_authenticated_user

router = APIRouter(tags=["system"])


@router.get("/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


@router.get("/status")
async def status(
    request: Request,
    session: AsyncSession = Depends(get_session),
    user: UserRecord = Depends(require_authenticated_user),
):
    watcher = getattr(request.app.state, "watcher", None)
    user_count = (
        await session.execute(select(func.count()).select_from(UserRecord))
    ).scalar() or 0
    watcher_info = {
        "running": watcher is not None and watcher._running,
        "eve_path": str(watcher.eve_path) if watcher else None,
        "lines_processed": watcher.lines_processed if watcher else 0,
        "last_event_at": watcher.last_event_at if watcher else None,
    }
    return {
        "watcher": watcher_info,
        "database": {"status": "connected"},
        "auth": {
            "current_user": user.username,
            "secure_cookie": settings.auth_cookie_secure,
            "session_ttl_hours": settings.auth_session_ttl_hours,
            "user_count": user_count,
        },
        "transport": {
            "secure_ui_origin": settings.secure_ui_origin,
        },
    }
