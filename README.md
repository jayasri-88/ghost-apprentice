# Ghost Apprentice

A technician knowledge preservation tool. Expert technicians record repair
demonstrations; the app turns them into step-by-step knowledge manuals that
apprentices can browse and question through an assistant.

Everything runs locally — the AI answers come from a local Ollama model,
not any external API.

## Stack

- **frontend/** — React 19, Vite, Tailwind CSS, Axios
- **backend/** — Python 3.12, FastAPI, httpx
- **AI** — Ollama serving `qwen3-vl:2b` (configurable via `backend/.env`)

## Layout

```
backend/
  app/
    api/            routes (videos, assistant chat)
    core/           env-backed config
    schemas/        request models
    services/       Ollama client
frontend/
  src/
    components/     shared UI (cards, panels, modals)
    data/           sample manuals and seeded chats (until the DB lands)
    pages/          Dashboard, Upload, Manuals, Assistant
    services/       axios instance + API calls
    utils/          formatting, evidence matching
```

## Setup

Prerequisites: Node.js, Python 3.12, and [Ollama](https://ollama.com).

1. Pull the model:

   ```
   ollama pull qwen3-vl:2b
   ```

2. Backend:

   ```
   cd backend
   python -m venv venv
   venv/Scripts/pip install -r requirements.txt
   copy .env.example .env      # then adjust if needed
   venv/Scripts/python -m uvicorn app.main:app --reload --port 8000
   ```

3. Frontend:

   ```
   cd frontend
   npm install
   npm run dev
   ```

Open http://localhost:5173. The backend must be running for uploads and the
assistant to work; the rest of the UI runs on the bundled sample data.

## API

| Method | Path                  | Purpose                                   |
| ------ | --------------------- | ----------------------------------------- |
| POST   | /api/videos/upload    | Store a recording (mp4/webm/mov/avi, 100 MB max) |
| POST   | /api/assistant/chat   | Ask the assistant; body: `{question, manual_context}` |
| GET    | /health               | Liveness check                            |

The assistant answers only from the manual context it is given. If the
information is not in the manual, it is instructed to say so.

## Current state

- Manual data lives in `frontend/src/data/manuals.js` as realistic samples.
  The pages read from that one module by design — swapping it for API calls
  is the intended next step once the database exists.
- Uploaded videos are stored on disk under `backend/uploads/` (not tracked
  by git).
- Voice input and the `/manuals` API are not built yet.
