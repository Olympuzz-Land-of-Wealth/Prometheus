# Backend Setup — Prometheus AI

**Created:** 2026-05-13

## Files

```
backend/
  main.py          # FastAPI app — routes + WebSocket
  detector.py      # YOLOv10 wrapper with mock fallback
  session.py       # In-memory session state
  requirements.txt
```

## How to Run

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Then check `http://localhost:8000/health` — it will say `"model": "mock"` until weights are placed.

## Mock Mode vs Real Mode

`detector.py` checks for weights at:
```
model/runs/train/weights/best.pt
```

- **Weights missing → mock mode:** Returns 6 hardcoded machine positions; statuses flip randomly every 3–8 seconds.
- **Weights present → real mode:** Runs YOLOv10 on uploaded video. Person bboxes are checked against machine bboxes using IoU > 0.15 threshold.

No code change needed to switch — just drop the weights file in the right place.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/upload` | Upload video, returns `{session_id, status: "processing"}` |
| GET | `/api/machines?session_id=X` | Returns machine list once detection is ready (poll if 202) |
| WS | `/ws/occupancy?session_id=X` | Streams `{frame_index, machines: [{machine_id, status, confidence}]}` |
| GET | `/health` | Returns `{status, model: "real"\|"mock"}` |

## CORS

Allows `localhost:5173` (Vite dev) and `localhost:4173` (Vite preview).

## Session State

In-memory only — sessions are lost on server restart. Fine for the demo.
