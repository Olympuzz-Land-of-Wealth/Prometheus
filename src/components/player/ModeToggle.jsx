import { Switch } from '@/components/ui/switch';
import { PlayCircle, Radio } from 'lucide-react';

export default function ModeToggle({ mode, onChange }) {
  const isStreaming = mode === 'streaming';

  return (
    <div className="flex items-center gap-3 bg-prometheus-card border border-prometheus-border rounded-lg px-4 py-2">
      <div className={`flex items-center gap-1.5 transition-colors ${!isStreaming ? 'text-prometheus-cream' : 'text-prometheus-secondary'}`}>
        <PlayCircle className="w-3.5 h-3.5" />
        <span className="text-[12px] font-semibold">Replay</span>
      </div>

      <Switch
        checked={isStreaming}
        onCheckedChange={(val) => {
          if (val) return; // streaming disabled — do nothing
        }}
        className="data-[state=checked]:bg-prometheus-green data-[state=unchecked]:bg-prometheus-elevated"
      />

      <div className={`flex items-center gap-1.5 transition-colors ${isStreaming ? 'text-prometheus-cream' : 'text-prometheus-secondary'}`}>
        <Radio className="w-3.5 h-3.5" />
        <span className="text-[12px] font-semibold">Streaming</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide bg-prometheus-yellow/15 text-prometheus-yellow border border-prometheus-yellow/30 px-1.5 py-0.5 rounded">
          Not ready
        </span>
      </div>
    </div>
  );
}
