from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.security.auth import get_user_for_token
from app.config import settings
from app.services.broadcast import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/alerts")
async def websocket_alerts(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_session),
):
    token = websocket.cookies.get(settings.auth_cookie_name)
    user = await get_user_for_token(session, token)
    if user is None:
        await websocket.close(code=1008)
        return
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send filter messages later
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
