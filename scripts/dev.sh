#!/bin/bash
# Start both backend and frontend for development
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Vigilan IDS - Dev Mode ==="

# Start backend
echo "Starting backend on :8000..."
(
  cd "$ROOT_DIR/backend"
  source .venv/bin/activate 2>/dev/null || true
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on :3000..."
(
  cd "$ROOT_DIR/frontend"
  npm run dev
) &
FRONTEND_PID=$!

# Trap to kill both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

echo ""
echo "Backend:  http://localhost:8000 (API docs: http://localhost:8000/docs)"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."

wait
