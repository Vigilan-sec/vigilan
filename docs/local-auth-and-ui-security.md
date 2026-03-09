# Local authentication and secure UI access

This document explains the local-only authentication flow added to Vigilan and how to access the UI over HTTPS.

## What was added

- **SQLite-backed local auth** in the backend (`users` and `auth_sessions` tables)
- **HttpOnly secure session cookie** for browser authentication
- **Default admin bootstrap** on first startup
- **Local HTTPS reverse proxy** with Caddy at `https://localhost:3443`
- **Protected UI routes** with a dedicated `/login` page
- **Authenticated WebSocket** access for live alerts

## Recommended local entrypoint

Use the secure local gateway:

```bash
https://localhost:3443
```

The existing direct dev ports (`http://localhost:3000` and `http://localhost:8000`) are still useful for development, but authenticated UI sessions are designed for the HTTPS gateway.

## Certificate note

The Caddy reverse proxy uses a local internal certificate. Your browser may ask you to trust or accept the certificate the first time you open the secure UI.

## Default admin bootstrap

On the first backend startup with an empty auth database:

- the backend creates a local `admin` user
- a strong password is generated automatically if you did not provide one
- that password is written to:

```text
/data/db/default-admin-password.txt
```

Inside the running backend container, that path is backed by the persistent Docker volume used for the SQLite database.

To read it from the host:

```bash
docker exec backend sh -lc 'cat /data/db/default-admin-password.txt'
```

## Session security model

- cookie name: `vigilan_session`
- `HttpOnly`
- `Secure`
- `SameSite=Strict`
- session data stored server-side in SQLite
- raw session token never stored in the database; only its SHA-256 hash is persisted

## API behavior

Public endpoints:

- `GET /api/health`
- `POST /api/auth/login`

Protected endpoints now include:

- alerts / flows / events / charts
- RAG explanation endpoint
- security overview endpoint
- `GET /api/status`
- live alert websocket `/api/ws/alerts`

## UI changes

- new `/login` page
- authenticated app shell
- logout control in the header
- admin user management page at `/admin/users`
- network inventory page at `/network`
- sidebar network panel for quick device monitoring
- secure scenario dashboard at `/security`
- status page now shows auth and transport details

## Override options

If you want to control bootstrap behavior explicitly, set these backend env vars:

- `VIGILAN_AUTH_DEFAULT_ADMIN_USERNAME`
- `VIGILAN_AUTH_DEFAULT_ADMIN_PASSWORD`
- `VIGILAN_AUTH_DEFAULT_ADMIN_PASSWORD_PATH`
- `VIGILAN_SECURE_UI_ORIGIN`

## Operational note

If the admin already exists, Vigilan does **not** overwrite it on restart. The bootstrap password is only relevant when the admin user is first created.
