from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.services.alert_service import get_alert_by_id, get_alert_stats, get_alerts
from app.utils.datetime import ensure_paris_fields

router = APIRouter(tags=["alerts"])


@router.get("")
async def list_alerts(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    severity: Optional[int] = Query(None, ge=1, le=3),
    category: Optional[str] = None,
    src_ip: Optional[str] = None,
    dest_ip: Optional[str] = None,
    signature: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    sort_by: str = Query("timestamp", pattern="^(timestamp|severity|signature)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_session),
):
    items, total = await get_alerts(
        session,
        page=page,
        per_page=per_page,
        severity=severity,
        category=category,
        src_ip=src_ip,
        dest_ip=dest_ip,
        signature=signature,
        since=since,
        until=until,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    for item in items:
        ensure_paris_fields(item, ["timestamp", "ingested_at"])
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 0,
    }


@router.get("/stats")
async def alert_stats(
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session),
):
    return await get_alert_stats(session, since=since, until=until)


@router.get("/{alert_id}")
async def get_alert(
    alert_id: int,
    session: AsyncSession = Depends(get_session),
):
    alert = await get_alert_by_id(session, alert_id)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    ensure_paris_fields(alert, ["timestamp", "ingested_at"])
    return alert
