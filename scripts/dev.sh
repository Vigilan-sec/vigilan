#!/usr/bin/env bash
# Start both backend and frontend for development
# Compatible with bash on Linux, macOS, and WSL

set -e

# Get absolute paths (works on both bash and zsh)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Vigilan IDS - Dev Mode ==="
echo ""

# Start backend
echo "Starting backend on :8000..."
(
  cd "$ROOT_DIR/backend" || exit 1
  if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
  fi
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!

# Start frontend
echo "Starting frontend on :3000..."
(
  cd "$ROOT_DIR/frontend" || exit 1
  npm run dev
) &
FRONTEND_PID=$!

# Function to cleanup processes
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  exit 0
}

# Trap signals to kill both on exit
trap cleanup INT TERM EXIT

echo ""
echo "Backend:  http://localhost:8000 (API docs: http://localhost:8000/docs)"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both."
echo ""

# Wait for both processes
wait