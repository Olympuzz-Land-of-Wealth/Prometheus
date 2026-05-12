import { Flame, Video } from 'lucide-react';

export default function TopBar({ freeCount, totalCount, connected = false }) {
  const occupiedCount = totalCount - freeCount;
  const occupancyPercent = (freeCount / totalCount) * 100;

  return (
    <div
      className="h-14 flex items-center justify-between px-5 border-b border-prometheus-border"
      style={{
        background: 'linear-gradient(to bottom, #0f181e, #0d151b)',
      }}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-prometheus-green/10 flex items-center justify-center">
          <Flame className="w-4 h-4 text-prometheus-green" />
        </div>
        <span className="text-prometheus-cream font-semibold text-[14px] tracking-tight">Prometheus</span>
        <span className="text-prometheus-secondary text-[11px] ml-1">Live</span>
        <span
          className={`w-1.5 h-1.5 rounded-full ml-0.5 ${connected ? 'bg-prometheus-green animate-pulse' : 'bg-prometheus-secondary'}`}
        />
      </div>

      {/* Center: Occupancy bar */}
      <div className="flex items-center gap-3">
        <span className="text-prometheus-cream text-[13px] font-medium tabular-nums">
          {freeCount} / {totalCount} machines free
        </span>
        <div className="w-40 h-2 rounded-full bg-prometheus-border overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${occupancyPercent}%`,
              background: `linear-gradient(90deg, #00C896, #00C896 ${occupancyPercent}%)`,
            }}
          />
        </div>
        <span className="text-prometheus-secondary text-[11px]">{occupiedCount} occupied</span>
      </div>

      {/* Right: CCTV preview */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-9 rounded-md bg-prometheus-elevated border border-prometheus-border overflow-hidden relative flex items-center justify-center" style={{ filter: 'blur(0.5px)' }}>
          <Video className="w-4 h-4 text-prometheus-secondary/50" />
          <div className="absolute inset-0 bg-prometheus-bg/30 backdrop-blur-sm" />
        </div>
        <span className="text-prometheus-secondary text-[10px] leading-tight">
          Live Feed<br />(blurred)
        </span>
      </div>
    </div>
  );
}