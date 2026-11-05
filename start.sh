#!/usr/bin/env bash
# Starts the Ghost Apprentice backend and frontend.
# Safe to click twice: services already running are reused, not duplicated.
set -e
cd "$(dirname "$0")"

if [ ! -f backend/venv/Scripts/uvicorn.exe ]; then
  echo "Setting up the backend environment (first run only)..."
  python -m venv backend/venv
  backend/venv/Scripts/python -m pip install -r backend/requirements.txt
fi

if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend packages (first run only)..."
  (cd frontend && npm install)
fi

if ! curl -s -o /dev/null --max-time 2 http://localhost:11434/api/tags; then
  echo "Note: Ollama isn't answering on :11434 - assistant requests will fail"
  echo "      until it is running. Everything else still works."
fi

api_up() { curl -s -o /dev/null --max-time 2 http://localhost:8000/health; }
web_up() { curl -s -o /dev/null --max-time 2 http://localhost:5173/; }

started_any=0

if ! api_up; then
  backend/venv/Scripts/uvicorn.exe --app-dir backend app.main:app --reload --port 8000 &
  backend_pid=$!
  started_any=1
fi

if ! web_up; then
  (cd frontend && npm run dev -- --port 5173) &
  frontend_pid=$!
  started_any=1
fi

if [ "$started_any" = 1 ]; then
  trap 'kill ${backend_pid:-} ${frontend_pid:-} >/dev/null 2>&1 || true' EXIT
  echo
  echo "  Frontend  http://localhost:5173"
  echo "  API docs  http://localhost:8000/docs"
  echo "  Ctrl+C or closing this window stops the servers it started."
  echo
fi

cmd //c start http://localhost:5173

if [ "$started_any" = 1 ]; then
  # returns as soon as either server exits; the trap then stops the other
  wait -n || true
fi
