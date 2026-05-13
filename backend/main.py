"""
Prometheus AI — FastAPI backend

Routes:
  POST /api/upload              — upload video, start analysis
  GET  /api/status?session_id=  — poll until analysis is ready
  GET  /api/results?session_id= — fetch full detection JSON (memory → disk fallback)
  GET  /api/video?session_id=   — serve video file for browser playback
  GET  /api/uploads             — list all analyzed videos with stats
  GET  /health                  — model mode check
"""

import asyncio
import json
import shutil
from datetime import datetime, timezone
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

    s = sess.create_session(str(dest), filename=file.filename)
    asyncio.create_task(_run_analysis(s))

    return {"session_id": s.session_id, "status": "processing"}


async def _run_analysis(s: sess.Session):
    try:
        results = await asyncio.to_thread(detector.analyze_video, s.video_path, 5)
        s.frame_width = results["frame_width"]
        s.frame_height = results["frame_height"]
        s.results = {"session_id": s.session_id, "filename": s.filename, **results}
        s.status = "ready"

        # Persist to disk so history survives restarts
        results_path = UPLOAD_DIR / f"{s.session_id}_results.json"
        results_path.write_text(json.dumps(s.results))

        print(f"[{s.session_id}] Done — {results['total_frames_analyzed']} frames")
    except Exception as e:
        s.status = "error"
        print(f"[{s.session_id}] Error: {e}")


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
# GET /api/results  (memory → disk fallback)
# ---------------------------------------------------------------------------

@app.get("/api/results")
async def get_results(session_id: str):
    s = sess.get_session(session_id)
    if s is not None:
        if s.status == "processing":
            raise HTTPException(202, "Still processing")
        if s.status == "error":
            raise HTTPException(500, "Analysis failed")
        return s.results

    # Session not in memory — try loading from disk
    results_path = UPLOAD_DIR / f"{session_id}_results.json"
    if results_path.exists():
        return json.loads(results_path.read_text())

    raise HTTPException(404, "Session not found")


# ---------------------------------------------------------------------------
# GET /api/video
# ---------------------------------------------------------------------------

@app.get("/api/video")
async def get_video(session_id: str):
    # Try memory first
    s = sess.get_session(session_id)
    if s:
        path = Path(s.video_path)
    else:
        # Load from disk results to find the filename
        results_path = UPLOAD_DIR / f"{session_id}_results.json"
        if not results_path.exists():
            raise HTTPException(404, "Session not found")
        data = json.loads(results_path.read_text())
        path = UPLOAD_DIR / data["filename"]

    if not path.exists():
        raise HTTPException(404, "Video file not found")

    return FileResponse(path, media_type="video/mp4", headers={"Accept-Ranges": "bytes"})


# ---------------------------------------------------------------------------
# GET /api/uploads  — list all analyzed videos
# ---------------------------------------------------------------------------

@app.get("/api/uploads")
async def list_uploads():
    items = []
    for results_file in sorted(UPLOAD_DIR.glob("*_results.json"), key=lambda f: f.stat().st_mtime, reverse=True):
        try:
            data = json.loads(results_file.read_text())
            session_id = data.get("session_id", results_file.stem.replace("_results", ""))
            filename = data.get("filename", "unknown")
            video_path = UPLOAD_DIR / filename

            # Compute quick stats from frames
            frames = data.get("frames", [])
            max_persons = max((len(f.get("persons", [])) for f in frames), default=0)
            machine_count = max((len(f.get("machines", [])) for f in frames), default=0)
            fps = data.get("fps", 30)
            total_analyzed = data.get("total_frames_analyzed", 0)
            duration_s = round((total_analyzed * 5) / fps) if fps else 0

            items.append({
                "session_id": session_id,
                "filename": filename,
                "size_mb": round(video_path.stat().st_size / 1_000_000, 1) if video_path.exists() else None,
                "analyzed_at": datetime.fromtimestamp(
                    results_file.stat().st_mtime, tz=timezone.utc
                ).isoformat(),
                "total_frames": total_analyzed,
                "duration_s": duration_s,
                "max_persons": max_persons,
                "machine_count": machine_count,
            })
        except Exception:
            continue

    return {"uploads": items}


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "model": "real" if detector._model is not None else "mock"}
