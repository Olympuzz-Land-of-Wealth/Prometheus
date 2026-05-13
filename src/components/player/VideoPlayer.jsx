import { useRef, useEffect, useState, useCallback } from 'react';

// Find the detection frame closest to the current video time
function findFrame(frames, currentMs) {
  if (!frames || frames.length === 0) return null;
  let lo = 0, hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].timestamp_ms < currentMs) lo = mid + 1;
    else hi = mid;
  }
  // Pick whichever neighbour is closer
  if (lo > 0 && Math.abs(frames[lo - 1].timestamp_ms - currentMs) < Math.abs(frames[lo].timestamp_ms - currentMs)) {
    return frames[lo - 1];
  }
  return frames[lo];
}

// Given the video's natural size and the container size, compute the
// letterboxed render rect so SVG bboxes line up with what's on screen.
function getVideoRect(container, videoEl) {
  const cw = container.clientWidth;
  const ch = container.clientHeight;
  const vw = videoEl.videoWidth || cw;
  const vh = videoEl.videoHeight || ch;
  const scale = Math.min(cw / vw, ch / vh);
  const rw = vw * scale;
  const rh = vh * scale;
  return {
    x: (cw - rw) / 2,
    y: (ch - rh) / 2,
    w: rw,
    h: rh,
  };
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoPlayer({ src, frames, onFrameChange }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [currentFrame, setCurrentFrame] = useState(null);
  const [timestamp, setTimestamp] = useState({ current: 0, duration: 0 });

  const updateRect = useCallback(() => {
    if (containerRef.current && videoRef.current) {
      setRect(getVideoRect(containerRef.current, videoRef.current));
    }
  }, []);

  // Update rect on resize and when video metadata loads
  useEffect(() => {
    const ro = new ResizeObserver(updateRect);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [updateRect]);

  // Sync bboxes to video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const ms = video.currentTime * 1000;
      const frame = findFrame(frames, ms);
      setCurrentFrame(frame);
      setTimestamp({ current: video.currentTime, duration: video.duration || 0 });
      onFrameChange?.(frame, video.currentTime);
    };

    const onMetadata = () => {
      updateRect();
      setTimestamp({ current: 0, duration: video.duration || 0 });
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onMetadata);
    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onMetadata);
    };
  }, [frames, onFrameChange, updateRect]);

  const persons = currentFrame?.persons ?? [];
  const machines = currentFrame?.machines ?? [];

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black rounded-lg overflow-hidden" onLoadedMetadata={updateRect}>
      <video
        ref={videoRef}
        src={src}
        controls
        className="w-full h-full object-contain"
        onLoadedMetadata={updateRect}
      />

      {/* Timestamp overlay */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-prometheus-cream text-[11px] font-mono px-2.5 py-1 rounded-md pointer-events-none">
        {formatTime(timestamp.current)} / {formatTime(timestamp.duration)}
      </div>

      {/* SVG bbox overlay — sits exactly over the letterboxed video area */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
      >
        {/* Machines — green */}
        {machines.map((m, i) => {
          const x = rect.x + m.bbox.x * rect.w;
          const y = rect.y + m.bbox.y * rect.h;
          const w = m.bbox.w * rect.w;
          const h = m.bbox.h * rect.h;
          const pct = Math.round(m.confidence * 100);
          return (
            <g key={`m${i}`}>
              <rect x={x} y={y} width={w} height={h} fill="rgba(0,200,150,0.08)" stroke="#00C896" strokeWidth="1.5" rx="3" />
              <rect x={x} y={y - 18} width={Math.max(w, 80)} height="18" fill="rgba(0,200,150,0.85)" rx="3" />
              <text x={x + 5} y={y - 5} fill="#080808" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">
                Machine · {pct}%
              </text>
            </g>
          );
        })}

        {/* Persons — red */}
        {persons.map((p, i) => {
          const x = rect.x + p.bbox.x * rect.w;
          const y = rect.y + p.bbox.y * rect.h;
          const w = p.bbox.w * rect.w;
          const h = p.bbox.h * rect.h;
          const pct = Math.round(p.confidence * 100);
          return (
            <g key={`p${i}`}>
              <rect x={x} y={y} width={w} height={h} fill="rgba(232,69,69,0.08)" stroke="#E84545" strokeWidth="1.5" rx="3" />
              <rect x={x} y={y - 18} width={Math.max(w, 70)} height="18" fill="rgba(232,69,69,0.85)" rx="3" />
              <text x={x + 5} y={y - 5} fill="#fff" fontSize="11" fontWeight="600" fontFamily="Inter,sans-serif">
                Person · {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
