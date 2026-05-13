"""
Prometheus AI — FastAPI backend (2026-05-14)

Routes:
  POST /api/upload              — upload video, start analysis
  GET  /api/status?session_id=  — poll until analysis is ready
  GET  /api/results?session_id= — fetch full detection JSON
  GET  /api/video?session_id=   — serve video file for browser playback
  GET  /health                  — model mode check

Streaming (WebSocket) will be added here later once friend's full
pipeline is ready. Session structure already supports it.
"""

import asyncio
import shutil
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

import detector
import session as sess

app = FastAPI(title="Prometheus AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# POST /api/upload
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    dest = UPLOAD_DIR / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)

    s = sess.create_session(str(dest))
    asyncio.create_task(_run_analysis(s))

    return {"session_id": s.session_id, "status": "processing"}


async def _run_analysis(s: sess.Session):
    try:
        results = await asyncio.to_thread(
            detector.analyze_video, s.video_path, 5
        )
        s.frame_width = results["frame_width"]
        s.frame_height = results["frame_height"]
        s.results = {"session_id": s.session_id, **results}
        s.status = "ready"
        print(f"[{s.session_id}] Analysis done — {results['total_frames_analyzed']} frames")
    except Exception as e:
        s.status = "error"
        print(f"[{s.session_id}] Analysis error: {e}")


# ---------------------------------------------------------------------------
# GET /api/status
# ---------------------------------------------------------------------------

@app.get("/api/status")
async def get_status(session_id: str):
    s = sess.get_session(session_id)
    if s is None:
        raise HTTPException(404, "Session not found")
    return {"session_id": s.session_id, "status": s.status}


# ---------------------------------------------------------------------------
# GET /api/results
# ---------------------------------------------------------------------------

@app.get("/api/results")
async def get_results(session_id: str):
    s = sess.get_session(session_id)
    if s is None:
        raise HTTPException(404, "Session not found")
    if s.status == "processing":
        raise HTTPException(202, "Still processing")
    if s.status == "error":
        raise HTTPException(500, "Analysis failed")
    return s.results


# ---------------------------------------------------------------------------
# GET /api/video
# ---------------------------------------------------------------------------

@app.get("/api/video")
async def get_video(session_id: str):
    s = sess.get_session(session_id)
    if s is None:
        raise HTTPException(404, "Session not found")
    path = Path(s.video_path)
    if not path.exists():
        raise HTTPException(404, "Video file not found")
    return FileResponse(
        path,
        media_type="video/mp4",
        headers={"Accept-Ranges": "bytes"},
    )


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model": "real" if detector._model is not None else "mock",
    }
