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

| Method | Path                        | Purpose                                   |
| ------ | --------------------------- | ----------------------------------------- |
| POST   | /api/videos/upload          | Store a recording (mp4/webm/mov/avi, 100 MB max) |
| POST   | /api/manuals/analyze        | Queue video-to-manual analysis `{video_id}` |
| GET    | /api/manuals/analyze/{id}   | Poll analysis progress `{stage, percent, message, error}` |
| GET    | /api/manuals                | List generated manuals                    |
| GET    | /api/manuals/{id}           | One manual                                |
| GET    | /api/videos/{id}/file       | Stream the original recording for playback |
| POST   | /api/assistant/chat         | Ask the assistant; body: `{question, manual_context}` |
| GET    | /health                     | Liveness check                            |

## Video-to-manual pipeline

Upload → "Generate knowledge manual" runs fully locally:

1. OpenCV samples up to `MAX_FRAMES_PER_VIDEO` representative frames (near
   duplicates dropped); mov files fall back to the bundled ffmpeg transcoder.
2. Narration is transcribed locally with Faster-Whisper (`base`, int8, CPU)
   when the video has an audio track.
3. Frames go to qwen3-vl:2b through Ollama in small batches sized for 4 GB
   VRAM; each batch reports only what is visible.
4. The manual is assembled deterministically from those observations —
   steps, tools, components and safety warnings are unions of what the model
   actually saw. The model only words the title/summary/equipment. Anything
   not evidenced is listed under missing information, never invented.
5. Saved to SQLite (`ghost_apprentice.db`) as `pending_expert_review`; the
   Knowledge Manuals page lists and opens them.

Expect several minutes per recording on a laptop GPU (tune via
`FRAME_BATCH_SIZE` / `MAX_FRAMES_PER_VIDEO` in `backend/.env`). Analysis
runs in a background task; progress shows in the Upload page.

The assistant answers only from the manual context it is given. If the
information is not in the manual, it is instructed to say so.

## Current state

- The Assistant page still grounds on the bundled sample manuals; wiring it
  to generate `manual_context` from stored (generated) manuals is the next
  step — the API already returns the same shape.
- Uploaded videos and generated manuals persist in `backend/uploads/` and
  `ghost_apprentice.db` (both gitignored).
- Voice input and an expert sign-off UI are not built yet.
