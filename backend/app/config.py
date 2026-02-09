from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "Vigilan IDS"
    app_version: str = "0.1.0"
    debug: bool = False

    # EVE.json source
    eve_json_path: Path = Path(__file__).resolve().parent.parent.parent / "vm" / "shared" / "eve.json"
    eve_watcher_poll_interval: float = 0.5
    eve_watcher_enabled: bool = True
    eve_watcher_start_at_end: bool = False

    # Database
    database_url: str = "sqlite+aiosqlite:///./vigilan.db"
    raw_events_max_rows: int = 10000

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # VM
    vm_ip: str = "192.168.56.10"

    model_config = {"env_prefix": "VIGILAN_", "env_file": ".env"}


settings = Settings()
