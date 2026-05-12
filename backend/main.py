"""
Prometheus AI — FastAPI backend

Routes:
  POST /api/upload            — upload video, start machine detection
  GET  /api/machines          — get detected machines for a session
  WS   /ws/occupancy          — stream real-time occupancy per frame
"""

import asyncio
import json
import shutil
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

import detector
import session as sess

app = FastAPI(title="Prometheus AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(tempfile.gettempdir()) / "prometheus_uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# POST /api/upload
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    if not file.content_type.startswith("video/"):
        raise HTTPException(400, "File must be a video")

    dest = UPLOAD_DIR / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    s = sess.create_session(str(dest))

    # Run detection in background so upload returns immediately
    asyncio.create_task(_run_detection(s))

    return {"session_id": s.session_id, "status": "processing"}


async def _run_detection(s: sess.Session):
    try:
        machines, fw, fh = await asyncio.to_thread(
            detector.detect_machines, s.video_path
        )
        s.machines = [
            sess.Machine(
                machine_id=m["machine_id"],
                bbox=m["bbox"],
                confidence=m["confidence"],
            )
            for m in machines
        ]
        s.frame_width = fw
        s.frame_height = fh
        s.status = "ready"
    except Exception as e:
        s.status = "error"
        print(f"Detection error: {e}")


# ---------------------------------------------------------------------------
# GET /api/machines
# ---------------------------------------------------------------------------

@app.get("/api/machines")
async def get_machines(session_id: str):
    s = sess.get_session(session_id)
    if s is None:
        raise HTTPException(404, "Session not found")
    if s.status == "processing":
        raise HTTPException(202, "Still processing — try again shortly")
    if s.status == "error":
        raise HTTPException(500, "Detection failed")

    return {
        "session_id": s.session_id,
        "camera_id": "cam_a",
        "frame_width": s.frame_width,
        "frame_height": s.frame_height,
        "machines": [
            {
                "machine_id": m.machine_id,
                "bbox": m.bbox,
                "confidence": m.confidence,
            }
            for m in s.machines
        ],
    }


# ---------------------------------------------------------------------------
# WS /ws/occupancy
# ---------------------------------------------------------------------------

@app.websocket("/ws/occupancy")
async def ws_occupancy(websocket: WebSocket, session_id: str):
    s = sess.get_session(session_id)
    if s is None or s.status != "ready":
        await websocket.close(code=4004, reason="Session not ready")
        return

    await websocket.accept()
    try:
        machines = [
            {"machine_id": m.machine_id, "bbox": m.bbox, "confidence": m.confidence}
            for m in s.machines
        ]
        async for msg in detector.stream_occupancy(s.video_path, machines, session_id):
            await websocket.send_text(json.dumps(msg))
    except WebSocketDisconnect:
        pass


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    model_ready = detector._model is not None
    return {"status": "ok", "model": "real" if model_ready else "mock"}
