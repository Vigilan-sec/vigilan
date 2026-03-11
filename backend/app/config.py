from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Vigilan IDS"
    app_version: str = "0.1.0"
    debug: bool = False

    # EVE.json source
    eve_json_path: Path = (
        Path(__file__).resolve().parent.parent.parent / "data" / "eve.json"
    )
    eve_watcher_poll_interval: float = 0.5
    eve_watcher_enabled: bool = True
    eve_watcher_start_at_end: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./vigilan.db"
    raw_events_max_rows: int = 10000
    secure_ui_origin: str = "https://localhost:3443"

    # LLM / RAG
    llm_provider_default: Literal["ollama", "nim"] = "ollama"
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "mistral:latest"
    embedding_model: str = "mxbai-embed-large"
    nim_base_url: str = "https://integrate.api.nvidia.com/v1"
    nim_model: str = "moonshotai/kimi-k2-instruct"
    nim_api_key: str | None = None
    nim_timeout_seconds: float = 60.0

    # Authentication
    auth_cookie_name: str = "vigilan_session"
    auth_cookie_secure: bool = True
    auth_cookie_samesite: Literal["strict", "lax", "none"] = "strict"
    auth_session_ttl_hours: int = 12
    auth_password_iterations: int = 600000
    auth_default_admin_username: str = "admin"
    auth_default_admin_password: str | None = None
    auth_default_admin_password_path: Path = Path("/data/db/default-admin-password.txt")

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "https://localhost:3443",
    ]

    model_config = {"env_prefix": "VIGILAN_", "env_file": ".env"}


settings = Settings()
