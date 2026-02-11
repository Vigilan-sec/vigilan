from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel


class EventType(str, Enum):
    ALERT = "alert"
    HTTP = "http"
    DNS = "dns"
    TLS = "tls"
    FLOW = "flow"
    STATS = "stats"


class SuricataAlert(BaseModel):
    action: str
    gid: int = 1
    signature_id: int
    rev: int = 1
    signature: str
    category: str = ""
    severity: int = 3
    metadata: Optional[dict] = None


class SuricataFlow(BaseModel):
    pkts_toserver: int = 0
    pkts_toclient: int = 0
    bytes_toserver: int = 0
    bytes_toclient: int = 0
    start: datetime
    end: Optional[datetime] = None
    age: Optional[int] = None
    state: Optional[str] = None
    reason: Optional[str] = None
    alerted: Optional[bool] = None


class SuricataHttp(BaseModel):
    hostname: Optional[str] = None
    url: Optional[str] = None
    http_user_agent: Optional[str] = None
    http_content_type: Optional[str] = None
    http_method: Optional[str] = None
    http_refer: Optional[str] = None
    protocol: Optional[str] = None
    status: Optional[int] = None
    length: Optional[int] = None


class SuricataDns(BaseModel):
    type: Optional[str] = None
    id: Optional[int] = None
    rrname: Optional[str] = None
    rrtype: Optional[str] = None
    rcode: Optional[str] = None
    rdata: Optional[str] = None
    ttl: Optional[int] = None
    tx_id: Optional[int] = None


class SuricataTls(BaseModel):
    subject: Optional[str] = None
    issuerdn: Optional[str] = None
    serial: Optional[str] = None
    fingerprint: Optional[str] = None
    version: Optional[str] = None
    sni: Optional[str] = None
    notbefore: Optional[datetime] = None
    notafter: Optional[datetime] = None
    ja3: Optional[dict] = None
    ja3s: Optional[dict] = None


class EveEvent(BaseModel):
    timestamp: datetime
    flow_id: Optional[int] = None
    in_iface: Optional[str] = None
    event_type: EventType
    src_ip: Optional[str] = None
    src_port: Optional[int] = None
    dest_ip: Optional[str] = None
    dest_port: Optional[int] = None
    proto: Optional[str] = None
    community_id: Optional[str] = None
    app_proto: Optional[str] = None

    # Packet payload fields (enabled via eve-log alert config)
    payload: Optional[str] = None
    payload_printable: Optional[str] = None
    packet: Optional[str] = None

    alert: Optional[SuricataAlert] = None
    flow: Optional[SuricataFlow] = None
    http: Optional[SuricataHttp] = None
    dns: Optional[SuricataDns] = None
    tls: Optional[SuricataTls] = None
    stats: Optional[dict] = None
