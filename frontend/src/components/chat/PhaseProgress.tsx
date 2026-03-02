import { Search, CloudDownload, CalendarDays, ShieldCheck, Route, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { AgentPhase } from '../../types/chat';
import { PHASE_LABELS } from '../../utils/constants';

const PHASES: { key: AgentPhase; icon: typeof Search; label: string }[] = [
  { key: 'research_destination', icon: Search, label: 'Research' },
  { key: 'fetch_external_data', icon: CloudDownload, label: 'Data' },
  { key: 'plan_itinerary', icon: CalendarDays, label: 'Plan' },
  { key: 'validate_itinerary', icon: ShieldCheck, label: 'Validate' },
  { key: 'optimize_route', icon: Route, label: 'Optimize' },
];

interface Props {
  currentPhase: AgentPhase;
}

export default function PhaseProgress({ currentPhase }: Props) {
  if (currentPhase === 'idle' || currentPhase === 'handle_chat') return null;

  const currentIdx = PHASES.findIndex((p) => p.key === currentPhase);
  const progress = currentPhase === 'complete'
    ? 100
    : currentIdx >= 0
    ? ((currentIdx + 0.5) / PHASES.length) * 100
    : 0;

  return (
    <div className="px-3 py-2.5 mx-3 mt-2 rounded-lg"
      style={{ backgroundColor: 'var(--color-accent-light)' }}>
      {/* Progress bar */}
      <div className="h-1 rounded-full mb-2.5 overflow-hidden"
        style={{ backgroundColor: 'var(--color-border)' }}>
        <motion.div
          className="h-full rounded-full gradient-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Phase icons */}
      <div className="flex items-center justify-between">
        {PHASES.map(({ key, icon: Icon, label }, idx) => {
          const isActive = idx === currentIdx;
          const isDone = idx < currentIdx || currentPhase === 'complete';

          return (
            <div key={key} className="flex flex-col items-center gap-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: isDone
                    ? '#10b981'
                    : isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-surface-tertiary)',
                  color: isDone || isActive ? '#fff' : 'var(--color-text-muted)',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                }}
              >
                {isDone ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className="text-[10px] font-medium" style={{
                color: isDone || isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Status text */}
      <p className="text-xs font-medium mt-2 text-center" style={{ color: 'var(--color-accent)' }}>
        {currentPhase === 'complete'
          ? 'Done!'
          : PHASE_LABELS[currentPhase] || currentPhase}
      </p>
    </div>
  );
}
