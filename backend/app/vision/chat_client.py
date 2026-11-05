import base64
import json
import logging
import re

import cv2
import httpx
import numpy as np

from app.core.config import MODEL_NAME, OLLAMA_API_ROOT

log = logging.getLogger("vision")

CHAT_URL = f"{OLLAMA_API_ROOT}/api/chat"

# Measured on this machine (RTX 2050 4GB, qwen3-vl:2b): two 512px frames plus
# a small prompt consume ~2.1k tokens and produce nothing at Ollama's default
# context; num_ctx 8192 leaves room for the answer (same images, 800 tokens
# generated, ~100s). 512px keeps each JPEG around 12KB.
IMAGE_WIDTH = 512
BATCH_TIMEOUT = 300.0
CONSOLIDATE_TIMEOUT = 600.0
CHAT_OPTIONS = {"temperature": 0.2, "num_ctx": 8192}

BATCH_PROMPT = """You are looking at {n} frames, in time order, from a repair \
video recorded by a technician. Frame timestamps (seconds): {times}.

Describe ONLY what is visibly happening in these exact frames. Rules:
- Do not guess at repairs, tools, voltages, torque values or parts that are \
not clearly visible.
- If a frame is unclear, say so instead of inventing detail.
- Note any safety behaviour you can see (gloves, locks out, braces, spacing).

Reply with JSON shaped exactly like this:
{{"observations": [{{"time": <seconds>, "what_is_happening": "<short>", \
"visible_tools": [], "visible_components": [], "safety_visible": [], \
"confidence": "high"}}]}}"""

def _extract_json(text):
    """Small models wrap JSON in prose or code fences. Pull the outermost
    JSON object, or fail loudly rather than pass garbage downstream."""
    fence = re.search(r"```(?:json)?\s*(.*?)```", text, re.S)
    candidate = fence.group(1) if fence else text
    start = candidate.find("{")
    if start == -1:
        raise ValueError("model returned no JSON object")
    depth = 0
    for i, ch in enumerate(candidate[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return json.loads(candidate[start : i + 1])
    raise ValueError("unterminated JSON from model")


def _chat(messages, timeout):
    payload = {
        "model": MODEL_NAME,
        "messages": messages,
        "stream": False,
        "options": dict(CHAT_OPTIONS),
        # qwen3-vl spends its whole context on hidden "thinking" tokens by
        # default and then stops at length with an empty answer. On a 4GB card
        # that budget is not affordable; disabled, it returns the JSON we ask
        # for and stops cleanly (measured: 112s, reason=stop, non-empty).
        "think": False,
    }
    response = httpx.post(CHAT_URL, json=payload, timeout=timeout)
    response.raise_for_status()
    body = response.json()
    content = (body.get("message") or {}).get("content", "")
    if not content.strip():
        raise RuntimeError(
            f"Model returned an empty answer (stopped: {body.get('done_reason', 'unknown')})"
        )
    return content


def shrink_frame(image_b64, max_width=IMAGE_WIDTH):
    img = cv2.imdecode(
        np.frombuffer(base64.b64decode(image_b64), np.uint8), cv2.IMREAD_COLOR
    )
    if img is None:
        return image_b64
    h, w = img.shape[:2]
    scale = min(1.0, max_width / w)
    if scale < 1.0:
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
    ok, buf = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 70])
    if not ok:
        return image_b64
    return base64.b64encode(buf.tobytes()).decode()


def describe_batch(batch):
    prompt = BATCH_PROMPT.format(
        n=len(batch), times=", ".join(str(f["seconds"]) for f in batch)
    )
    content = _chat(
        [
            {
                "role": "user",
                "content": prompt,
                "images": [shrink_frame(f["image_b64"]) for f in batch],
            }
        ],
        BATCH_TIMEOUT,
    )
    data = _extract_json(content)
    raw = data.get("observations", []) if isinstance(data, dict) else []
    out = []
    for i, item in enumerate(raw if isinstance(raw, list) else []):
        if isinstance(item, dict):
            out.append(item)
        elif isinstance(item, str):
            seconds = batch[min(i, len(batch) - 1)]["seconds"]
            out.append({"time": seconds, "what_is_happening": item})
    return out


def describe_batches(batches, on_batch):
    observations = []
    for done, batch in enumerate(batches, start=1):
        try:
            observations.extend(describe_batch(batch))
        except Exception as error:
            log.warning("batch %d failed: %s", done, error)
            for f in batch:
                observations.append(
                    {
                        "time": f["seconds"],
                        "what_is_happening": "frame could not be analysed",
                        "confidence": "low",
                    }
                )
        on_batch(done)
    return observations


