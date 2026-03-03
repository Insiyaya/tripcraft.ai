import { useState } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Clock, MapPin, DollarSign, Sun, Map } from 'lucide-react';
import type { DayPlan } from '../../types/itinerary';
import { DAY_COLORS } from '../../utils/constants';
import { formatDate, formatCurrency, formatDuration } from '../../utils/formatters';
import ActivityCard from './ActivityCard';

interface Props {
  day: DayPlan;
  index: number;
  onViewOnMap?: () => void;
}

export default function DayFlipCard({ day, index, onViewOnMap }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const color = DAY_COLORS[index % DAY_COLORS.length];
  const activities = Array.isArray(day.activities) ? day.activities : [];
  const travelTimes = Array.isArray(day.travel_times_min) ? day.travel_times_min : [];

  return (
    <div
      className="cursor-pointer"
      style={{ perspective: '1200px', minHeight: '320px' }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', height: '320px' }}
      >
        {/* ===== FRONT FACE ===== */}
        <div
          className="absolute inset-0 rounded-2xl border overflow-hidden glass"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderColor: 'var(--color-border)',
            borderLeft: `4px solid ${color}`,
          }}
        >
          <div className="h-full flex flex-col p-5">
            {/* Day badge */}
            <div className="flex items-center justify-between mb-4">
              <div
                className="px-4 py-2 rounded-xl text-white font-bold text-lg"
                style={{ backgroundColor: color }}
              >
                Day {day.day_number}
              </div>
              <RotateCcw className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
            </div>

            {/* Date */}
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              {formatDate(day.date)}
            </p>

            {/* Weather */}
            {day.weather_summary && (
              <div className="flex items-center gap-2 mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Sun className="w-4 h-4" style={{ color: '#F59E0B' }} />
                <span className="line-clamp-1">{day.weather_summary}</span>
              </div>
            )}

            {/* Stats */}
            <div className="mt-auto space-y-2.5">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <MapPin className="w-4 h-4" style={{ color }} />
                <span>{activities.length} activities</span>
              </div>

              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <Clock className="w-4 h-4" style={{ color }} />
                <span>
                  {activities.length > 0 && activities[0].start_time
                    ? `${activities[0].start_time} - ${activities[activities.length - 1].end_time}`
                    : formatDuration(activities.reduce((sum, activity) => sum + activity.estimated_duration_hrs, 0))}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                <DollarSign className="w-4 h-4" style={{ color }} />
                <span>{formatCurrency(day.total_cost_usd || 0)}</span>
              </div>
            </div>

            {/* Flip hint */}
            <p className="text-xs mt-3 text-center" style={{ color: 'var(--color-text-muted)' }}>
              Click to see activities
            </p>
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div
          className="absolute inset-0 rounded-2xl border overflow-hidden glass"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderColor: 'var(--color-border)',
            borderLeft: `4px solid ${color}`,
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="h-full flex flex-col">
            {/* Back header */}
            <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2">
                <div
                  className="px-2 py-1 rounded-lg text-white text-xs font-bold"
                  style={{ backgroundColor: color }}
                >
                  Day {day.day_number}
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {formatDate(day.date)}
                </span>
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {formatCurrency(day.total_cost_usd || 0)}
              </span>
            </div>

            {/* Scrollable activity list */}
            <div
              className="flex-1 overflow-y-auto p-3 space-y-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
              onClick={(e) => e.stopPropagation()}
            >
              {activities.map((activity, actIdx) => (
                <div key={actIdx}>
                  <ActivityCard
                    activity={activity}
                    index={actIdx + 1}
                    color={color}
                  />
                  {actIdx < activities.length - 1 && travelTimes[actIdx] && (
                    <div className="flex items-center justify-center py-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {travelTimes[actIdx]} min travel
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* View on Map button */}
            {onViewOnMap && (
              <div className="p-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewOnMap();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'var(--color-accent-light)',
                    color: 'var(--color-accent)',
                  }}
                >
                  <Map className="w-3.5 h-3.5" />
                  View on Map
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
