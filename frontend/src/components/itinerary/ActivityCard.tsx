import { motion } from 'framer-motion';
import {
  Landmark, UtensilsCrossed, TreePine, Moon, ShoppingBag, MapPin,
  Theater, Mountain, Palette,
} from 'lucide-react';
import type { Activity } from '../../types/itinerary';
import { formatDuration, formatCurrency } from '../../utils/formatters';

interface Props {
  activity: Activity;
  index: number;
  color: string;
  onClick?: () => void;
}

const CATEGORY_ICON: Record<string, typeof Landmark> = {
  museum: Landmark,
  restaurant: UtensilsCrossed,
  outdoor: TreePine,
  nightlife: Moon,
  shopping: ShoppingBag,
  landmark: MapPin,
  cultural: Theater,
  adventure: Mountain,
  food: UtensilsCrossed,
  nature: TreePine,
  art: Palette,
};

export default function ActivityCard({ activity, index, color, onClick }: Props) {
  const Icon = CATEGORY_ICON[activity.category] || MapPin;

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
      transition={{ duration: 0.15 }}
      className="flex gap-3 p-3 rounded-lg border cursor-pointer glass"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: color }}
      >
        {index}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 shrink-0" style={{ color }} />
          <h4 className="font-medium text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
            {activity.name}
          </h4>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {activity.start_time && (
            <span>{activity.start_time} - {activity.end_time}</span>
          )}
          <span>{formatDuration(activity.estimated_duration_hrs)}</span>
          <span>{formatCurrency(activity.cost_estimate_usd)}</span>
        </div>

        {activity.description && (
          <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
            {activity.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
