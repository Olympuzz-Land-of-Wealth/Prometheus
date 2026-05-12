import { useState } from 'react';

const MACHINES_CONFIRM = [
  { id: 1, name: 'Treadmill 01', x: 8, y: 10, w: 18, h: 22, confidence: 94 },
  { id: 2, name: 'Treadmill 02', x: 30, y: 10, w: 18, h: 22, confidence: 91 },
  { id: 3, name: 'Leg Press 01', x: 55, y: 8, w: 20, h: 18, confidence: 78 },
  { id: 4, name: 'Bench Press 01', x: 8, y: 48, w: 22, h: 20, confidence: 96 },
  { id: 5, name: 'Cable Machine 01', x: 55, y: 42, w: 22, h: 24, confidence: 62 },
  { id: 6, name: 'Rowing Machine 01', x: 30, y: 55, w: 20, h: 22, confidence: 88 },
];

function getConfidenceColor(c) {
  if (c >= 85) return '#00C896';
  if (c >= 65) return '#F5A623';
  return '#E84545';
}

export default function FloorPlan({ mode = 'confirm', machines: liveMachines }) {
  const [hoveredId, setHoveredId] = useState(null);
  const machines = mode === 'live' ? liveMachines : MACHINES_CONFIRM;

  return (
    <div className="relative w-full h-full bg-prometheus-sidebar rounded-lg border border-prometheus-border overflow-hidden">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#F5F0E8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Floor plan label */}
      <div className="absolute top-3 left-3 text-[10px] text-prometheus-secondary font-medium uppercase tracking-widest">
        Overhead Floor Plan
      </div>

      {/* Machine boxes */}
      {machines.map((m) => {
        const isLive = mode === 'live';
        const isFree = isLive ? m.status === 'free' : false;
        const borderColor = isLive
          ? isFree ? '#00C896' : '#E84545'
          : getConfidenceColor(m.confidence);
        const bgColor = isLive
          ? isFree ? 'rgba(0,200,150,0.08)' : 'rgba(232,69,69,0.08)'
          : 'rgba(33,43,57,0.5)';

        return (
          <div
            key={m.id}
            className="absolute rounded-lg transition-all duration-200 cursor-pointer"
            style={{
              left: `${m.x}%`,
              top: `${m.y}%`,
              width: `${m.w}%`,
              height: `${m.h}%`,
              border: `1.5px solid ${borderColor}`,
              background: bgColor,
            }}
            onMouseEnter={() => setHoveredId(m.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Label chip */}
            <div className="absolute top-1.5 left-1.5 bg-prometheus-elevated/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-prometheus-cream font-medium whitespace-nowrap">
              {m.name}
            </div>

            {/* Confidence badge or status */}
            {!isLive && (
              <div
                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{ color: getConfidenceColor(m.confidence), background: 'rgba(8,8,8,0.7)' }}
              >
                {m.confidence}%
              </div>
            )}

            {isLive && (
              <div
                className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{ color: isFree ? '#00C896' : '#E84545', background: 'rgba(8,8,8,0.7)' }}
              >
                {isFree ? 'FREE' : 'IN USE'}
              </div>
            )}

            {/* Hover tooltip for live */}
            {isLive && hoveredId === m.id && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-prometheus-elevated border border-prometheus-border rounded-lg px-3 py-2 z-20 whitespace-nowrap shadow-lg">
                <p className="text-[10px] text-prometheus-cream font-medium">Model confidence: {m.confidence}%</p>
                <p className="text-[9px] text-prometheus-secondary">Camera: {m.camera}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}