import { Check } from 'lucide-react';

const steps = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Blur Faces' },
  { id: 3, label: 'Detect Machines' },
  { id: 4, label: 'Owner Confirms' },
  { id: 5, label: 'Live' },
];

export default function ProgressPipeline({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const isPending = step.id > currentStep;

        return (
          <div key={step.id} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium transition-all duration-300 ${
                isCompleted
                  ? 'bg-prometheus-green text-prometheus-bg'
                  : isCurrent
                  ? 'bg-prometheus-elevated text-prometheus-cream border border-prometheus-border'
                  : 'bg-prometheus-border text-prometheus-secondary'
              }`}
            >
              {isCompleted && <Check className="w-3.5 h-3.5" />}
              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-prometheus-cream animate-pulse" />}
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-6 h-px ${isCompleted ? 'bg-prometheus-green' : 'bg-prometheus-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}