import { useRef } from 'react';
import { motion } from 'framer-motion';
import type { DayPlan } from '../../types/itinerary';
import { formatCurrency } from '../../utils/formatters';
import DayFlipCard from './DayFlipCard';

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

  if (shouldAnimate && itinerary.length > 0) {
    hasAnimated.current = true;
  }

  const totalCost = itinerary.reduce((sum, d) => sum + (d.total_cost_usd || 0), 0);
  const totalActivities = itinerary.reduce((sum, d) => sum + d.activities.length, 0);

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
        <div className="text-right flex-shrink-0 ml-4">
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
                {formatCurrency(totalCost)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Flip card grid */}
      <motion.div
        className="grid gap-5"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
        variants={shouldAnimate ? containerStagger : undefined}
        initial={shouldAnimate ? 'hidden' : false}
        animate={shouldAnimate ? 'show' : undefined}
      >
        {itinerary.map((day, idx) => (
          <motion.div
            key={day.day_number}
            variants={shouldAnimate ? cardEntrance : undefined}
          >
            <DayFlipCard
              day={day}
              index={idx}
              onViewOnMap={onViewDayOnMap ? () => onViewDayOnMap(idx) : undefined}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
