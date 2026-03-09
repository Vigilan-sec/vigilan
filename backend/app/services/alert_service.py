from datetime import datetime
from typing import Optional

from sqlalchemy import desc, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.database import AlertRecord


async def get_alerts(
    session: AsyncSession,
    page: int = 1,
    per_page: int = 50,
    severity: Optional[int] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    src_ip: Optional[str] = None,
    dest_ip: Optional[str] = None,
    signature: Optional[str] = None,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
    sort_by: str = "timestamp",
    sort_order: str = "desc",
) -> tuple[list[AlertRecord], int]:
    """Get paginated, filtered alerts. Returns (items, total_count)."""
    query = select(AlertRecord)
    count_query = select(func.count()).select_from(AlertRecord)

    # Apply filters
    if severity is not None:
        query = query.where(AlertRecord.severity == severity)
        count_query = count_query.where(AlertRecord.severity == severity)
    if category:
        query = query.where(AlertRecord.category == category)
        count_query = count_query.where(AlertRecord.category == category)
    if search:
        search_clause = or_(
            AlertRecord.signature.contains(search),
            AlertRecord.category.contains(search),
            AlertRecord.src_ip.contains(search),
            AlertRecord.dest_ip.contains(search),
        )
        query = query.where(search_clause)
        count_query = count_query.where(search_clause)
    if src_ip:
        query = query.where(AlertRecord.src_ip == src_ip)
        count_query = count_query.where(AlertRecord.src_ip == src_ip)
    if dest_ip:
        query = query.where(AlertRecord.dest_ip == dest_ip)
        count_query = count_query.where(AlertRecord.dest_ip == dest_ip)
    if signature:
        query = query.where(AlertRecord.signature.contains(signature))
        count_query = count_query.where(AlertRecord.signature.contains(signature))
    if since:
        query = query.where(AlertRecord.timestamp >= since)
        count_query = count_query.where(AlertRecord.timestamp >= since)
    if until:
        query = query.where(AlertRecord.timestamp <= until)
        count_query = count_query.where(AlertRecord.timestamp <= until)

    # Sorting
    sort_col = getattr(AlertRecord, sort_by, AlertRecord.timestamp)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    # Pagination
    offset = (page - 1) * per_page
    query = query.offset(offset).limit(per_page)

    result = await session.execute(query)
    items = list(result.scalars().all())

    count_result = await session.execute(count_query)
    total = count_result.scalar() or 0

    return items, total


async def get_alert_by_id(session: AsyncSession, alert_id: int) -> Optional[AlertRecord]:
    result = await session.execute(select(AlertRecord).where(AlertRecord.id == alert_id))
    return result.scalar_one_or_none()


async def get_alert_stats(
    session: AsyncSession,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
) -> dict:
    """Compute aggregated alert statistics."""
    base = select(AlertRecord)
    if since:
        base = base.where(AlertRecord.timestamp >= since)
    if until:
        base = base.where(AlertRecord.timestamp <= until)

    # Total count
    total_q = select(func.count()).select_from(base.subquery())
    total = (await session.execute(total_q)).scalar() or 0

    # By severity
    sev_q = (
        select(AlertRecord.severity, func.count().label("cnt"))
        .where(True)
        .group_by(AlertRecord.severity)
    )
    if since:
        sev_q = sev_q.where(AlertRecord.timestamp >= since)
    if until:
        sev_q = sev_q.where(AlertRecord.timestamp <= until)
    sev_result = await session.execute(sev_q)
    by_severity = {str(row.severity): row.cnt for row in sev_result.all()}

    # Top signatures
    sig_q = (
        select(AlertRecord.signature, AlertRecord.signature_id, func.count().label("cnt"))
        .group_by(AlertRecord.signature, AlertRecord.signature_id)
        .order_by(desc("cnt"))
        .limit(10)
    )
    if since:
        sig_q = sig_q.where(AlertRecord.timestamp >= since)
    if until:
        sig_q = sig_q.where(AlertRecord.timestamp <= until)
    sig_result = await session.execute(sig_q)
    top_signatures = [
        {"signature": r.signature, "sid": r.signature_id, "count": r.cnt}
        for r in sig_result.all()
    ]

    # Top source IPs
    src_q = (
        select(AlertRecord.src_ip, func.count().label("cnt"))
        .group_by(AlertRecord.src_ip)
        .order_by(desc("cnt"))
        .limit(10)
    )
    if since:
        src_q = src_q.where(AlertRecord.timestamp >= since)
    if until:
        src_q = src_q.where(AlertRecord.timestamp <= until)
    src_result = await session.execute(src_q)
    top_src_ips = [{"ip": r.src_ip, "count": r.cnt} for r in src_result.all()]

    # Top dest IPs
    dst_q = (
        select(AlertRecord.dest_ip, func.count().label("cnt"))
        .group_by(AlertRecord.dest_ip)
        .order_by(desc("cnt"))
        .limit(10)
    )
    if since:
        dst_q = dst_q.where(AlertRecord.timestamp >= since)
    if until:
        dst_q = dst_q.where(AlertRecord.timestamp <= until)
    dst_result = await session.execute(dst_q)
    top_dest_ips = [{"ip": r.dest_ip, "count": r.cnt} for r in dst_result.all()]

    # By category
    cat_q = (
        select(AlertRecord.category, func.count().label("cnt"))
        .group_by(AlertRecord.category)
        .order_by(desc("cnt"))
        .limit(10)
    )
    if since:
        cat_q = cat_q.where(AlertRecord.timestamp >= since)
    if until:
        cat_q = cat_q.where(AlertRecord.timestamp <= until)
    cat_result = await session.execute(cat_q)
    by_category = [{"category": r.category, "count": r.cnt} for r in cat_result.all()]

    return {
        "total": total,
        "by_severity": by_severity,
        "by_category": by_category,
        "top_signatures": top_signatures,
        "top_src_ips": top_src_ips,
        "top_dest_ips": top_dest_ips,
    }
