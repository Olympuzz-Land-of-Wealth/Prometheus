"""
Prometheus AI — FastAPI backend

Routes:
  POST /api/upload              — upload video, start analysis
  GET  /api/status?session_id=  — poll until analysis is ready
  GET  /api/results?session_id= — fetch full detection JSON (memory → disk fallback)
  GET  /api/video?session_id=   — serve video file for browser playback
  GET  /api/uploads             — list all analyzed videos with stats
  POST /api/flag                — save a flagged detection (frame + crop + metadata)
  GET  /api/flags               — list flagged detection counts per session
  GET  /health                  — model mode check
"""

import asyncio
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

import cv2
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

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

FLAGGED_DIR = Path(__file__).parent / "flagged"
FLAGGED_DIR.mkdir(exist_ok=True)


# ---------------------------------------------------------------------------
# POST /api/upload
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    dest = UPLOAD_DIR / Path(file.filename).name
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
# POST /api/flag
# ---------------------------------------------------------------------------

class BBox(BaseModel):
    x: float
    y: float
    w: float
    h: float

class FlagRequest(BaseModel):
    session_id: str
    frame_index: int
    detection_id: str
    bbox: BBox
    predicted_class: str
    confidence: float

@app.post("/api/flag")
async def flag_detection(req: FlagRequest):
    # Resolve video path from session memory or disk
    s = sess.get_session(req.session_id)
    if s:
        video_path = Path(s.video_path)
        frame_w = s.frame_width
        frame_h = s.frame_height
    else:
        results_path = UPLOAD_DIR / f"{req.session_id}_results.json"
        if not results_path.exists():
            raise HTTPException(404, "Session not found")
        data = json.loads(results_path.read_text())
        video_path = UPLOAD_DIR / data["filename"]
        frame_w = data.get("frame_width", 1920)
        frame_h = data.get("frame_height", 1080)

    if not video_path.exists():
        raise HTTPException(404, "Video file not found")

    # Sanitize client-supplied path components
    safe_sid = Path(req.session_id).name
    safe_did = req.detection_id.replace("/", "_").replace("..", "_")

    # Directory for this flagged detection
    out_dir = FLAGGED_DIR / safe_sid / f"frame{req.frame_index}_{safe_did}"
    out_dir.mkdir(parents=True, exist_ok=True)

    # Extract frame from video
    cap = cv2.VideoCapture(str(video_path))
    cap.set(cv2.CAP_PROP_POS_FRAMES, req.frame_index)
    ok, frame = cap.read()
    cap.release()

    if not ok:
        raise HTTPException(422, "Could not extract frame from video")

    # Save full frame
    full_path = out_dir / "full_frame.jpg"
    cv2.imwrite(str(full_path), frame)

    # Crop with small padding — bbox is top-left format {x, y, w, h} normalized
    fh, fw = frame.shape[:2]
    pad_x = int(req.bbox.w * fw * 0.05)
    pad_y = int(req.bbox.h * fh * 0.05)
    x1 = max(0, int(req.bbox.x * fw) - pad_x)
    y1 = max(0, int(req.bbox.y * fh) - pad_y)
    x2 = min(fw, int((req.bbox.x + req.bbox.w) * fw) + pad_x)
    y2 = min(fh, int((req.bbox.y + req.bbox.h) * fh) + pad_y)
    crop = frame[y1:y2, x1:x2]
    cv2.imwrite(str(out_dir / "crop.jpg"), crop)

    # Save metadata
    metadata = {
        "session_id": req.session_id,
        "frame_index": req.frame_index,
        "detection_id": req.detection_id,
        "predicted_class": req.predicted_class,
        "confidence": req.confidence,
        "bbox_xywhn": {"x": req.bbox.x, "y": req.bbox.y, "w": req.bbox.w, "h": req.bbox.h},
        "frame_size": {"width": frame_w, "height": frame_h},
        "flagged_at": datetime.now(timezone.utc).isoformat(),
    }
    (out_dir / "metadata.json").write_text(json.dumps(metadata, indent=2))

    return {"status": "flagged", "path": str(out_dir.relative_to(Path(__file__).parent))}


# ---------------------------------------------------------------------------
# GET /api/flags  — flagged detection counts per session
# ---------------------------------------------------------------------------

@app.get("/api/flags")
async def list_flags(session_id: Optional[str] = None):
    result = {}
    search_root = FLAGGED_DIR / session_id if session_id else FLAGGED_DIR

    if not search_root.exists():
        return {"flags": result if session_id else {}}

    if session_id:
        count = sum(1 for p in search_root.iterdir() if p.is_dir())
        return {"flags": {session_id: count}}

    for sid_dir in FLAGGED_DIR.iterdir():
        if sid_dir.is_dir():
            result[sid_dir.name] = sum(1 for p in sid_dir.iterdir() if p.is_dir())

    return {"flags": result}


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {"status": "ok", "model": "real" if detector._model is not None else "mock"}
