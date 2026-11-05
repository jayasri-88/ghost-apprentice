import base64
import logging
import subprocess
import tempfile
import uuid
from pathlib import Path

import cv2
import imageio_ffmpeg

log = logging.getLogger("video")


def transcode_to_mp4(video_path, keep_audio=False, out_dir=None):
    """Fallback decoder for containers OpenCV's headless build can't open
    (e.g. mov). Uses the ffmpeg binary shipped with imageio-ffmpeg, so no
    system install is needed. Pass out_dir to keep the converted file with
    the caller's other temp files; otherwise it lands in the system temp
    dir and the caller must delete it."""
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    folder = Path(out_dir) if out_dir else Path(tempfile.gettempdir())
    out = folder / f"ga_{uuid.uuid4().hex[:8]}.mp4"
    cmd = [
        ffmpeg, "-y", "-loglevel", "error",
        "-i", str(video_path),
        "-vf", "scale='min(1280,iw)':'min(720,ih)':force_original_aspect_ratio=decrease",
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "28",
        "-pix_fmt", "yuv420p",
    ]
    cmd += ["-c:a", "aac", "-b:a", "64k"] if keep_audio else ["-an"]
    cmd.append(str(out))

    try:
        result = subprocess.run(cmd, capture_output=True, timeout=600)
    except (subprocess.TimeoutExpired, OSError) as error:
        log.warning("transcode failed: %s", error)
        out.unlink(missing_ok=True)
        return None
    if result.returncode != 0 or not out.exists() or out.stat().st_size == 0:
        log.warning("ffmpeg rejected the file: %s",
                    result.stderr.decode(errors="replace")[-300:])
        out.unlink(missing_ok=True)
        return None
    return out


def probe(video_path):
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("Could not open the video file.")
    try:
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        return {"fps": fps, "frame_count": frames, "duration_seconds": int(frames / fps)}
    finally:
        cap.release()


def extract_frames(video_path, max_frames, keep_raw=False):
    """Read only the frames we keep. The capture advances by position, so
    memory use stays flat no matter how long the recording is."""
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("Could not open the video file.")

    try:
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        if total <= 0:
            raise RuntimeError("The video reports no frames.")

        keep = min(max_frames, total)
        if keep <= 1:
            positions = [0]
        else:
            stride = (total - 1) / (keep - 1)
            positions = [round(i * stride) for i in range(keep)]

        samples = []
        next_at = 0
        index = 0
        last_seconds = -1
        while next_at < len(positions):
            target = positions[next_at]
            if index < target:
                # Skip ahead instead of decoding every frame in between.
                # grab() only advances the read cursor, so trust the target
                # position and let the next read confirm where we landed.
                cap.grab()
                index += 1
                continue
            ok, frame = cap.read()
            if not ok:
                break
            small = cv2.resize(frame, (640, 360), interpolation=cv2.INTER_AREA)
            ok, buffer = cv2.imencode(".jpg", small, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
            if not ok:
                break
            seconds = int(index / fps)
            if seconds == last_seconds and next_at < len(positions) - 1:
                next_at += 1
                continue
            last_seconds = seconds
            sample = {"frame_index": index, "seconds": seconds}
            if keep_raw:
                # Small 64x64 grey copy for dedupe plus the JPEG for the model.
                grey = cv2.resize(
                    cv2.cvtColor(small, cv2.COLOR_BGR2GRAY), (64, 64)
                )
                sample["grey"] = grey
            sample["image_b64"] = base64.b64encode(buffer.tobytes()).decode()
            samples.append(sample)
            next_at += 1
            index += 1

        return samples, {"fps": fps, "frame_count": total, "duration_seconds": int(total / fps)}
    finally:
        cap.release()


def extract_audio_wav(video_path, target_path, on_progress=None):
    """Decode the audio track with PyAV. Fails soft: a silent or audio-less
    recording is still analysable visually."""
    import av

    try:
        container = av.open(str(video_path))
    except Exception as exc:
        raise RuntimeError(f"Could not open the video for audio: {exc}")

    try:
        audio_streams = [s for s in container.streams if s.type == "audio"]
        if not audio_streams:
            return None

        stream = audio_streams[0]
        resampler = av.AudioResampler(format="s16", layout="mono", rate=16000)
        total_frames = stream.frames or 0
        written = 0

        sink = av.open(str(target_path), "w", format="wav")
        out = sink.add_stream("pcm_s16le", rate=16000)
        out.layout = "mono"
        out.bit_rate = 256000

        for packet in container.demux(stream):
            for frame in packet.decode():
                for resampled in resampler.resample(frame):
                    resampled.pts = written
                    written += resampled.samples
                    for opacket in out.encode(resampled):
                        sink.mux(opacket)
                if on_progress and total_frames:
                    on_progress(min(100, int(written / total_frames * 100)))

        for opacket in out.encode(None):
            sink.mux(opacket)
        sink.close()
        return str(target_path) if written else None
    finally:
        container.close()
