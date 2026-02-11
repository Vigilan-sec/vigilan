from __future__ import annotations

from datetime import datetime
from typing import Iterable
from zoneinfo import ZoneInfo


PARIS_TZ = ZoneInfo("Europe/Paris")


def ensure_paris_tz(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=PARIS_TZ)
    return value


def ensure_paris_fields(obj: object, fields: Iterable[str]) -> None:
    for field in fields:
        value = getattr(obj, field, None)
        if isinstance(value, datetime):
            setattr(obj, field, ensure_paris_tz(value))
