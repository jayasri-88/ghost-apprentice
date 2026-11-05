from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.services import manual_store
from app.services.pipeline import run_analysis

router = APIRouter()


class AnalyzeRequest(BaseModel):
    video_id: str


@router.post("/analyze")
def start_analysis(request: AnalyzeRequest, background: BackgroundTasks):
    if not manual_store.get_video(request.video_id):
        raise HTTPException(status_code=404, detail="Upload the video before analysing it.")

    in_flight = manual_store.list_analyses(request.video_id)
    if any(a["stage"] not in ("done", "failed") for a in in_flight):
        raise HTTPException(status_code=409, detail="This video is already being analysed.")

    analysis_id = manual_store.create_analysis(request.video_id)
    background.add_task(run_analysis, analysis_id)
    return {"analysis_id": analysis_id, "status": "queued"}


@router.get("/analyze/{analysis_id}")
def analysis_status(analysis_id: str):
    record = manual_store.get_analysis(analysis_id)
    if not record:
        raise HTTPException(status_code=404, detail="Unknown analysis.")
    return {
        "analysis_id": record["id"],
        "video_id": record["video_id"],
        "manual_id": record["manual_id"],
        "stage": record["stage"],
        "percent": record["percent"],
        "message": record["message"],
        "error": record["error"],
    }


@router.get("")
def list_manuals():
    return {"manuals": manual_store.list_manuals()}


@router.get("/{manual_id}")
def get_manual(manual_id: str):
    manual = manual_store.get_manual(manual_id)
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found.")
    return manual
