from sqlmodel import SQLModel

from app.db.session import engine
from app.db.session import async_session
from app.security.auth import bootstrap_default_admin

# Import models so they are registered with SQLModel metadata
import app.models.database  # noqa: F401


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    async with async_session() as session:
        await bootstrap_default_admin(session)
