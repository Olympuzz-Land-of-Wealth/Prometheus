# Data Contract — Prometheus AI

**Decided:** 2026-05-13  
**Deadline:** 2026-05-14  
**Context:** Machine naming is dropped due to deadline. Model only outputs person vs machine classification and free/occupied state.

---

## Overview

Two communication channels between backend and frontend:

| Channel | Direction | Purpose |
|---|---|---|
| `POST /api/upload` | Frontend → Backend | Upload video, trigger detection setup |
| `GET /api/machines` | Frontend → Backend | Fetch initial machine list after detection |
| `WS /ws/occupancy` | Backend → Frontend | Real-time occupancy updates (one message per frame batch) |

---

## 1. Video Upload — `POST /api/upload`

Frontend sends the video file. Backend runs one-shot detection to find all machine bounding boxes.

**Request:** `multipart/form-data`
```
file: <video file>
```

**Response:** `200 OK`
```json
{
  "session_id": "abc123",
  "status": "processing"
}
```

Poll or wait for `/api/machines` to be ready.

---

## 2. Initial Machine List — `GET /api/machines?session_id=abc123`

Called after upload completes. Returns all detected machines with their bounding boxes.  
Machines are auto-numbered — no custom names.

**Response:** `200 OK`
```json
{
  "session_id": "abc123",
  "camera_id": "cam_a",
  "frame_width": 1920,
  "frame_height": 1080,
  "machines": [
    {
      "machine_id": "machine_1",
      "bbox": {
        "x": 0.10,
        "y": 0.20,
        "w": 0.15,
        "h": 0.30
      },
      "confidence": 0.91
    },
    {
      "machine_id": "machine_2",
      "bbox": {
        "x": 0.35,
        "y": 0.20,
        "w": 0.15,
        "h": 0.30
      },
      "confidence": 0.87
    }
  ]
}
```

**bbox fields:** all values are `0.0–1.0` as a fraction of frame width/height.  
- `x`, `y` — top-left corner  
- `w`, `h` — width and height  

**confidence:** `0.0–1.0`. Thresholds: ≥0.85 green, ≥0.65 yellow, <0.65 red.

---

## 3. Real-time Occupancy — `WS /ws/occupancy?session_id=abc123`

Backend pushes one JSON message per processed frame batch. Frontend listens and updates machine cards.

**Message shape (backend → frontend):**
```json
{
  "session_id": "abc123",
  "timestamp": "2026-05-13T10:00:00Z",
  "frame_index": 1042,
  "machines": [
    {
      "machine_id": "machine_1",
      "status": "occupied",
      "confidence": 0.93
    },
    {
      "machine_id": "machine_2",
      "status": "free",
      "confidence": 0.88
    }
  ]
}
```

**`status` values:** `"free"` | `"occupied"` — no other values.  
**`confidence`:** detection confidence for this frame's reading, `0.0–1.0`.  
**`frame_index`:** monotonically increasing. Frontend can use this to discard stale messages.

---

## 4. Error / Connection Events

If the backend loses the video feed or model crashes, it sends a close frame with a reason string before closing the WebSocket. Frontend should show a "Connection lost" state and allow the user to re-upload.

---

## Notes for Friend (Model Side)

- Machine IDs must be **stable** within a session — same physical machine always gets the same `machine_id`.
- `machine_id` format: `machine_<n>` where n starts at 1. Order them left-to-right, top-to-bottom in the frame.
- Send WebSocket messages at whatever rate the model processes frames — frontend will handle throttling.
- No need to send person bounding boxes to the frontend — just the per-machine status is enough.

---

## What the Frontend Will Do With This

- `/confirm` page: calls `GET /api/machines`, renders each machine as a card with its confidence color (no rename UI — dropped).
- `/dashboard` page: opens `WS /ws/occupancy`, maps `machine_id → status` and re-renders machine cards on each message.
