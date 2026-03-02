import { motion, AnimatePresence } from 'framer-motion';
import type { DayPlan } from '../../types/itinerary';
import { DAY_COLORS } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';
import DayTimeline from './DayTimeline';
import { useUIStore } from '../../store/uiStore';

interface Props {
  itinerary: DayPlan[];
  destinationInfo?: string;
}

export default function ItineraryView({ itinerary, destinationInfo }: Props) {
  const selectedDay = useUIStore((s) => s.selectedDay);
  const setSelectedDay = useUIStore((s) => s.setSelectedDay);

  const totalCost = itinerary.reduce((sum, d) => sum + (d.total_cost_usd || 0), 0);

  if (!itinerary.length) {
    return (
      <div className="flex items-center justify-center h-full text-sm"
        style={{ color: 'var(--color-text-muted)' }}>
        Generate an itinerary to see it here
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {destinationInfo && (
        <div className="p-3 text-sm rounded-lg mb-3"
          style={{
            backgroundColor: 'var(--color-accent-light)',
            color: 'var(--color-accent)',
          }}>
          {destinationInfo}
        </div>
      )}

      {/* Day tabs */}
      <div className="flex gap-1 mb-3 overflow-x-auto pb-1 relative">
        <button
          onClick={() => setSelectedDay(null)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all relative"
          style={{
            backgroundColor: selectedDay === null ? 'var(--color-text-primary)' : 'var(--color-surface-tertiary)',
            color: selectedDay === null ? 'var(--color-surface)' : 'var(--color-text-secondary)',
          }}
        >
          All Days
        </button>
        {itinerary.map((day, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedDay(idx)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: selectedDay === idx
                ? DAY_COLORS[idx % DAY_COLORS.length]
                : 'var(--color-surface-tertiary)',
              color: selectedDay === idx ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            Day {day.day_number}
          </button>
        ))}
      </div>

      {/* Cost summary */}
      <div className="text-xs mb-3 flex justify-between" style={{ color: 'var(--color-text-muted)' }}>
        <span>Total estimated cost:</span>
        <span className="font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          {formatCurrency(totalCost)}
        </span>
      </div>

      {/* Day timelines */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedDay ?? 'all'}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {(selectedDay !== null ? [itinerary[selectedDay]] : itinerary).map(
              (day) => (
                <DayTimeline key={day.day_number} day={day} />
              )
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
