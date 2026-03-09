import base64
import binascii
import hashlib
import hmac
import logging
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import delete, select

from app.config import settings
from app.db.session import get_session
from app.models.database import AuthSessionRecord, UserRecord

logger = logging.getLogger(__name__)

PASSWORD_SCHEME = "pbkdf2_sha256"


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        settings.auth_password_iterations,
    )
    salt_b64 = base64.urlsafe_b64encode(salt).decode("ascii")
    hash_b64 = base64.urlsafe_b64encode(derived).decode("ascii")
    return (
        f"{PASSWORD_SCHEME}$"
        f"{settings.auth_password_iterations}$"
        f"{salt_b64}$"
        f"{hash_b64}"
    )


def verify_password(password: str, encoded: str) -> bool:
    try:
        scheme, iterations_text, salt_b64, hash_b64 = encoded.split("$", 3)
        if scheme != PASSWORD_SCHEME:
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode("ascii"))
        expected = base64.urlsafe_b64decode(hash_b64.encode("ascii"))
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            int(iterations_text),
        )
    except (TypeError, ValueError, binascii.Error):  # type: ignore[name-defined]
        return False
    return hmac.compare_digest(derived, expected)


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _read_bootstrap_password(path: Path) -> Optional[str]:
    if not path.exists():
        return None
    password = path.read_text(encoding="utf-8").strip()
    return password or None


def _write_bootstrap_password(path: Path, password: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(password, encoding="utf-8")


async def cleanup_expired_sessions(session: AsyncSession) -> None:
    await session.execute(
        delete(AuthSessionRecord).where(AuthSessionRecord.expires_at <= utc_now())
    )


async def bootstrap_default_admin(session: AsyncSession) -> Optional[str]:
    statement = select(UserRecord).where(
        UserRecord.username == settings.auth_default_admin_username
    )
    existing = (await session.execute(statement)).scalar_one_or_none()
    if existing is not None:
        return None

    password_path = settings.auth_default_admin_password_path
    password = settings.auth_default_admin_password or _read_bootstrap_password(
        password_path
    )
    if not password:
        password = secrets.token_urlsafe(18)
        _write_bootstrap_password(password_path, password)
        logger.warning(
            "Created local admin password file at %s",
            password_path,
        )

    user = UserRecord(
        username=settings.auth_default_admin_username,
        password_hash=hash_password(password),
        is_admin=True,
        created_at=utc_now(),
        password_changed_at=utc_now(),
    )
    session.add(user)
    await session.commit()
    logger.warning(
        "Bootstrapped default admin user '%s'",
        settings.auth_default_admin_username,
    )
    return password


async def create_session(
    session: AsyncSession,
    user: UserRecord,
    user_agent: Optional[str],
    client_ip: Optional[str],
) -> tuple[str, datetime]:
    await cleanup_expired_sessions(session)

    raw_token = secrets.token_urlsafe(32)
    expires_at = utc_now() + timedelta(hours=settings.auth_session_ttl_hours)
    auth_session = AuthSessionRecord(
        user_id=user.id,
        token_hash=hash_session_token(raw_token),
        created_at=utc_now(),
        expires_at=expires_at,
        last_seen_at=utc_now(),
        user_agent=user_agent,
        client_ip=client_ip,
    )
    user.last_login_at = utc_now()
    session.add(auth_session)
    session.add(user)
    await session.commit()
    return raw_token, expires_at


async def revoke_session(session: AsyncSession, raw_token: str) -> None:
    await session.execute(
        delete(AuthSessionRecord).where(
            AuthSessionRecord.token_hash == hash_session_token(raw_token)
        )
    )
    await session.commit()


async def get_user_for_token(
    session: AsyncSession, raw_token: Optional[str]
) -> Optional[UserRecord]:
    if not raw_token:
        return None

    await cleanup_expired_sessions(session)
    statement = (
        select(AuthSessionRecord, UserRecord)
        .join(UserRecord, UserRecord.id == AuthSessionRecord.user_id)
        .where(AuthSessionRecord.token_hash == hash_session_token(raw_token))
        .where(AuthSessionRecord.expires_at > utc_now())
        .where(UserRecord.disabled.is_(False))
    )
    result = await session.execute(statement)
    row = result.first()
    if row is None:
        await session.commit()
        return None

    auth_session, user = row
    auth_session.last_seen_at = utc_now()
    session.add(auth_session)
    await session.commit()
    return user


async def authenticate_user(
    session: AsyncSession,
    username: str,
    password: str,
) -> Optional[UserRecord]:
    statement = select(UserRecord).where(UserRecord.username == username)
    user = (await session.execute(statement)).scalar_one_or_none()
    if user is None or user.disabled:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def set_session_cookie(response: Response, token: str, expires_at: datetime) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite=settings.auth_cookie_samesite,
        max_age=int((expires_at - utc_now()).total_seconds()),
        expires=expires_at,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
        secure=settings.auth_cookie_secure,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
    )


async def require_authenticated_user(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> UserRecord:
    token = request.cookies.get(settings.auth_cookie_name)
    user = await get_user_for_token(session, token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )
    request.state.user = user
    return user
