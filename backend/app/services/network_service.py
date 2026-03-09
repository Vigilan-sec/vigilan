from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.models.database import AlertRecord, FlowRecord

KNOWN_DEVICES = {
    "10.77.0.20": {
        "label": "attacker",
        "role": "attacker",
        "segment": "LAN",
        "kind": "lab",
        "details": "Netshoot attacker workstation",
    },
    "10.78.0.10": {
        "label": "victim",
        "role": "victim",
        "segment": "LAN2",
        "kind": "lab",
        "details": "Victim host with SSH and demo web service",
    },
    "10.77.0.2": {
        "label": "gateway-lan",
        "role": "gateway",
        "segment": "LAN",
        "kind": "lab",
        "details": "Gateway interface towards attacker LAN",
    },
    "10.78.0.2": {
        "label": "gateway-lan2",
        "role": "gateway",
        "segment": "LAN2",
        "kind": "lab",
        "details": "Gateway interface towards victim LAN",
    },
    "172.29.0.2": {
        "label": "gateway-wan",
        "role": "gateway",
        "segment": "WAN",
        "kind": "lab",
        "details": "Gateway interface towards WAN",
    },
    "172.29.0.53": {
        "label": "dns",
        "role": "dns",
        "segment": "WAN",
        "kind": "lab",
        "details": "CoreDNS service for the demo WAN",
    },
    "172.29.0.80": {
        "label": "malicious-web",
        "role": "service",
        "segment": "WAN",
        "kind": "lab",
        "details": "Malicious web host used by playbooks",
    },
}


def _empty_device(ip: str) -> dict:
    known = KNOWN_DEVICES.get(ip, {})
    return {
        "ip": ip,
        "label": known.get("label", "observed-host"),
        "role": known.get("role", "observed"),
        "segment": known.get("segment", "observed"),
        "kind": known.get("kind", "observed"),
        "details": known.get("details", "Observed from Suricata traffic"),
        "last_seen": None,
        "total_flows": 0,
        "total_alerts": 0,
        "total_bytes": 0,
        "protocols": {},
    }


def _touch_last_seen(device: dict, timestamp: Optional[datetime]) -> None:
    if timestamp is None:
        return
    if device["last_seen"] is None or timestamp > device["last_seen"]:
        device["last_seen"] = timestamp


async def get_network_overview(session: AsyncSession) -> dict:
    devices = {ip: _empty_device(ip) for ip in KNOWN_DEVICES}

    src_flow_rows = (
        await session.execute(
            select(
                FlowRecord.src_ip.label("ip"),
                func.count().label("flows"),
                func.coalesce(
                    func.sum(FlowRecord.bytes_toserver + FlowRecord.bytes_toclient), 0
                ).label("bytes_total"),
                func.max(FlowRecord.timestamp).label("last_seen"),
            ).group_by(FlowRecord.src_ip)
        )
    ).all()
    dst_flow_rows = (
        await session.execute(
            select(
                FlowRecord.dest_ip.label("ip"),
                func.count().label("flows"),
                func.coalesce(
                    func.sum(FlowRecord.bytes_toserver + FlowRecord.bytes_toclient), 0
                ).label("bytes_total"),
                func.max(FlowRecord.timestamp).label("last_seen"),
            ).group_by(FlowRecord.dest_ip)
        )
    ).all()

    for row in list(src_flow_rows) + list(dst_flow_rows):
        device = devices.setdefault(row.ip, _empty_device(row.ip))
        device["total_flows"] += row.flows
        device["total_bytes"] += int(row.bytes_total or 0)
        _touch_last_seen(device, row.last_seen)

    src_alert_rows = (
        await session.execute(
            select(
                AlertRecord.src_ip.label("ip"),
                func.count().label("alerts"),
                func.max(AlertRecord.timestamp).label("last_seen"),
            ).group_by(AlertRecord.src_ip)
        )
    ).all()
    dst_alert_rows = (
        await session.execute(
            select(
                AlertRecord.dest_ip.label("ip"),
                func.count().label("alerts"),
                func.max(AlertRecord.timestamp).label("last_seen"),
            ).group_by(AlertRecord.dest_ip)
        )
    ).all()

    for row in list(src_alert_rows) + list(dst_alert_rows):
        device = devices.setdefault(row.ip, _empty_device(row.ip))
        device["total_alerts"] += row.alerts
        _touch_last_seen(device, row.last_seen)

    proto_expr = func.coalesce(FlowRecord.app_proto, FlowRecord.proto, "unknown")
    proto_rows = (
        await session.execute(
            select(
                FlowRecord.src_ip.label("ip"),
                proto_expr.label("proto"),
                func.count().label("count"),
            )
            .group_by(FlowRecord.src_ip, "proto")
            .order_by(desc("count"))
        )
    ).all()
    proto_rows += (
        await session.execute(
            select(
                FlowRecord.dest_ip.label("ip"),
                proto_expr.label("proto"),
                func.count().label("count"),
            )
            .group_by(FlowRecord.dest_ip, "proto")
            .order_by(desc("count"))
        )
    ).all()

    for row in proto_rows:
        device = devices.setdefault(row.ip, _empty_device(row.ip))
        protocols = device["protocols"]
        protocols[row.proto] = protocols.get(row.proto, 0) + row.count

    last_seen_values = [
        device["last_seen"] for device in devices.values() if device["last_seen"] is not None
    ]
    latest_observed = max(last_seen_values) if last_seen_values else None

    network_devices = []
    for device in devices.values():
        sorted_protocols = sorted(
            device["protocols"].items(),
            key=lambda item: item[1],
            reverse=True,
        )
        if latest_observed and device["last_seen"]:
            status = (
                "active"
                if latest_observed - device["last_seen"] <= timedelta(minutes=15)
                else "idle"
            )
        else:
            status = "unseen"
        network_devices.append(
            {
                "ip": device["ip"],
                "label": device["label"],
                "role": device["role"],
                "segment": device["segment"],
                "kind": device["kind"],
                "details": device["details"],
                "status": status,
                "last_seen": device["last_seen"],
                "total_flows": device["total_flows"],
                "total_alerts": device["total_alerts"],
                "total_bytes": device["total_bytes"],
                "top_protocols": [proto for proto, _ in sorted_protocols[:3]],
            }
        )

    network_devices.sort(
        key=lambda item: (
            {"active": 0, "idle": 1, "unseen": 2}.get(item["status"], 3),
            -item["total_alerts"],
            -item["total_flows"],
            item["ip"],
        )
    )

    summary = {
        "total_devices": len(network_devices),
        "active_devices": sum(1 for item in network_devices if item["status"] == "active"),
        "known_devices": sum(1 for item in network_devices if item["kind"] == "lab"),
        "observed_devices": sum(1 for item in network_devices if item["kind"] != "lab"),
        "last_observed_at": latest_observed,
    }

    return {
        "summary": summary,
        "devices": network_devices,
    }
