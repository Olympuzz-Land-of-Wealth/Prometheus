"""
YOLOv10 wrapper.

- If a trained weights file is provided, runs real inference.
- Otherwise falls back to mock data so the frontend can be developed
  and tested without the model being ready.

Classes expected in the model:
  0 = person
  1 = gym-machine
"""

import asyncio
import random
import time
from pathlib import Path

import cv2
import numpy as np

PERSON_CLASS = 0
MACHINE_CLASS = 1

# Set this to the path of the trained .pt weights once the model is ready.
# e.g. "model/runs/train/weights/best.pt"
WEIGHTS_PATH = Path(__file__).parent.parent / "model" / "runs" / "train" / "weights" / "best.pt"


def _load_model():
    if not WEIGHTS_PATH.exists():
        return None
    try:
        from ultralytics import YOLO
        return YOLO(str(WEIGHTS_PATH))
    except Exception:
        return None


_model = _load_model()


# ---------------------------------------------------------------------------
# Machine detection (one-shot from video)
# ---------------------------------------------------------------------------

def detect_machines(video_path: str) -> tuple[list[dict], int, int]:
    """
    Run detection on the first usable frame of the video.
    Returns (machines, frame_width, frame_height).

    Each machine dict: {machine_id, bbox: {x,y,w,h}, confidence}
    bbox values are 0.0–1.0 fractions of frame dimensions.
    """
    if _model is None:
        return _mock_machines(), 1920, 1080

    cap = cv2.VideoCapture(video_path)
    fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    ok, frame = cap.read()
    cap.release()

    if not ok:
        return _mock_machines(), fw or 1920, fh or 1080

    results = _model(frame, verbose=False)[0]
    machines = []
    machine_idx = 1

    boxes = results.boxes
    # Sort left-to-right, top-to-bottom so IDs are stable
    order = sorted(range(len(boxes)), key=lambda i: (
        float(boxes.xywhn[i][1]),  # y-center
        float(boxes.xywhn[i][0]),  # x-center
    ))

    for i in order:
        cls = int(boxes.cls[i])
        if cls != MACHINE_CLASS:
            continue
        xc, yc, w, h = boxes.xywhn[i].tolist()
        machines.append({
            "machine_id": f"machine_{machine_idx}",
            "bbox": {
                "x": round(xc - w / 2, 4),
                "y": round(yc - h / 2, 4),
                "w": round(w, 4),
                "h": round(h, 4),
            },
            "confidence": round(float(boxes.conf[i]), 4),
        })
        machine_idx += 1

    return machines or _mock_machines(), fw, fh


# ---------------------------------------------------------------------------
# Occupancy stream (async generator, one update per frame)
# ---------------------------------------------------------------------------

async def stream_occupancy(video_path: str, machines: list, session_id: str):
    """
    Async generator yielding one dict per processed frame.

    Yields:
      {session_id, timestamp, frame_index, machines: [{machine_id, status, confidence}]}
    """
    if _model is None:
        async for msg in _mock_stream(machines, session_id):
            yield msg
        return

    cap = cv2.VideoCapture(video_path)
    frame_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            # Loop video for demo purposes
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ok, frame = cap.read()
            if not ok:
                break

        results = _model(frame, verbose=False)[0]
        person_boxes = [
            results.boxes.xyxyn[i].tolist()
            for i in range(len(results.boxes))
            if int(results.boxes.cls[i]) == PERSON_CLASS
        ]

        updates = []
        for m in machines:
            b = m["bbox"]
            machine_xyxy = [b["x"], b["y"], b["x"] + b["w"], b["y"] + b["h"]]
            occupied = any(_iou(machine_xyxy, p) > 0.15 for p in person_boxes)
            updates.append({
                "machine_id": m["machine_id"],
                "status": "occupied" if occupied else "free",
                "confidence": round(m["confidence"], 4),
            })

        yield {
            "session_id": session_id,
            "timestamp": _iso_now(),
            "frame_index": frame_index,
            "machines": updates,
        }

        frame_index += 1
        await asyncio.sleep(0.5)  # ~2 fps push rate

    cap.release()


def _iou(a, b):
    """Intersection over Union for two [x1,y1,x2,y2] boxes (normalised)."""
    ix1 = max(a[0], b[0])
    iy1 = max(a[1], b[1])
    ix2 = min(a[2], b[2])
    iy2 = min(a[3], b[3])
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    if inter == 0:
        return 0.0
    area_a = (a[2] - a[0]) * (a[3] - a[1])
    area_b = (b[2] - b[0]) * (b[3] - b[1])
    return inter / (area_a + area_b - inter)


# ---------------------------------------------------------------------------
# Mock helpers (used when no weights are available)
# ---------------------------------------------------------------------------

def _mock_machines() -> list[dict]:
    positions = [
        (0.05, 0.10, 0.18, 0.35),
        (0.28, 0.10, 0.18, 0.35),
        (0.51, 0.10, 0.18, 0.35),
        (0.74, 0.10, 0.18, 0.35),
        (0.05, 0.55, 0.18, 0.35),
        (0.28, 0.55, 0.18, 0.35),
    ]
    return [
        {
            "machine_id": f"machine_{i + 1}",
            "bbox": {"x": x, "y": y, "w": w, "h": h},
            "confidence": round(random.uniform(0.72, 0.97), 2),
        }
        for i, (x, y, w, h) in enumerate(positions)
    ]


async def _mock_stream(machines: list, session_id: str):
    """Randomly flips machine statuses every ~5 seconds to simulate live feed."""
    statuses = {m["machine_id"]: random.choice(["free", "occupied"]) for m in machines}
    frame_index = 0
    flip_at = time.time() + 5

    while True:
        now = time.time()
        if now >= flip_at:
            mid = random.choice(list(statuses))
            statuses[mid] = "free" if statuses[mid] == "occupied" else "occupied"
            flip_at = now + random.uniform(3, 8)

        yield {
            "session_id": session_id,
            "timestamp": _iso_now(),
            "frame_index": frame_index,
            "machines": [
                {
                    "machine_id": m["machine_id"],
                    "status": statuses[m["machine_id"]],
                    "confidence": round(m["confidence"] + random.uniform(-0.03, 0.03), 2),
                }
                for m in machines
            ],
        }
        frame_index += 1
        await asyncio.sleep(1)


def _iso_now() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()
