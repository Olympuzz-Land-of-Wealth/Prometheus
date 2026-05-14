import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Radio, Library } from 'lucide-react';
import VideoPlayer from '../components/player/VideoPlayer';
import DetectionPanel from '../components/player/DetectionPanel';
import ModeToggle from '../components/player/ModeToggle';
import VideoLibrary from '../components/player/VideoLibrary';
import { fetchResults, fetchUploads, videoUrl } from '../api/prometheus';

export default function LiveDashboard() {
  const { state } = useLocation();

  const [mode, setMode] = useState('replay');
  const [sessionId, setSessionId] = useState(state?.session_id ?? null);
  const [results, setResults] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showLibrary, setShowLibrary] = useState(!state?.session_id);
  const [error, setError] = useState(null);
  const [uploads, setUploads] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    setResults(null);
    setError(null);
    fetchResults(sessionId)
      .then(setResults)
      .catch((e) => setError(e.message));
  }, [sessionId]);

  useEffect(() => {
    fetchUploads()
      .then((d) => setUploads(d.uploads))
      .catch(() => setUploads([]));
  }, []);

  const handleSelectFromLibrary = (sid) => {
    setSessionId(sid);
    setShowLibrary(false);
    fetchUploads().then((d) => setUploads(d.uploads)).catch(() => {});
  };

  const handleFrameChange = (frame, time) => {
    setCurrentFrame(frame);
    if (time != null) setCurrentTime(time);
  };

  return (
    <div className="h-full flex flex-col bg-prometheus-bg font-inter">
      {/* Top bar */}
      <div
        className="h-14 flex items-center justify-between px-5 border-b border-prometheus-border flex-shrink-0"
        style={{ background: 'linear-gradient(to bottom, #0f181e, #0d151b)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-prometheus-green/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-prometheus-green" />
          </div>
          <span className="text-prometheus-cream font-semibold text-[14px] tracking-tight">Prometheus</span>
        </div>

        <ModeToggle mode={mode} onChange={setMode} />

        <div className="flex items-center gap-4">
          {results && (
            <div className="flex items-center gap-4 text-[11px] text-prometheus-secondary">
              <span>{results.total_frames_analyzed} frames</span>
              <span>{results.fps?.toFixed(0)} fps</span>
              <span>{results.frame_width}×{results.frame_height}</span>
            </div>
          )}
          <button
            onClick={() => setShowLibrary((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
              showLibrary
                ? 'bg-prometheus-green/10 border-prometheus-green/30 text-prometheus-green'
                : 'bg-prometheus-elevated border-prometheus-border text-prometheus-secondary hover:text-prometheus-cream'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            Library
          </button>
        </div>
      </div>

      {/* Content */}
      {mode === 'streaming' ? (
        <StreamingPlaceholder />
      ) : showLibrary ? (
        <VideoLibrary uploads={uploads} onSelect={handleSelectFromLibrary} />
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-prometheus-red text-[13px]">{error}</p>
        </div>
      ) : !results ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-prometheus-green"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex p-4 gap-4 min-h-0">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            className="flex-[60] min-h-0">
            <VideoPlayer
              src={videoUrl(sessionId)}
              frames={results.frames}
              onFrameChange={handleFrameChange}
            />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }} className="flex-[40] min-h-0">
            <DetectionPanel
              frame={currentFrame}
              totalFrames={results.total_frames_analyzed}
              currentTime={currentTime}
              sessionId={sessionId}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StreamingPlaceholder() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-prometheus-elevated border border-prometheus-border flex items-center justify-center">
        <Radio className="w-8 h-8 text-prometheus-secondary opacity-40" />
      </div>
      <div className="text-center">
        <p className="text-prometheus-cream text-[14px] font-semibold">Streaming Mode</p>
        <p className="text-prometheus-secondary text-[12px] mt-1">
          Not ready — available after live pipeline integration
        </p>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest bg-prometheus-yellow/10 text-prometheus-yellow border border-prometheus-yellow/30 px-3 py-1 rounded-full">
        Coming soon
      </span>
    </div>
  );
}
