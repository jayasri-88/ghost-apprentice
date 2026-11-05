import json
import sqlite3
import uuid
from datetime import datetime, timezone

from app.core.config import DB_PATH

SCHEMA = """
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    path TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS manuals (
    id TEXT PRIMARY KEY,
    video_id TEXT REFERENCES videos(id),
    title TEXT NOT NULL,
    equipment TEXT NOT NULL,
    overview TEXT NOT NULL,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_expert_review',
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS analyses (
    id TEXT PRIMARY KEY,
    video_id TEXT REFERENCES videos(id),
    manual_id TEXT REFERENCES manuals(id),
    stage TEXT NOT NULL,
    percent INTEGER NOT NULL DEFAULT 0,
    message TEXT NOT NULL DEFAULT '',
    error TEXT,
    created_at TEXT NOT NULL
);
"""


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with connect() as conn:
        conn.executescript(SCHEMA)


def new_id(prefix):
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def add_video(video_id, filename, path, size_bytes):
    with connect() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO videos VALUES (?, ?, ?, ?, ?)",
            (video_id, filename, str(path), size_bytes, now()),
        )


def get_video(video_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM videos WHERE id = ?", (video_id,)).fetchone()
    return dict(row) if row else None


def list_videos():
    with connect() as conn:
        rows = conn.execute("SELECT * FROM videos ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


def create_analysis(video_id):
    analysis_id = new_id("ana")
    with connect() as conn:
        conn.execute(
            "INSERT INTO analyses (id, video_id, stage, percent, message, created_at) VALUES (?, ?, 'queued', 0, 'Waiting for the analyser.', ?)",
            (analysis_id, video_id, now()),
        )
    return analysis_id


def update_analysis(analysis_id, stage, percent, message, error=None, manual_id=None):
    with connect() as conn:
        if manual_id is not None or error is not None:
            conn.execute(
                "UPDATE analyses SET stage=?, percent=?, message=?, error=?, manual_id=COALESCE(?, manual_id) WHERE id=?",
                (stage, percent, message, error, manual_id, analysis_id),
            )
        else:
            conn.execute(
                "UPDATE analyses SET stage=?, percent=?, message=? WHERE id=?",
                (stage, percent, message, analysis_id),
            )


def get_analysis(analysis_id):
    with connect() as conn:
        row = conn.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
    return dict(row) if row else None


def list_analyses(video_id=None):
    with connect() as conn:
        if video_id:
            rows = conn.execute(
                "SELECT * FROM analyses WHERE video_id = ? ORDER BY created_at DESC",
                (video_id,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM analyses ORDER BY created_at DESC").fetchall()
    return [dict(r) for r in rows]


def save_manual(manual, video_id):
    manual_id = new_id("mnl")
    manual["id"] = manual_id
    with connect() as conn:
        conn.execute(
            """INSERT INTO manuals
               (id, video_id, title, equipment, overview, duration_seconds, data, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                manual_id,
                video_id,
                manual["title"],
                manual["equipment"],
                manual["overview"],
                manual["durationSeconds"],
                json.dumps(manual),
                manual["status"],
                manual["createdAt"] or now(),
            ),
        )
    return manual_id


def list_manuals():
    with connect() as conn:
        rows = conn.execute("SELECT data FROM manuals ORDER BY created_at DESC").fetchall()
    return [json.loads(r["data"]) for r in rows]


def get_manual(manual_id):
    with connect() as conn:
        row = conn.execute("SELECT data FROM manuals WHERE id = ?", (manual_id,)).fetchone()
    return json.loads(row["data"]) if row else None
