import uuid
from dataclasses import dataclass, field
from typing import Literal

Status = Literal["processing", "ready", "error"]


@dataclass
class Machine:
    machine_id: str
    bbox: dict  # {x, y, w, h} as 0.0–1.0 fractions
    confidence: float


@dataclass
class Session:
    session_id: str
    video_path: str
    status: Status = "processing"
    machines: list[Machine] = field(default_factory=list)
    frame_width: int = 1920
    frame_height: int = 1080


_store: dict[str, Session] = {}


def create_session(video_path: str) -> Session:
    sid = uuid.uuid4().hex[:8]
    s = Session(session_id=sid, video_path=video_path)
    _store[sid] = s
    return s


def get_session(session_id: str) -> Session | None:
    return _store.get(session_id)
