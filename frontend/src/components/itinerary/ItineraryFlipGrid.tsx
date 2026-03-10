import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DayPlan } from '../../types/itinerary';
import { formatCurrency } from '../../utils/formatters';
import { useChatStore } from '../../store/chatStore';
import DayFlipCard from './DayFlipCard';
import DayDetailModal from './DayDetailModal';

interface Props {
  itinerary: DayPlan[];
  destinationInfo?: string;
  onViewDayOnMap?: (dayIdx: number) => void;
}

const containerStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardEntrance = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

export default function ItineraryFlipGrid({ itinerary, destinationInfo, onViewDayOnMap }: Props) {
  const hasAnimated = useRef(false);
  const shouldAnimate = !hasAnimated.current;
  const [expandedDayIdx, setExpandedDayIdx] = useState<number | null>(null);
  const cc = useChatStore((s) => s.currencyInfo.code);

  if (shouldAnimate && itinerary.length > 0) {
    hasAnimated.current = true;
  }

  const totalCost = itinerary.reduce((sum, d) => sum + (d.total_cost_usd || 0), 0);
  const totalActivities = itinerary.reduce((sum, day) => {
    const activities = Array.isArray(day.activities) ? day.activities : [];
    return sum + activities.length;
  }, 0);

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      {/* Trip summary header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Your Itinerary
          </h2>
          {destinationInfo && (
            <p className="text-sm mt-1 max-w-xl line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {destinationInfo}
            </p>
          )}
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Days</p>
              <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {itinerary.length}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Activities</p>
              <p className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                {totalActivities}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Budget</p>
              <p className="font-bold text-lg gradient-text">
                {formatCurrency(totalCost, cc)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flip card grid */}
      <motion.div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        variants={containerStagger}
        initial={shouldAnimate ? 'hidden' : false}
        animate="show"
      >
        {itinerary.map((day, idx) => (
          <motion.div
            key={day.day_number}
            variants={cardEntrance}
          >
            <DayFlipCard
              day={day}
              index={idx}
              onViewOnMap={onViewDayOnMap ? () => onViewDayOnMap(idx) : undefined}
              onExpand={() => setExpandedDayIdx(idx)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Expanded day detail modal */}
      <AnimatePresence>
        {expandedDayIdx !== null && itinerary[expandedDayIdx] && (
          <DayDetailModal
            day={itinerary[expandedDayIdx]}
            index={expandedDayIdx}
            onClose={() => setExpandedDayIdx(null)}
            onViewOnMap={onViewDayOnMap ? () => {
              setExpandedDayIdx(null);
              onViewDayOnMap(expandedDayIdx);
            } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
