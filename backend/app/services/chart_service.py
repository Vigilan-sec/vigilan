from datetime import datetime
from typing import Optional

from sqlalchemy import func, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.database import AlertRecord, RawEvent


def _pivot_rows(rows: list[tuple[str, str, int]]) -> dict:
    """Convert (ip, dimension, count) rows into Recharts-friendly format.

    Returns {"data": [{"ip": "10.0.0.1", "HTTP": 45, ...}], "keys": ["DNS", "HTTP"]}
    """
    keys: set[str] = set()
    ip_map: dict[str, dict] = {}
    ip_totals: dict[str, int] = {}

    for ip, dimension, count in rows:
        dim = dimension or "unknown"
        keys.add(dim)
        if ip not in ip_map:
            ip_map[ip] = {"ip": ip}
            ip_totals[ip] = 0
        ip_map[ip][dim] = count
        ip_totals[ip] += count

    # Sort IPs by total descending (most active first)
    sorted_ips = sorted(ip_totals, key=ip_totals.get, reverse=True)
    data = [ip_map[ip] for ip in sorted_ips]

    return {"data": data, "keys": sorted(keys)}


def _time_filters(query, timestamp_col, since, until):
    """Apply optional time range filters."""
    if since:
        query = query.where(timestamp_col >= since)
    if until:
        query = query.where(timestamp_col <= until)
    return query


async def _alert_breakdown(
    session: AsyncSession,
    dimension_col,
    since: Optional[datetime],
    until: Optional[datetime],
) -> dict:
    """Top 10 source IPs from alerts, broken down by a dimension column."""
    # Subquery: top 10 source IPs by alert count
    top_ips_q = (
        select(AlertRecord.src_ip)
        .group_by(AlertRecord.src_ip)
        .order_by(desc(func.count()))
        .limit(10)
    )
    top_ips_q = _time_filters(top_ips_q, AlertRecord.timestamp, since, until)
    top_ips_sq = top_ips_q.subquery()

    # Main query: count per (ip, dimension)
    main_q = (
        select(
            AlertRecord.src_ip,
            func.coalesce(dimension_col, "unknown").label("dimension"),
            func.count().label("cnt"),
        )
        .where(AlertRecord.src_ip.in_(select(top_ips_sq.c.src_ip)))
        .group_by(AlertRecord.src_ip, "dimension")
    )
    main_q = _time_filters(main_q, AlertRecord.timestamp, since, until)

    result = await session.execute(main_q)
    rows = [(r.src_ip, r.dimension, r.cnt) for r in result.all()]
    return _pivot_rows(rows)


async def get_ip_breakdown_charts(
    session: AsyncSession,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
) -> dict:
    """Return all 4 chart datasets for IP breakdown stacked bar charts."""

    by_app_proto = await _alert_breakdown(
        session, AlertRecord.app_proto, since, until
    )
    by_category = await _alert_breakdown(
        session, AlertRecord.category, since, until
    )
    by_action = await _alert_breakdown(
        session, AlertRecord.action, since, until
    )

    # Event type chart: raw_events table (needs json_extract for IP)
    ip_expr = func.json_extract(RawEvent.raw_json, "$.src_ip")

    top_ips_q = (
        select(ip_expr.label("src_ip"))
        .group_by(ip_expr)
        .order_by(desc(func.count()))
        .limit(10)
    )
    top_ips_q = _time_filters(top_ips_q, RawEvent.timestamp, since, until)
    top_ips_sq = top_ips_q.subquery()

    evt_q = (
        select(
            ip_expr.label("src_ip"),
            RawEvent.event_type.label("dimension"),
            func.count().label("cnt"),
        )
        .where(ip_expr.in_(select(top_ips_sq.c.src_ip)))
        .group_by("src_ip", "dimension")
    )
    evt_q = _time_filters(evt_q, RawEvent.timestamp, since, until)

    evt_result = await session.execute(evt_q)
    evt_rows = [(r.src_ip, r.dimension, r.cnt) for r in evt_result.all()]
    by_event_type = _pivot_rows(evt_rows)

    return {
        "by_app_proto": by_app_proto,
        "by_category": by_category,
        "by_event_type": by_event_type,
        "by_action": by_action,
    }
