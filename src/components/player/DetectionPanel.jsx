import { useState, useEffect } from 'react';
import { Users, Dumbbell, Clock, Flag } from 'lucide-react';
import { flagDetection } from '@/api/prometheus';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function getConfidenceColor(c) {
  if (c >= 0.85) return '#00C896';
  if (c >= 0.65) return '#F5A623';
  return '#E84545';
}

function DetectionRow({ id, label, color, confidence, bbox, predictedClass, icon: Icon, flagged, onFlag }) {
  const pct = Math.round(confidence * 100);
  return (
    <div className="flex items-center gap-3 py-2 border-b border-prometheus-border last:border-0">
      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}>
        <Icon className="w-3.5 h-3.5" style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-prometheus-cream text-[12px] font-medium">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 rounded-full bg-prometheus-border overflow-hidden">
            <div className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: getConfidenceColor(confidence) }} />
          </div>
          <span className="text-[10px] font-semibold tabular-nums"
            style={{ color: getConfidenceColor(confidence) }}>
            {pct}%
          </span>
        </div>
      </div>

      <button
        onClick={() => onFlag(id, bbox, predictedClass, confidence)}
        title={flagged ? 'Flagged as incorrect' : 'Flag as incorrect'}
        className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
          flagged
            ? 'text-prometheus-yellow bg-prometheus-yellow/15 border border-prometheus-yellow/30'
            : 'text-prometheus-secondary hover:text-prometheus-yellow hover:bg-prometheus-yellow/10 border border-transparent'
        }`}
      >
        <Flag className="w-3 h-3" />
      </button>
    </div>
  );
}

export default function DetectionPanel({ frame, totalFrames, currentTime, sessionId }) {
  const [flagged, setFlagged] = useState(new Set());

  const toggleFlag = (id, bbox, predictedClass, confidence) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        if (sessionId && frame?.frame_index != null) {
          flagDetection({
            sessionId,
            frameIndex: frame.frame_index,
            detectionId: id,
            bbox,
            predictedClass,
            confidence,
          }).catch(() => {});
        }
      }
      return next;
    });
  };

  useEffect(() => {
    setFlagged(new Set());
  }, [frame?.frame_index]);

  const persons = frame?.persons ?? [];
  const machines = frame?.machines ?? [];
  const hasData = persons.length > 0 || machines.length > 0;
  const flaggedCount = flagged.size;

  return (
    <div className="h-full flex flex-col bg-prometheus-card rounded-lg border border-prometheus-border">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prometheus-border flex items-center justify-between">
        <div>
          <h2 className="text-prometheus-cream text-[14px] font-semibold">Frame Detections</h2>
          {frame && (
            <p className="text-prometheus-secondary text-[10px] mt-0.5">
              Frame {frame.frame_index}
            </p>
          )}
        </div>
        {currentTime != null && (
          <div className="flex items-center gap-1.5 bg-prometheus-elevated px-2.5 py-1 rounded-md">
            <Clock className="w-3 h-3 text-prometheus-green" />
            <span className="text-prometheus-cream text-[12px] font-mono font-semibold">
              {formatTime(currentTime)}
            </span>
          </div>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 px-4 py-3 border-b border-prometheus-border">
        <div className="flex items-center gap-1.5 bg-prometheus-red/10 border border-prometheus-red/20 rounded-md px-3 py-1.5">
          <Users className="w-3.5 h-3.5 text-prometheus-red" />
          <span className="text-prometheus-red text-[12px] font-semibold">
            {persons.length} person{persons.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-prometheus-green/10 border border-prometheus-green/20 rounded-md px-3 py-1.5">
          <Dumbbell className="w-3.5 h-3.5 text-prometheus-green" />
          <span className="text-prometheus-green text-[12px] font-semibold">
            {machines.length} machine{machines.length !== 1 ? 's' : ''}
          </span>
        </div>
        {flaggedCount > 0 && (
          <div className="flex items-center gap-1.5 bg-prometheus-yellow/10 border border-prometheus-yellow/30 rounded-md px-3 py-1.5 ml-auto">
            <Flag className="w-3 h-3 text-prometheus-yellow" />
            <span className="text-prometheus-yellow text-[12px] font-semibold">
              {flaggedCount} flagged
            </span>
          </div>
        )}
      </div>

      {/* Detection list */}
      <div className="flex-1 overflow-auto px-4 py-2">
        {!hasData ? (
          <p className="text-prometheus-secondary text-[12px] text-center mt-6">
            {frame ? 'No detections in this frame' : 'Play the video to see detections'}
          </p>
        ) : (
          <>
            {persons.map((p, i) => (
              <DetectionRow
                key={`p${i}`}
                id={`person_${i}`}
                label={`Person ${i + 1}`}
                color="#E84545"
                confidence={p.confidence}
                bbox={p.bbox}
                predictedClass="person"
                icon={Users}
                flagged={flagged.has(`person_${i}`)}
                onFlag={toggleFlag}
              />
            ))}
            {machines.map((m, i) => (
              <DetectionRow
                key={`m${i}`}
                id={`machine_${i}`}
                label={`Machine ${i + 1}`}
                color="#00C896"
                confidence={m.confidence}
                bbox={m.bbox}
                predictedClass="gym-machine"
                icon={Dumbbell}
                flagged={flagged.has(`machine_${i}`)}
                onFlag={toggleFlag}
              />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-prometheus-border">
        <p className="text-prometheus-secondary text-[10px]">
          {totalFrames} frames analyzed · sampled every 5th frame
          {flaggedCount > 0 && (
            <span className="text-prometheus-yellow ml-2">· {flaggedCount} detection{flaggedCount !== 1 ? 's' : ''} flagged</span>
          )}
        </p>
      </div>
    </div>
  );
}
