from sqlmodel import SQLModel

from app.db.session import engine

# Import models so they are registered with SQLModel metadata
import app.models.database  # noqa: F401


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
