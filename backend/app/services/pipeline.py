import logging
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import av
import cv2
import numpy as np

from app.core.config import FRAME_BATCH_SIZE, MAX_FRAMES_PER_VIDEO
from app.services import manual_store
from app.services.video_analysis import (
    extract_audio_wav,
    extract_frames,
    probe,
    transcode_to_mp4,
)
from app.vision import chat_client

log = logging.getLogger("analysis")


def _stage(analysis_id, stage, percent, message):
    manual_store.update_analysis(analysis_id, stage, percent, message)


def _has_audio(video_path):
    try:
        container = av.open(str(video_path))
    except Exception:
        return False
    try:
        return any(s.type == "audio" for s in container.streams)
    finally:
        container.close()


def _readable_path(video_path, analysis_id, work_dir):
    """opencv-python-headless decodes mp4/webm here but not mov. If OpenCV
    can't open the file, transcode once into the work dir (auto-cleaned)
    with the bundled ffmpeg binary."""
    try:
        return Path(video_path), probe(video_path)
    except RuntimeError:
        _stage(analysis_id, "frames", 6, "Converting the video for analysis...")
        converted = transcode_to_mp4(video_path, keep_audio=True, out_dir=work_dir)
        if converted is None:
            raise RuntimeError(
                "This video could not be decoded. Re-export it as MP4 or install FFmpeg."
            )
        return converted, probe(converted)


def _dedupe(samples, threshold=9.0):
    """Drop near-identical consecutive frames so a static camera doesn't
    burn model calls on the same shot. Greyscale diff on 64x64 thumbs."""
    kept = []
    last_gray = None
    for sample in samples:
        grey = sample.pop("grey")
        if last_gray is not None and float(np.mean(cv2.absdiff(grey, last_gray))) < threshold:
            continue
        last_gray = grey
        kept.append(sample)
    return kept


def run_analysis(analysis_id):
    record = manual_store.get_analysis(analysis_id)
    if not record:
        return
    video = manual_store.get_video(record["video_id"])
    if not video:
        manual_store.update_analysis(analysis_id, "failed", 0, "Analysis failed",
                                     error="The uploaded video no longer exists on disk.")
        return

    work_dir = Path(tempfile.mkdtemp(prefix="ga_work_"))
    try:
        _analyse(analysis_id, record["video_id"], Path(video["path"]), video["filename"], work_dir)
    except Exception as error:
        log.exception("analysis %s failed", analysis_id)
        message = str(error)
        if "10061" in message or "Connection refused" in message or "ConnectError" in type(error).__name__:
            message = "Cannot reach Ollama at localhost:11434. Start it (e.g. `ollama serve`) and re-run the analysis."
        manual_store.update_analysis(analysis_id, "failed", 0, "Analysis failed",
                                     error=message)
    finally:
        shutil.rmtree(work_dir, ignore_errors=True)


def _analyse(analysis_id, video_id, video_path, filename, work_dir):
    _stage(analysis_id, "frames", 8, "Reading frames from the recording...")
    read_path, info = _readable_path(video_path, analysis_id, work_dir)
    duration = info["duration_seconds"]

    raw_frames, _ = extract_frames(read_path, MAX_FRAMES_PER_VIDEO, keep_raw=True)
    if not raw_frames:
        raise RuntimeError("No readable frames found in the video.")
    frames = _dedupe(raw_frames)
    if not frames:
        raise RuntimeError("Every frame in the recording was unreadable.")

    transcript = []
    if _has_audio(read_path):
        _stage(analysis_id, "transcribe", 25, "Transcribing narration (local model)...")
        wav_path = extract_audio_wav(read_path, work_dir / "audio.wav")
        if wav_path:
            from app.services.transcribe import transcribe_wav

            try:
                transcript = transcribe_wav(
                    wav_path,
                    progress=lambda p: _stage(
                        analysis_id, "transcribe", 25 + int(p * 0.2),
                        f"Transcribing narration ({p}%)."
                    ),
                )
            except Exception as error:
                log.warning("transcription skipped: %s", error)
                transcript = []
    if not transcript:
        _stage(analysis_id, "transcribe", 45, "No narration found - visual analysis only.")

    batches = [frames[i:i + FRAME_BATCH_SIZE] for i in range(0, len(frames), FRAME_BATCH_SIZE)]
    _stage(analysis_id, "describe", 50,
           f"Reviewing {len(frames)} frames in {len(batches)} small batches...")

    def on_batch(done):
        _stage(analysis_id, "describe", 50 + int(38 * done / len(batches)),
               f"Reviewing frames - batch {done} of {len(batches)}.")

    observations = chat_client.describe_batches(batches, on_batch)

    _stage(analysis_id, "assemble", 92, "Assembling the manual...")
    manual = chat_client.consolidate(
        filename=filename,
        duration_seconds=duration,
        observations=observations,
        transcript=transcript,
    )

    manual["createdAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    manual["videoUrl"] = f"/api/videos/{video_id}/file"
    manual_id = manual_store.save_manual(manual, video_id=video_id)
    manual_store.update_analysis(analysis_id, "done", 100,
                                 "Manual generated and saved for expert review.",
                                 manual_id=manual_id)
