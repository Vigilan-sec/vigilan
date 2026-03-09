from sqlmodel import SQLModel

from app.db.session import engine
from app.db.session import async_session
from app.security.auth import bootstrap_default_admin

# Import models so they are registered with SQLModel metadata
import app.models.database  # noqa: F401


USER_TABLE_MIGRATIONS = {
    "full_name": "TEXT",
    "email": "TEXT",
    "can_access_ai": "BOOLEAN NOT NULL DEFAULT 0",
    "can_manage_ips": "BOOLEAN NOT NULL DEFAULT 0",
    "created_by_user_id": "INTEGER",
}


async def _ensure_user_columns(conn) -> None:
    result = await conn.exec_driver_sql("PRAGMA table_info(users)")
    existing_columns = {row[1] for row in result.fetchall()}
    for column_name, column_sql in USER_TABLE_MIGRATIONS.items():
        if column_name in existing_columns:
            continue
        await conn.exec_driver_sql(
            f"ALTER TABLE users ADD COLUMN {column_name} {column_sql}"
        )


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        await _ensure_user_columns(conn)
    async with async_session() as session:
        await bootstrap_default_admin(session)
