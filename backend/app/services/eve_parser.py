import json
import logging
from typing import Optional

from app.models.database import AlertRecord, FlowRecord, RawEvent
from app.models.eve_event import EveEvent, EventType

logger = logging.getLogger(__name__)


def parse_eve_line(raw_line: str) -> Optional[EveEvent]:
    """Parse a single JSON line from eve.json into an EveEvent."""
    try:
        data = json.loads(raw_line)
        return EveEvent.model_validate(data)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning("Failed to parse EVE line: %s — %s", raw_line[:120], e)
        return None


def eve_to_alert(event: EveEvent) -> Optional[AlertRecord]:
    """Convert an alert EveEvent to an AlertRecord for DB storage."""
    if event.event_type != EventType.ALERT or event.alert is None:
        return None

    # Serialize protocol context when present on alert events
    http_json = json.dumps(event.http.model_dump(exclude_none=True)) if event.http else None
    dns_json = json.dumps(event.dns.model_dump(exclude_none=True)) if event.dns else None
    tls_json = json.dumps(event.tls.model_dump(exclude_none=True)) if event.tls else None

    return AlertRecord(
        timestamp=event.timestamp,
        flow_id=event.flow_id,
        src_ip=event.src_ip or "",
        src_port=event.src_port,
        dest_ip=event.dest_ip or "",
        dest_port=event.dest_port,
        proto=event.proto,
        community_id=event.community_id,
        app_proto=event.app_proto,
        in_iface=event.in_iface,
        action=event.alert.action,
        signature_id=event.alert.signature_id,
        signature=event.alert.signature,
        category=event.alert.category,
        severity=event.alert.severity,
        gid=event.alert.gid,
        rev=event.alert.rev,
        metadata_json=json.dumps(event.alert.metadata) if event.alert.metadata else None,
        payload_printable=event.payload_printable,
        packet=event.packet,
        http_json=http_json,
        dns_json=dns_json,
        tls_json=tls_json,
    )


def eve_to_flow(event: EveEvent) -> Optional[FlowRecord]:
    """Convert a flow EveEvent to a FlowRecord for DB storage."""
    if event.event_type != EventType.FLOW or event.flow is None:
        return None

    return FlowRecord(
        timestamp=event.timestamp,
        flow_id=event.flow_id,
        src_ip=event.src_ip or "",
        src_port=event.src_port,
        dest_ip=event.dest_ip or "",
        dest_port=event.dest_port,
        proto=event.proto,
        community_id=event.community_id,
        app_proto=event.app_proto,
        pkts_toserver=event.flow.pkts_toserver,
        pkts_toclient=event.flow.pkts_toclient,
        bytes_toserver=event.flow.bytes_toserver,
        bytes_toclient=event.flow.bytes_toclient,
        flow_start=event.flow.start,
        flow_end=event.flow.end,
        age=event.flow.age,
        state=event.flow.state,
        reason=event.flow.reason,
        alerted=event.flow.alerted or False,
    )


def eve_to_raw(event: EveEvent, raw_line: str) -> RawEvent:
    """Convert any EveEvent to a RawEvent for the raw log table."""
    return RawEvent(
        timestamp=event.timestamp,
        event_type=event.event_type.value,
        raw_json=raw_line.strip(),
    )
