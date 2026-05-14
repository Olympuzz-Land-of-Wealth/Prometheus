# Data Contract — Prometheus AI

**Last updated:** 2026-05-14

---

## Scope History

| Date | Change |
|---|---|
| 2026-05-13 | Machine naming dropped. Model outputs person/machine classification + free/occupied state. |
| 2026-05-14 | Occupancy detection dropped. Scope reduced to classification only: which bbox is a person, which is a machine. Real-time streaming deferred — using pre-process + replay approach instead. |

---

## Current Architecture (2026-05-14)

```
Upload video → Backend analyzes every 5th frame → Saves JSON results
→ Frontend plays video + syncs bounding boxes frame by frame
```

**Streaming is still possible later** — the backend structure is designed so a WebSocket stream can be added alongside the replay approach once the friend's full pipeline is ready.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/upload` | Upload video, triggers full analysis in background |
| GET | `/api/status?session_id=X` | Poll analysis progress: `processing` → `ready` |
| GET | `/api/results?session_id=X` | Fetch all frame detections (JSON) |
| GET | `/api/video?session_id=X` | Serve the video file for browser playback |

---

## POST /api/upload

**Request:** `multipart/form-data`, field `file` = video file

**Response:**
```json
{ "session_id": "abc12345", "status": "processing" }
```

Video is saved to `backend/uploads/` (persistent across restarts).

---

## GET /api/status?session_id=abc12345

```json
{ "session_id": "abc12345", "status": "processing" }
{ "session_id": "abc12345", "status": "ready" }
{ "session_id": "abc12345", "status": "error" }
```

Frontend polls this every second until `"ready"`.

---

## GET /api/results?session_id=abc12345

Full detection data for the entire video. All bbox values are `0.0–1.0` fractions.

```json
{
  "session_id": "abc12345",
  "frame_width": 1920,
  "frame_height": 1080,
  "fps": 30.0,
  "total_frames_analyzed": 150,
  "frames": [
    {
      "frame_index": 0,
      "timestamp_ms": 0,
      "persons": [
        { "bbox": { "x": 0.10, "y": 0.20, "w": 0.05, "h": 0.15 }, "confidence": 0.92 }
      ],
      "machines": [
        { "bbox": { "x": 0.30, "y": 0.10, "w": 0.15, "h": 0.30 }, "confidence": 0.88 }
      ]
    }
  ]
}
```

**Frame sampling:** every 5th frame. Between sampled frames, frontend holds the last known detection state.

---

## GET /api/video?session_id=abc12345

Returns the raw video file with Range request support (needed for browser seeking).

---

## Notes for Friend (Model Side)

- Classes: `0 = person`, `1 = gym-machine` (unchanged from training)
- No occupancy logic needed from the model side — just raw detections per frame
- If streaming is added later, it will follow the same bbox format as above
