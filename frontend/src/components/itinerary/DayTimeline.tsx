import { motion } from 'framer-motion';
import { Footprints } from 'lucide-react';
import type { DayPlan } from '../../types/itinerary';
import { DAY_COLORS } from '../../utils/constants';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { useChatStore } from '../../store/chatStore';
import ActivityCard from './ActivityCard';
import { useUIStore } from '../../store/uiStore';

const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeIn = {
  hidden: { opacity: 0, x: -8 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

interface Props {
  day: DayPlan;
}

export default function DayTimeline({ day }: Props) {
  const color = DAY_COLORS[(day.day_number - 1) % DAY_COLORS.length];
  const setSelectedActivity = useUIStore((s) => s.setSelectedActivity);
  const { code: cc, rate_to_usd: rate } = useChatStore((s) => s.currencyInfo);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Day {day.day_number}
          </h3>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {formatDate(day.date)}
          </span>
        </div>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {formatCurrency(day.total_cost_usd, cc, rate)}
        </span>
      </div>

      {day.weather_summary && (
        <div className="text-xs px-2 py-1 rounded"
          style={{
            backgroundColor: 'var(--color-surface-tertiary)',
            color: 'var(--color-text-secondary)',
          }}>
          {day.weather_summary}
        </div>
      )}

      <motion.div
        className="space-y-2 pl-1 border-l-2 ml-1"
        style={{ borderColor: color }}
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        {day.activities.map((activity, idx) => (
          <motion.div key={idx} className="ml-3" variants={fadeIn}>
            <ActivityCard
              activity={activity}
              index={idx + 1}
              color={color}
              onClick={() =>
                setSelectedActivity({ dayIdx: day.day_number - 1, actIdx: idx })
              }
            />
            {idx < day.travel_times_min.length && (
              <div className="flex items-center gap-1 text-xs py-1 pl-11"
                style={{ color: 'var(--color-text-muted)' }}>
                <Footprints className="w-3 h-3" />
                {day.travel_times_min[idx]} min travel
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
