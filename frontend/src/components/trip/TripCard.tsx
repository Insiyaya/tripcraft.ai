import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2, ArrowRight } from 'lucide-react';
import type { Trip } from '../../types/trip';
import { formatDate, countDays } from '../../utils/formatters';

interface Props {
  trip: Trip;
  onDelete?: (id: string) => void;
}

export default function TripCard({ trip, onDelete }: Props) {
  const days = countDays(trip.start_date, trip.end_date);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
      transition={{ duration: 0.2 }}
      className="glass rounded-xl p-5 border"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
          {trip.destination}
        </h3>
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: trip.status === 'planned'
              ? 'rgba(16, 185, 129, 0.1)'
              : trip.status === 'generating'
              ? 'rgba(245, 158, 11, 0.1)'
              : 'var(--color-surface-tertiary)',
            color: trip.status === 'planned'
              ? '#10b981'
              : trip.status === 'generating'
              ? '#f59e0b'
              : 'var(--color-text-muted)',
          }}
        >
          {trip.status}
        </span>
      </div>

      <div className="text-sm space-y-1 mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        <p>
          {formatDate(trip.start_date)} - {formatDate(trip.end_date)} ({days} days)
        </p>
        <p>Budget: ${trip.budget_usd} | {trip.travelers} traveler(s)</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {trip.interests.map((i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-accent-light)',
                color: 'var(--color-accent)',
              }}
            >
              {i}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/planner/${trip._id}`}
          className="flex-1 text-center gradient-primary text-white py-2 rounded-lg text-sm font-medium shadow-sm flex items-center justify-center gap-1.5"
        >
          View Itinerary
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(trip._id)}
            className="px-3 py-2 rounded-lg text-sm transition-colors border"
            style={{
              borderColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
            }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
