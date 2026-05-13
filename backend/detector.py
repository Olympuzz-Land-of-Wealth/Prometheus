"""
YOLOv10 wrapper — classification only (person vs gym-machine).

Scope (2026-05-14): No occupancy logic. Just detect and label every bbox
per frame. Streaming can be added later on top of this same model.

Classes:
  0 = person
  1 = gym-machine

Mock mode activates automatically when weights are missing.
"""

import random
from pathlib import Path

import cv2

PERSON_CLASS = 0
MACHINE_CLASS = 1

WEIGHTS_PATH = (
    Path(__file__).parent.parent / "model" / "runs" / "train" / "weights" / "best.pt"
)


def _load_model():
    if not WEIGHTS_PATH.exists():
        return None
    try:
        from ultralytics import YOLO
        return YOLO(str(WEIGHTS_PATH))
    except Exception as e:
        print(f"[detector] Failed to load model: {e}")
        return None


_model = _load_model()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_video(video_path: str, every_n: int = 5) -> dict:
    """
    Process every Nth frame of the video.
    Returns the full results dict (matches /api/results response shape).
    """
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    fw = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)) or 1920
    fh = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)) or 1080

    frames = []
    frame_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if frame_index % every_n == 0:
            timestamp_ms = int((frame_index / fps) * 1000)
            if _model is None:
                entry = _mock_frame(frame_index, timestamp_ms)
            else:
                entry = _real_frame(frame, frame_index, timestamp_ms)
            frames.append(entry)

        frame_index += 1

    cap.release()

    if not frames:
        frames = _mock_frames_fallback()

    return {
        "frame_width": fw,
        "frame_height": fh,
        "fps": fps,
        "total_frames_analyzed": len(frames),
        "frames": frames,
    }


# ---------------------------------------------------------------------------
# Real inference
# ---------------------------------------------------------------------------

def _real_frame(frame, frame_index: int, timestamp_ms: int) -> dict:
    results = _model(frame, verbose=False)[0]
    persons = []
    machines = []

    for i in range(len(results.boxes)):
        cls = int(results.boxes.cls[i])
        conf = round(float(results.boxes.conf[i]), 4)
        xc, yc, w, h = results.boxes.xywhn[i].tolist()
        bbox = {
            "x": round(xc - w / 2, 4),
            "y": round(yc - h / 2, 4),
            "w": round(w, 4),
            "h": round(h, 4),
        }
        det = {"bbox": bbox, "confidence": conf}
        if cls == PERSON_CLASS:
            persons.append(det)
        elif cls == MACHINE_CLASS:
            machines.append(det)

    return {
        "frame_index": frame_index,
        "timestamp_ms": timestamp_ms,
        "persons": persons,
        "machines": machines,
    }


# ---------------------------------------------------------------------------
# Mock helpers
# ---------------------------------------------------------------------------

_MOCK_MACHINES = [
    {"x": 0.05, "y": 0.10, "w": 0.18, "h": 0.35},
    {"x": 0.28, "y": 0.10, "w": 0.18, "h": 0.35},
    {"x": 0.51, "y": 0.10, "w": 0.18, "h": 0.35},
    {"x": 0.74, "y": 0.10, "w": 0.18, "h": 0.35},
    {"x": 0.05, "y": 0.55, "w": 0.18, "h": 0.35},
    {"x": 0.28, "y": 0.55, "w": 0.18, "h": 0.35},
]


def _mock_frame(frame_index: int, timestamp_ms: int) -> dict:
    persons = []
    # Occasionally add a person wandering around
    if random.random() > 0.4:
        px = round(random.uniform(0.05, 0.85), 3)
        py = round(random.uniform(0.10, 0.70), 3)
        persons.append({
            "bbox": {"x": px, "y": py, "w": 0.06, "h": 0.18},
            "confidence": round(random.uniform(0.75, 0.97), 2),
        })

    machines = [
        {
            "bbox": m,
            "confidence": round(random.uniform(0.80, 0.97), 2),
        }
        for m in _MOCK_MACHINES
    ]

    return {
        "frame_index": frame_index,
        "timestamp_ms": timestamp_ms,
        "persons": persons,
        "machines": machines,
    }


def _mock_frames_fallback() -> list:
    return [_mock_frame(i * 5, int(i * 5 / 30 * 1000)) for i in range(60)]
