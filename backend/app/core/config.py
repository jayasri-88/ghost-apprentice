import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_API_ROOT = os.getenv("OLLAMA_API_ROOT", "http://localhost:11434")
MODEL_NAME = os.getenv("MODEL_NAME", "qwen3-vl:2b")

BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", BASE_DIR / "uploads"))
DB_PATH = Path(os.getenv("DB_PATH", BASE_DIR / "ghost_apprentice.db"))

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", 100 * 1024 * 1024))
CHUNK_SIZE = 1024 * 1024
FRAME_BATCH_SIZE = int(os.getenv("FRAME_BATCH_SIZE", 2))
MAX_FRAMES_PER_VIDEO = int(os.getenv("MAX_FRAMES_PER_VIDEO", 10))
