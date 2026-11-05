import logging

from app.core.config import WHISPER_COMPUTE_TYPE, WHISPER_MODEL

log = logging.getLogger("transcribe")

_model = None
_model_failed = False


def _get_model():
    global _model, _model_failed
    if _model is not None or _model_failed:
        return _model
    try:
        from faster_whisper import WhisperModel

        # Runs on CPU: ctranslate2's CUDA path needs cuBLAS which isn't
        # installed here, and "base" int8 is fast enough on CPU. The GPU is
        # left free for the vision model.
        _model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type=WHISPER_COMPUTE_TYPE)
    except Exception as error:
        log.warning("whisper model unavailable (%s) - skipping narration", error)
        _model_failed = True
        _model = None
    return _model


def transcribe_wav(wav_path, progress=None):
    model = _get_model()
    if model is None:
        return []

    segments, info = model.transcribe(
        str(wav_path), beam_size=1, vad_filter=True, language=None
    )
    total = max(info.duration or 0, 0.001)
    out = []
    for seg in segments:
        text = seg.text.strip()
        if text:
            out.append({"start": round(seg.start), "text": text})
        if progress:
            progress(min(100, int(seg.end / total * 100)))
    return out