META_PROMPT = """A technician video was analysed frame by frame. Write a short \
title, a 2 sentence summary and the equipment name for it. Use only the \
material given; if the equipment is unclear answer "Unknown equipment".

OBSERVATIONS:
{summary_lines}

NARRATION SNIPPETS: {transcript_lines}

Reply with JSON only: {{"title": "...", "summary": "...", "equipment": "..."}}"""


def consolidate(filename, duration_seconds, observations, transcript):
    """Assemble the manual deterministically: steps, tools, components and
    safety warnings are the union of what the batches actually observed, so
    nothing can be invented at this stage. The local model only phrases the
    title/summary/equipment from those same facts, and if even that call
    fails we fall back to mechanical defaults rather than losing the run."""
    steps = []
    tools, components, safety = [], [], []

    def add(bucket, items):
        for v in items or []:
            v = str(v).strip()
            if v and v.lower() not in {x.lower() for x in bucket}:
                bucket.append(v)

    for o in observations:
        if not isinstance(o, dict):
            continue
        happening = str(o.get("what_is_happening") or "").strip()
        if not happening:
            continue
        seconds = int(o.get("time") or 0)
        title = happening[:60].rstrip(" .,;:")
        steps.append({"time_seconds": seconds, "title": title, "detail": happening})
        add(tools, o.get("visible_tools"))
        add(components, o.get("visible_components"))
        add(safety, o.get("safety_visible"))

    steps.sort(key=lambda s: s["time_seconds"])

    meta = None
    lines = "; ".join(f"[{s['time_seconds']}s] {s['detail']}" for s in steps)[:700]
    snippet = " / ".join(t["text"] for t in (transcript or [])[:3])[:200] or "none"
    try:
        meta = _extract_json(_chat(
            [{"role": "user", "content": META_PROMPT.format(summary_lines=lines, transcript_lines=snippet)}],
            CONSOLIDATE_TIMEOUT,
        ))
    except Exception as error:
        log.warning("meta phrasing call failed (%s); using mechanical fallback", error)

    if not isinstance(meta, dict):
        meta = {}

    data = {
        "title": meta.get("title") or f"Recording analysis: {filename}",
        "summary": meta.get("summary") or ("; ".join(s["detail"] for s in steps[:3]) or
                                           "Frame-level observations were recorded but not summarised."),
        "equipment": meta.get("equipment") or "Unknown equipment",
        "steps": steps,
        "tools": tools,
        "components": components,
        "safety_warnings": safety,
        "missing_information": [],
    }
    return normalize_manual(data, filename, duration_seconds)


def _stamp(seconds):
    s = max(0, int(seconds))
    return f"{s // 60}:{s % 60:02d}"


def normalize_manual(data, filename, duration_seconds):
    """Force the model output into the manual shape and mark anything the
    pipeline could not confirm as missing rather than silently accepting it."""
    if not isinstance(data, dict):
        raise ValueError("consolidation did not return an object")

    def strings(key):
        value = data.get(key) or []
        return [str(v).strip() for v in value if str(v).strip()]

    raw_steps = data.get("steps") or []
    steps = []
    for s in raw_steps if isinstance(raw_steps, list) else []:
        if not isinstance(s, dict):
            continue
        seconds = int(s.get("time_seconds") or 0)
        steps.append(
            {
                "stamp": _stamp(seconds),
                "seconds": seconds,
                "title": str(s.get("title") or "Step").strip(),
                "detail": str(s.get("detail") or "").strip(),
            }
        )

    missing = strings("missing_information")
    if not steps:
        missing.append("No confident repair steps could be extracted from the frames.")
    if not strings("safety_warnings"):
        missing.append("No safety behaviour was clearly visible or narrated.")

    equipment = str(data.get("equipment") or "").strip()
    if not equipment or equipment.lower() == "unknown equipment":
        equipment = "Unknown equipment"
        if "equipment could not be identified" not in " ".join(m.lower() for m in missing):
            missing.append("Equipment could not be identified from the video alone.")

    summary = str(data.get("summary") or "").strip()

    return {
        "title": str(data.get("title") or "Untitled technician recording").strip(),
        "overview": summary,
        "equipment": equipment,
        "status": "pending_expert_review",
        "durationSeconds": int(duration_seconds),
        "createdAt": None,
        "videoUrl": None,
        "tools": strings("tools"),
        "components": strings("components"),
        "safetyWarnings": strings("safety_warnings"),
        "steps": steps,
        "missingInfo": missing,
        "review": None,
        "source": {
            "type": "video-analysis",
            "filename": filename,
            "model": MODEL_NAME,
            "note": "Auto-generated from video frames; not yet checked by a technician.",
        },
    }
