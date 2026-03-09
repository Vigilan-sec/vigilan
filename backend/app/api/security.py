from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.security_service import get_security_overview

router = APIRouter(tags=["security"])


@router.get("/overview")
async def security_overview(
    since: Optional[datetime] = Query(None),
    until: Optional[datetime] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    return await get_security_overview(session, since=since, until=until)
