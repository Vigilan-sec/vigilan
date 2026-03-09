from datetime import datetime
from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.database import AlertRecord

SCENARIO_DEFINITIONS = [
    {
        "key": "ssh-brute-force",
        "title": "SSH brute-force burst",
        "tactic": "Credential Access",
        "technique": "T1110",
        "severity": "high",
        "description": "Repeated SSH handshakes aimed at the victim SSH service.",
        "signature_ids": [9000105],
    },
    {
        "key": "sql-injection",
        "title": "SQL injection probe",
        "tactic": "Initial Access",
        "technique": "T1190",
        "severity": "high",
        "description": "Suspicious SQL payloads in web requests crossing the gateway.",
        "signature_ids": [9000106, 9000107],
    },
    {
        "key": "command-injection",
        "title": "Command injection probe",
        "tactic": "Execution",
        "technique": "T1059",
        "severity": "high",
        "description": "HTTP requests carrying command-execution style parameters.",
        "signature_ids": [9000108],
    },
    {
        "key": "dns-exfiltration",
        "title": "DNS exfiltration burst",
        "tactic": "Exfiltration",
        "technique": "T1048",
        "severity": "medium",
        "description": "Chunked data hidden inside repeated DNS labels.",
        "signature_ids": [9000109],
    },
    {
        "key": "reverse-shell",
        "title": "Reverse shell callback",
        "tactic": "Command and Control",
        "technique": "T1071",
        "severity": "high",
        "description": "Compromised victim calling back to a high-risk operator port.",
        "signature_ids": [9000110],
    },
    {
        "key": "web-login-spray",
        "title": "Web login spray",
        "tactic": "Credential Access",
        "technique": "T1110",
        "severity": "medium",
        "description": "Repeated web login attempts in a short burst.",
        "signature_ids": [9000111],
    },
    {
        "key": "path-traversal",
        "title": "Directory traversal probe",
        "tactic": "Discovery",
        "technique": "T1083",
        "severity": "medium",
        "description": "Requests attempting to read sensitive files via traversal paths.",
        "signature_ids": [9000112],
    },
    {
        "key": "recon-user-agent",
        "title": "Recon tool user-agent",
        "tactic": "Reconnaissance",
        "technique": "T1595",
        "severity": "low",
        "description": "Web requests identifying themselves as a scanning tool.",
        "signature_ids": [9000113],
    },
]


def _apply_time_filters(query, since, until):
    if since:
        query = query.where(AlertRecord.timestamp >= since)
    if until:
        query = query.where(AlertRecord.timestamp <= until)
    return query


async def get_security_overview(
    session: AsyncSession,
    since: Optional[datetime] = None,
    until: Optional[datetime] = None,
) -> dict:
    tactic_totals: dict[str, int] = {}
    scenarios: list[dict] = []

    for definition in SCENARIO_DEFINITIONS:
        base_query = select(AlertRecord).where(
            AlertRecord.signature_id.in_(definition["signature_ids"])
        )
        base_query = _apply_time_filters(base_query, since, until)
        subquery = base_query.subquery()

        count_query = select(func.count()).select_from(subquery)
        total_alerts = (await session.execute(count_query)).scalar() or 0

        latest_query = (
            select(AlertRecord)
            .where(AlertRecord.signature_id.in_(definition["signature_ids"]))
            .order_by(desc(AlertRecord.timestamp))
            .limit(1)
        )
        latest_query = _apply_time_filters(latest_query, since, until)
        latest = (await session.execute(latest_query)).scalar_one_or_none()

        tactic_totals[definition["tactic"]] = (
            tactic_totals.get(definition["tactic"], 0) + total_alerts
        )
        scenarios.append(
            {
                **definition,
                "total_alerts": total_alerts,
                "last_seen": latest.timestamp if latest else None,
                "last_signature": latest.signature if latest else None,
                "status": "active" if total_alerts > 0 else "quiet",
            }
        )

    tracked_signature_ids = [
        signature_id
        for definition in SCENARIO_DEFINITIONS
        for signature_id in definition["signature_ids"]
    ]
    recent_query = (
        select(AlertRecord)
        .where(AlertRecord.signature_id.in_(tracked_signature_ids))
        .order_by(desc(AlertRecord.timestamp))
        .limit(12)
    )
    recent_query = _apply_time_filters(recent_query, since, until)
    recent_hits = [
        {
            "id": alert.id,
            "timestamp": alert.timestamp,
            "signature": alert.signature,
            "signature_id": alert.signature_id,
            "src_ip": alert.src_ip,
            "dest_ip": alert.dest_ip,
            "dest_port": alert.dest_port,
            "action": alert.action,
            "severity": alert.severity,
        }
        for alert in (await session.execute(recent_query)).scalars().all()
    ]

    source_query = (
        select(AlertRecord.src_ip, func.count().label("count"))
        .where(AlertRecord.signature_id.in_(tracked_signature_ids))
        .group_by(AlertRecord.src_ip)
        .order_by(desc("count"))
        .limit(8)
    )
    source_query = _apply_time_filters(source_query, since, until)
    top_sources = [
        {"ip": row.src_ip, "count": row.count}
        for row in (await session.execute(source_query)).all()
    ]

    tactic_breakdown = [
        {"tactic": tactic, "count": count}
        for tactic, count in sorted(
            tactic_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    return {
        "scenarios": scenarios,
        "tactic_breakdown": tactic_breakdown,
        "recent_hits": recent_hits,
        "top_sources": top_sources,
    }
