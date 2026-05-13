import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import VideoPlayer from '../components/player/VideoPlayer';
import DetectionPanel from '../components/player/DetectionPanel';
import { fetchResults, videoUrl } from '../api/prometheus';

export default function LiveDashboard() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState(null);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!state?.session_id) {
      navigate('/', { replace: true });
      return;
    }
    fetchResults(state.session_id)
      .then(setResults)
      .catch((e) => setError(e.message));
  }, [state?.session_id, navigate]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-prometheus-bg">
        <p className="text-prometheus-red text-[13px]">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="h-full flex items-center justify-center bg-prometheus-bg">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-prometheus-green"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

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
          <span className="text-prometheus-secondary text-[11px] ml-1">Analysis</span>
        </div>
        <div className="flex items-center gap-4 text-[12px] text-prometheus-secondary">
          <span>{results.total_frames_analyzed} frames analyzed</span>
          <span>{results.fps?.toFixed(0)} fps</span>
          <span>{results.frame_width}×{results.frame_height}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex p-4 gap-4 min-h-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex-[60] min-h-0"
        >
          <VideoPlayer
            src={videoUrl(state.session_id)}
            frames={results.frames}
            onFrameChange={setCurrentFrame}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex-[40] min-h-0"
        >
          <DetectionPanel
            frame={currentFrame}
            totalFrames={results.total_frames_analyzed}
          />
        </motion.div>
      </div>
    </div>
  );
}
