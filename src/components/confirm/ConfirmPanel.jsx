import { useState } from 'react';
import { Check } from 'lucide-react';

function getConfidenceColor(c) {
  if (c >= 85) return '#00C896';
  if (c >= 65) return '#F5A623';
  return '#E84545';
}

export default function ConfirmPanel({ machines = [], onConfirmed }) {
  const [confirmed, setConfirmed] = useState({});

  const toggleConfirm = (id) => {
    setConfirmed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const allConfirmed = machines.length > 0 && machines.every((m) => confirmed[m.id]);

  return (
    <div className="h-full flex flex-col bg-prometheus-card rounded-lg border border-prometheus-border">
      <div className="px-5 py-4 border-b border-prometheus-border">
        <h2 className="text-prometheus-cream text-[15px] font-semibold">Confirm Detected Machines</h2>
        <p className="text-prometheus-secondary text-[11px] mt-0.5">
          {Object.values(confirmed).filter(Boolean).length} / {machines.length} confirmed
        </p>
      </div>

      <div className="flex-1 overflow-auto px-4 py-3 space-y-3">
        {machines.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-3 transition-all duration-150 ${
              confirmed[m.id]
                ? 'border-prometheus-green/30 bg-prometheus-green/[0.03]'
                : 'border-prometheus-border bg-prometheus-bg/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <span className="flex-1 text-prometheus-cream text-[13px] font-medium px-3 py-1.5">
                {m.name}
              </span>
              <button
                onClick={() => toggleConfirm(m.id)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all duration-150 ${
                  confirmed[m.id]
                    ? 'bg-prometheus-green text-prometheus-bg'
                    : 'bg-prometheus-border text-prometheus-secondary hover:bg-prometheus-hover'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-prometheus-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${m.confidence}%`,
                    backgroundColor: getConfidenceColor(m.confidence),
                  }}
                />
              </div>
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: getConfidenceColor(m.confidence) }}
              >
                {m.confidence}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-4 border-t border-prometheus-border">
        <button
          onClick={allConfirmed ? onConfirmed : undefined}
          className={`w-full py-3 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
            allConfirmed
              ? 'bg-prometheus-green text-prometheus-bg hover:brightness-110'
              : 'bg-prometheus-green/20 text-prometheus-green/60 cursor-not-allowed'
          }`}
          disabled={!allConfirmed}
        >
          Confirm All & Start Monitoring
        </button>
      </div>
    </div>
  );
}
