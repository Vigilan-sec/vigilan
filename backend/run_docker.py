#!/usr/bin/env python3
"""Production entry point for Vigilan IDS backend in Docker."""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        workers=1,
        log_level="info",
        access_log=True,
    )
