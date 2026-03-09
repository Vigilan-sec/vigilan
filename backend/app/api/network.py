from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.network_service import get_network_overview

router = APIRouter(tags=["network"])


@router.get("/overview")
async def network_overview(
    session: AsyncSession = Depends(get_session),
):
    return await get_network_overview(session)
