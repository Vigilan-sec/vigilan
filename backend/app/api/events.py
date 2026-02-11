from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.session import get_session
from app.models.database import RawEvent
from app.utils.datetime import ensure_paris_fields

router = APIRouter(tags=["events"])


@router.get("")
async def list_events(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    event_type: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session),
):
    query = select(RawEvent)
    count_query = select(func.count()).select_from(RawEvent)

    if event_type:
        query = query.where(RawEvent.event_type == event_type)
        count_query = count_query.where(RawEvent.event_type == event_type)
    if since:
        query = query.where(RawEvent.timestamp >= since)
        count_query = count_query.where(RawEvent.timestamp >= since)
    if until:
        query = query.where(RawEvent.timestamp <= until)
        count_query = count_query.where(RawEvent.timestamp <= until)

    query = query.order_by(RawEvent.timestamp.desc())
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await session.execute(query)
    items = list(result.scalars().all())
    for item in items:
        ensure_paris_fields(item, ["timestamp", "ingested_at"])

    count_result = await session.execute(count_query)
    total = count_result.scalar() or 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 0,
    }
