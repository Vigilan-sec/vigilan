from fastapi import APIRouter
from fastapi import Depends

from app.api.alerts import router as alerts_router
from app.api.auth import router as auth_router
from app.api.charts import router as charts_router
from app.api.events import router as events_router
from app.api.flows import router as flows_router
from app.api.security import router as security_router
from app.api.system import router as system_router
from app.api.ws import router as ws_router
from app.api.rag import router as rag_router
from app.security.auth import require_authenticated_user

api_router = APIRouter(prefix="/api")
api_router.include_router(system_router)
api_router.include_router(auth_router, prefix="/auth")
api_router.include_router(
    alerts_router,
    prefix="/alerts",
    dependencies=[Depends(require_authenticated_user)],
)
api_router.include_router(
    flows_router,
    prefix="/flows",
    dependencies=[Depends(require_authenticated_user)],
)
api_router.include_router(
    events_router,
    prefix="/events",
    dependencies=[Depends(require_authenticated_user)],
)
api_router.include_router(
    charts_router,
    prefix="/charts",
    dependencies=[Depends(require_authenticated_user)],
)
api_router.include_router(
    security_router,
    prefix="/security",
    dependencies=[Depends(require_authenticated_user)],
)
api_router.include_router(ws_router, prefix="/ws")
api_router.include_router(
    rag_router,
    prefix="/rag",
    dependencies=[Depends(require_authenticated_user)],
)
