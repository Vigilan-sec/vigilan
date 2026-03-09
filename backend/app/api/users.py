from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.api.auth import AuthUserResponse, serialize_user
from app.db.session import get_session
from app.models.database import UserRecord
from app.security.auth import hash_password, require_admin_user, utc_now

router = APIRouter(tags=["users"])


class CreateUserRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=10, max_length=256)
    full_name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=200)
    is_admin: bool = False
    can_access_ai: bool = False
    can_manage_ips: bool = False


class UpdateUserRequest(BaseModel):
    full_name: str | None = Field(default=None, max_length=120)
    email: str | None = Field(default=None, max_length=200)
    is_admin: bool | None = None
    disabled: bool | None = None
    can_access_ai: bool | None = None
    can_manage_ips: bool | None = None
    new_password: str | None = Field(default=None, min_length=10, max_length=256)


def _normalize_optional_string(value: str | None) -> str | None:
    if value is None:
        return None
    trimmed = value.strip()
    return trimmed or None


async def _count_enabled_admins(session: AsyncSession) -> int:
    count = await session.execute(
        select(func.count())
        .select_from(UserRecord)
        .where(UserRecord.is_admin.is_(True))
        .where(UserRecord.disabled.is_(False))
    )
    return count.scalar() or 0


@router.get("", response_model=list[AuthUserResponse])
async def list_users(
    session: AsyncSession = Depends(get_session),
    _: UserRecord = Depends(require_admin_user),
):
    result = await session.execute(select(UserRecord).order_by(UserRecord.created_at.asc()))
    return [serialize_user(user) for user in result.scalars().all()]


@router.post("", response_model=AuthUserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: CreateUserRequest,
    session: AsyncSession = Depends(get_session),
    admin_user: UserRecord = Depends(require_admin_user),
):
    username = payload.username.strip()
    existing = await session.execute(select(UserRecord).where(UserRecord.username == username))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that username already exists",
        )

    user = UserRecord(
        username=username,
        password_hash=hash_password(payload.password),
        full_name=_normalize_optional_string(payload.full_name),
        email=_normalize_optional_string(payload.email),
        is_admin=payload.is_admin,
        can_access_ai=payload.can_access_ai,
        can_manage_ips=payload.can_manage_ips,
        created_by_user_id=admin_user.id,
        created_at=utc_now(),
        password_changed_at=utc_now(),
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return serialize_user(user)


@router.patch("/{user_id}", response_model=AuthUserResponse)
async def update_user(
    user_id: int,
    payload: UpdateUserRequest,
    session: AsyncSession = Depends(get_session),
    admin_user: UserRecord = Depends(require_admin_user),
):
    user = (
        await session.execute(select(UserRecord).where(UserRecord.id == user_id))
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    updates = payload.model_dump(exclude_unset=True)
    if user.id == admin_user.id and updates.get("disabled") is True:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot disable your own admin account",
        )
    if user.id == admin_user.id and updates.get("is_admin") is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot remove your own admin rights",
        )

    if user.is_admin and (
        updates.get("disabled") is True or updates.get("is_admin") is False
    ):
        enabled_admins = await _count_enabled_admins(session)
        if enabled_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one enabled administrator must remain",
            )

    if "full_name" in updates:
        user.full_name = _normalize_optional_string(updates["full_name"])
    if "email" in updates:
        user.email = _normalize_optional_string(updates["email"])
    if "is_admin" in updates and updates["is_admin"] is not None:
        user.is_admin = updates["is_admin"]
    if "disabled" in updates and updates["disabled"] is not None:
        user.disabled = updates["disabled"]
    if "can_access_ai" in updates and updates["can_access_ai"] is not None:
        user.can_access_ai = updates["can_access_ai"]
    if "can_manage_ips" in updates and updates["can_manage_ips"] is not None:
        user.can_manage_ips = updates["can_manage_ips"]
    if updates.get("new_password"):
        user.password_hash = hash_password(updates["new_password"])
        user.password_changed_at = utc_now()

    session.add(user)
    await session.commit()
    await session.refresh(user)
    return serialize_user(user)
