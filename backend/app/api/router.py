from fastapi import APIRouter

from app.api.alerts import router as alerts_router
from app.api.events import router as events_router
from app.api.flows import router as flows_router
from app.api.system import router as system_router
from app.api.ws import router as ws_router

api_router = APIRouter(prefix="/api")
api_router.include_router(system_router)
api_router.include_router(alerts_router, prefix="/alerts")
api_router.include_router(flows_router, prefix="/flows")
api_router.include_router(events_router, prefix="/events")
api_router.include_router(ws_router, prefix="/ws")
