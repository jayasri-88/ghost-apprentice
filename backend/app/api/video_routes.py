import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.config import CHUNK_SIZE, MAX_UPLOAD_BYTES, UPLOAD_DIR
from app.services import manual_store

router = APIRouter()

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
}

ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}


@router.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported video format")

    extension = Path(file.filename or "").suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid video extension")

    video_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{video_id}{extension}"

    total_size = 0
    try:
        with open(file_path, "wb") as buffer:
            while chunk := await file.read(CHUNK_SIZE):
                total_size += len(chunk)
                if total_size > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413, detail="Video exceeds 100 MB limit"
                    )
                buffer.write(chunk)
    except Exception:
        file_path.unlink(missing_ok=True)
        raise
    finally:
        await file.close()

    manual_store.add_video(video_id, file.filename, file_path, total_size)

    return {
        "message": "Video uploaded successfully",
        "video_id": video_id,
        "filename": file.filename,
        "size_bytes": total_size,
        "status": "uploaded",
    }


@router.get("/{video_id}/file")
def get_video_file(video_id: str):
    if not video_id.replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="Invalid video id")

    matches = list(UPLOAD_DIR.glob(f"{video_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="Video not found")

    return FileResponse(matches[0], content_disposition_type="inline")
