from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.broadcast import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/alerts")
async def websocket_alerts(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send filter messages later
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
