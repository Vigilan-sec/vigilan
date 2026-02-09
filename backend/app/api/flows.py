from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.db.session import get_session
from app.models.database import FlowRecord

router = APIRouter(tags=["flows"])


@router.get("")
async def list_flows(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    src_ip: Optional[str] = None,
    dest_ip: Optional[str] = None,
    proto: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    sort_by: str = Query("timestamp", pattern="^(timestamp|bytes_toserver|bytes_toclient|age)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    session: AsyncSession = Depends(get_session),
):
    query = select(FlowRecord)
    count_query = select(func.count()).select_from(FlowRecord)

    if src_ip:
        query = query.where(FlowRecord.src_ip == src_ip)
        count_query = count_query.where(FlowRecord.src_ip == src_ip)
    if dest_ip:
        query = query.where(FlowRecord.dest_ip == dest_ip)
        count_query = count_query.where(FlowRecord.dest_ip == dest_ip)
    if proto:
        query = query.where(FlowRecord.proto == proto)
        count_query = count_query.where(FlowRecord.proto == proto)
    if since:
        query = query.where(FlowRecord.timestamp >= since)
        count_query = count_query.where(FlowRecord.timestamp >= since)
    if until:
        query = query.where(FlowRecord.timestamp <= until)
        count_query = count_query.where(FlowRecord.timestamp <= until)

    sort_col = getattr(FlowRecord, sort_by, FlowRecord.timestamp)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await session.execute(query)
    items = list(result.scalars().all())

    count_result = await session.execute(count_query)
    total = count_result.scalar() or 0

    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page if per_page else 0,
    }


@router.get("/stats")
async def flow_stats(
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    session: AsyncSession = Depends(get_session),
):
    base_filter = []
    if since:
        base_filter.append(FlowRecord.timestamp >= since)
    if until:
        base_filter.append(FlowRecord.timestamp <= until)

    # Total count and bytes
    totals_q = select(
        func.count().label("total"),
        func.coalesce(func.sum(FlowRecord.bytes_toserver + FlowRecord.bytes_toclient), 0).label("total_bytes"),
    ).select_from(FlowRecord)
    for f in base_filter:
        totals_q = totals_q.where(f)
    totals = (await session.execute(totals_q)).one()

    # By protocol
    proto_q = (
        select(FlowRecord.proto, func.count().label("cnt"))
        .group_by(FlowRecord.proto)
        .order_by(desc("cnt"))
    )
    for f in base_filter:
        proto_q = proto_q.where(f)
    proto_result = await session.execute(proto_q)
    by_proto = {r.proto or "unknown": r.cnt for r in proto_result.all()}

    # Top talkers (by total bytes)
    talker_q = (
        select(
            FlowRecord.src_ip,
            func.sum(FlowRecord.bytes_toserver + FlowRecord.bytes_toclient).label("total_bytes"),
            func.count().label("flows"),
        )
        .group_by(FlowRecord.src_ip)
        .order_by(desc("total_bytes"))
        .limit(10)
    )
    for f in base_filter:
        talker_q = talker_q.where(f)
    talker_result = await session.execute(talker_q)
    top_talkers = [
        {"ip": r.src_ip, "bytes": r.total_bytes, "flows": r.flows}
        for r in talker_result.all()
    ]

    return {
        "total": totals.total,
        "total_bytes": totals.total_bytes,
        "by_proto": by_proto,
        "top_talkers": top_talkers,
    }
