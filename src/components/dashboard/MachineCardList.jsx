import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

function getConfidenceColor(c) {
  if (c >= 85) return '#00C896';
  if (c >= 65) return '#F5A623';
  return '#E84545';
}

function MachineCard({ machine }) {
  const [hovered, setHovered] = useState(false);
  const isFree = machine.status === 'free';

  return (
    <div
      className="relative bg-prometheus-card border border-prometheus-border rounded-lg p-3.5 transition-all duration-150 hover:border-prometheus-hover"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-1.5">
        <h3 className="text-prometheus-cream text-[13px] font-semibold">{machine.name}</h3>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
          style={{
            color: isFree ? '#00C896' : '#E84545',
            background: isFree ? 'rgba(0,200,150,0.1)' : 'rgba(232,69,69,0.1)',
          }}
        >
          {isFree ? 'Free' : 'In Use'}
        </span>
      </div>

      <p className="text-prometheus-secondary text-[11px]">
        {isFree ? `Free for ${machine.time}` : `Occupied for ${machine.time}`}
      </p>

      <div className="flex items-center justify-between mt-2.5">
        <button className="text-prometheus-secondary text-[10px] border border-prometheus-border px-2.5 py-1 rounded-md hover:bg-prometheus-hover hover:text-prometheus-cream transition-colors">
          <span className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Report Wrong Status
          </span>
        </button>
      </div>

      {/* Tooltip on hover */}
      {hovered && (
        <div className="absolute -top-11 left-1/2 -translate-x-1/2 bg-prometheus-elevated border border-prometheus-border rounded-lg px-3 py-2 z-30 whitespace-nowrap shadow-xl">
          <p className="text-[10px] text-prometheus-cream font-medium">
            Model confidence:{' '}
            <span style={{ color: getConfidenceColor(machine.confidence) }}>{machine.confidence}%</span>
          </p>
          {machine.camera && (
            <p className="text-[9px] text-prometheus-secondary">Detected by: {machine.camera}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function MachineCardList({ machines }) {
  return (
    <div className="h-full flex flex-col bg-prometheus-card rounded-lg border border-prometheus-border">
      <div className="px-4 py-3 border-b border-prometheus-border flex items-center justify-between">
        <h2 className="text-prometheus-cream text-[14px] font-semibold">Machine Status</h2>
        <span className="text-prometheus-secondary text-[11px]">{machines.length} machines</span>
      </div>

      <div className="flex-1 overflow-auto px-3 py-3 space-y-2.5">
        {machines.map((m) => (
          <MachineCard key={m.id} machine={m} />
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-prometheus-border">
        <p className="text-prometheus-secondary text-[10px] italic">AI confidence shown on hover</p>
      </div>
    </div>
  );
}