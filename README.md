# Prometheus — Gym Intelligence

AI-powered gym monitoring app. Upload a gym footage video, run YOLOv10 detection, and replay the results with bounding boxes overlaid on the video.

**Detects two classes:** person · gym-machine

---

## Project Structure

```
Prometheus/
├── backend/          # FastAPI backend
│   ├── main.py       # API endpoints
│   ├── detector.py   # YOLOv10 wrapper (auto mock if weights missing)
│   ├── session.py    # In-memory session store
│   └── requirements.txt
├── src/              # React frontend
│   ├── pages/        # VideoUpload, LiveDashboard, Report
│   ├── components/   # VideoPlayer, DetectionPanel, VideoLibrary, ...
│   └── api/          # prometheus.js — all backend calls
├── runs/detect/prometheus_runs/baseline_model/weights/
│   └── best.pt       # YOLOv10 weights (download separately, not in git)
└── backend/uploads/  # Uploaded videos + results JSON (gitignored)
```

---

## Running the Backend

Requires **Python 3.11**.

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

Check model status: `http://localhost:8000/health`
- `"model": "real"` — YOLOv10 weights loaded
- `"model": "mock"` — weights not found, using simulated detections

### Switching from Mock to Real Model

Place `best.pt` at:
```
runs/detect/prometheus_runs/baseline_model/weights/best.pt
```
Then restart the backend. No code changes needed.

---

## Running the Frontend

Requires **Node.js 18+**.

```bash
npm install
npm run dev
```

App runs at `http://localhost:5173`. Backend must be running on port 8000.

---

## Workflow

1. **Upload** — drag a video onto the upload page; backend analyzes every 5th frame
2. **Replay** — video plays with bounding boxes overlaid; detection panel updates per frame
3. **Flag** — click the flag icon on any detection to mark it as incorrect; frame + crop saved to `backend/flagged/` for future model fine-tuning
4. **Report** — view session stats and upload history; flagged detection counts shown per session

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload video, start analysis |
| `GET` | `/api/status` | Poll analysis status (`processing\|ready\|error`) |
| `GET` | `/api/results` | Fetch full detection results JSON |
| `GET` | `/api/video` | Stream video file |
| `GET` | `/api/uploads` | List all analyzed sessions |
| `POST` | `/api/flag` | Save flagged detection (frame + crop + metadata) |
| `GET` | `/api/flags` | Get flagged detection counts per session |
| `GET` | `/health` | Model mode check |

---

## Frontend Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run lint       # Lint
npm run preview    # Preview production build
```
