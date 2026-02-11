from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.chart_service import get_ip_breakdown_charts

router = APIRouter(tags=["charts"])


@router.get("/ip-breakdown")
async def ip_breakdown_charts(
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session),
):
    return await get_ip_breakdown_charts(session, since=since, until=until)
