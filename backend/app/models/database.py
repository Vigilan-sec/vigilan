from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class AlertRecord(SQLModel, table=True):
    __tablename__ = "alerts"

    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(index=True)
    flow_id: Optional[int] = None
    src_ip: str = Field(index=True)
    src_port: Optional[int] = None
    dest_ip: str = Field(index=True)
    dest_port: Optional[int] = None
    proto: Optional[str] = None
    community_id: Optional[str] = None
    app_proto: Optional[str] = None
    in_iface: Optional[str] = None

    action: str = "allowed"
    signature_id: int = Field(index=True)
    signature: str = ""
    category: str = Field(default="", index=True)
    severity: int = Field(default=3, index=True)
    gid: int = 1
    rev: int = 1
    metadata_json: Optional[str] = None

    # Enriched payload data from Suricata eve-log
    payload_printable: Optional[str] = None
    packet: Optional[str] = None

    # Protocol context (http/dns/tls object serialized as JSON when present)
    http_json: Optional[str] = None
    dns_json: Optional[str] = None
    tls_json: Optional[str] = None

    ingested_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class FlowRecord(SQLModel, table=True):
    __tablename__ = "flows"

    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(index=True)
    flow_id: Optional[int] = Field(default=None, index=True)
    src_ip: str = Field(index=True)
    src_port: Optional[int] = None
    dest_ip: str = Field(index=True)
    dest_port: Optional[int] = None
    proto: Optional[str] = None
    community_id: Optional[str] = None
    app_proto: Optional[str] = None

    pkts_toserver: int = 0
    pkts_toclient: int = 0
    bytes_toserver: int = 0
    bytes_toclient: int = 0
    flow_start: Optional[datetime] = None
    flow_end: Optional[datetime] = None
    age: Optional[int] = None
    state: Optional[str] = None
    reason: Optional[str] = None
    alerted: bool = False

    ingested_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class RawEvent(SQLModel, table=True):
    __tablename__ = "raw_events"

    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(index=True)
    event_type: str = Field(index=True)
    raw_json: str = ""

    ingested_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class UserRecord(SQLModel, table=True):
    __tablename__ = "users"

    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    is_admin: bool = True
    disabled: bool = False
    can_access_ai: bool = False
    can_manage_ips: bool = False
    created_by_user_id: Optional[int] = None
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    last_login_at: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None


class AuthSessionRecord(SQLModel, table=True):
    __tablename__ = "auth_sessions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="users.id")
    token_hash: str = Field(index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    expires_at: datetime = Field(index=True)
    last_seen_at: Optional[datetime] = None
    user_agent: Optional[str] = None
    client_ip: Optional[str] = None
