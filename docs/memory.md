# Prometheus — Project Memory

## What This Project Is
Gym machine monitoring app. Uses YOLOv10 to classify bounding boxes as person or gym-machine from a CCTV video. Shows results as a video replay with overlaid bounding boxes.

## Team Split
- **Friend's responsibility:** Train YOLOv10, produce inference output (bboxes, class labels, confidence scores)
- **Our responsibility:** Website — upload, analyze, and replay video with detection overlays

## Deadline
**2026-05-14** (today)

---

## Scope Changes (in order)

| Date | What changed | Why |
|---|---|---|
| 2026-05-13 | Machine naming dropped | Too complex for deadline |
| 2026-05-13 | Occupancy (free/occupied) was the goal | Original plan |
| 2026-05-14 | Occupancy detection dropped | Model not ready for full pipeline |
| 2026-05-14 | Scope = classification only: person vs machine | What the model can reliably do now |
| 2026-05-14 | Real-time streaming deferred | Will add after seeing friend's full pipeline |
| 2026-05-14 | MachineConfirm page removed from flow | No longer needed without occupancy |

---

## Current Architecture

```
Upload video
    ↓
POST /api/upload → saved to backend/uploads/ (persistent)
    ↓ (background)
analyze_video() — YOLOv10 on every 5th frame
    ↓
GET /api/results → JSON: [{frame_index, timestamp_ms, persons, machines}]
GET /api/video   → serve raw video for browser playback
    ↓
Frontend: video plays + SVG bbox overlay synced to currentTime
Right panel: person count, machine count, confidence per detection
```

**Streaming:** Still possible later. Backend is structured to add a WebSocket endpoint alongside the replay approach. Decision deferred until friend's full pipeline is ready.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS + shadcn/ui
- **Routing:** React Router v6 (2 pages: `/` upload, `/dashboard` player)
- **Backend:** Python FastAPI — `session.py`, `detector.py`, `main.py`
- **Model:** YOLOv10 (friend's weights at `model/runs/train/weights/best.pt`)
- **Mock mode:** Auto-activates when weights file is missing

## Design System Colors (prometheus- prefix in Tailwind)
- bg `#080808`, card `#121212`, sidebar `#0f181e`, elevated `#212B39`
- border `#242527`, cream `#F5F0E8`, secondary `#8A8A8A`
- green `#00C896`, red `#E84545`, yellow `#F5A623`
- Confidence thresholds: ≥85% green, ≥65% yellow, <65% red
- **Bbox colors: green = machine, red = person**

## Detection Data Shape
```json
{
  "frames": [{
    "frame_index": 0,
    "timestamp_ms": 0,
    "persons":  [{ "bbox": {"x":0.1,"y":0.2,"w":0.05,"h":0.15}, "confidence": 0.92 }],
    "machines": [{ "bbox": {"x":0.3,"y":0.1,"w":0.15,"h":0.30}, "confidence": 0.88 }]
  }]
}
```

## Remaining After Demo
- Add real-time streaming (WebSocket) once friend's full pipeline works
- Face blur (always deferred)
