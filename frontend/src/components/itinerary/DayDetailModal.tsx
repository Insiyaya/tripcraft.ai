import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, MapPin, DollarSign, Sun, Star, Map } from 'lucide-react';
import type { DayPlan } from '../../types/itinerary';
import { DAY_COLORS } from '../../utils/constants';
import { formatDate, formatCurrency, formatDuration } from '../../utils/formatters';
import { useChatStore } from '../../store/chatStore';
import { cn } from '../../lib/utils';

interface Props {
  day: DayPlan;
  index: number;
  onClose: () => void;
  onViewOnMap?: () => void;
}

export default function DayDetailModal({ day, index, onClose, onViewOnMap }: Props) {
  const color = DAY_COLORS[index % DAY_COLORS.length];
  const cc = useChatStore((s) => s.currencyInfo.code);
  const activities = Array.isArray(day.activities) ? day.activities : [];
  const travelTimes = Array.isArray(day.travel_times_min) ? day.travel_times_min : [];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const totalHours = activities.reduce((s, a) => s + a.estimated_duration_hrs, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-full max-w-2xl max-h-[85vh] rounded-2xl border overflow-hidden flex flex-col',
          'shadow-2xl',
        )}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Header */}
        <div
          className="p-5 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-xl text-white font-bold text-lg"
                style={{ backgroundColor: color }}
              >
                Day {day.day_number}
              </div>
              <div>
                <p className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
                  {formatDate(day.date)}
                </p>
                {day.weather_summary && (
                  <div className="flex items-center gap-1.5 mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <Sun className="w-3.5 h-3.5" style={{ color: '#F59E0B' }} />
                    <span>{day.weather_summary}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-5 mt-4">
            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <MapPin className="w-4 h-4" style={{ color }} />
              <span className="font-medium">{activities.length} activities</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <Clock className="w-4 h-4" style={{ color }} />
              <span className="font-medium">{formatDuration(totalHours)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              <DollarSign className="w-4 h-4" style={{ color }} />
              <span>{formatCurrency(day.total_cost_usd || 0, cc)}</span>
            </div>
            {onViewOnMap && (
              <button
                onClick={onViewOnMap}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}
              >
                <Map className="w-3.5 h-3.5" />
                View on Map
              </button>
            )}
          </div>
        </div>

        {/* Activity list */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {activities.map((activity, actIdx) => (
            <div key={actIdx}>
              <div
                className="rounded-xl border p-4 glass"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: color }}
                  >
                    {actIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base" style={{ color: 'var(--color-text-primary)' }}>
                      {activity.name}
                    </h4>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {activity.start_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.start_time} - {activity.end_time}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(activity.estimated_duration_hrs)}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(activity.cost_estimate_usd, cc)}
                      </span>
                      {activity.rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {activity.rating.toFixed(1)}
                        </span>
                      )}
                      {activity.category && (
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide"
                          style={{ backgroundColor: 'var(--color-surface-tertiary)', color: 'var(--color-text-muted)' }}
                        >
                          {activity.category}
                        </span>
                      )}
                    </div>
                    {activity.description && (
                      <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {activity.description}
                      </p>
                    )}
                    {activity.opening_hours && (
                      <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
                        Hours: {activity.opening_hours}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {actIdx < activities.length - 1 && travelTimes[actIdx] != null && travelTimes[actIdx] > 0 && (
                <div className="flex items-center justify-center py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <div className="h-4 w-px mr-2" style={{ backgroundColor: 'var(--color-border)' }} />
                  {travelTimes[actIdx]} min travel
                  <div className="h-4 w-px ml-2" style={{ backgroundColor: 'var(--color-border)' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
