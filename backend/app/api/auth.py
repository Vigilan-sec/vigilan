from datetime import datetime

from fastapi import APIRouter, Depends, Request, Response
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.config import settings
from app.models.database import UserRecord
from app.security.auth import (
    authenticate_user,
    clear_session_cookie,
    create_session,
    require_authenticated_user,
    revoke_session,
    set_session_cookie,
)

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)


class AuthUserResponse(BaseModel):
    id: int
    username: str
    is_admin: bool
    created_at: datetime
    last_login_at: datetime | None = None


class LoginResponse(BaseModel):
    user: AuthUserResponse
    expires_at: datetime


def serialize_user(user: UserRecord) -> AuthUserResponse:
    return AuthUserResponse(
        id=user.id or 0,
        username=user.username,
        is_admin=user.is_admin,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    user = await authenticate_user(session, payload.username, payload.password)
    if user is None:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token, expires_at = await create_session(
        session,
        user,
        user_agent=request.headers.get("user-agent"),
        client_ip=request.client.host if request.client else None,
    )
    set_session_cookie(response, token, expires_at)
    return LoginResponse(user=serialize_user(user), expires_at=expires_at)


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
):
    token = request.cookies.get(settings.auth_cookie_name)
    if token:
        await revoke_session(session, token)
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/me", response_model=AuthUserResponse)
async def me(user: UserRecord = Depends(require_authenticated_user)):
    return serialize_user(user)
