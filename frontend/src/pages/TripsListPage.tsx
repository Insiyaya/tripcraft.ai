import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Plus, Loader2 } from 'lucide-react';
import { useTrips, useDeleteTrip } from '../hooks/useTrips';
import TripCard from '../components/trip/TripCard';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function TripsListPage() {
  const { data: trips, isLoading } = useTrips();
  const deleteMutation = useDeleteTrip();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full gap-2"
        style={{ color: 'var(--color-text-muted)' }}>
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading trips...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          My Trips
        </h2>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/planner"
            className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </Link>
        </motion.div>
      </div>

      {!trips?.length ? (
        <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No trips yet</p>
          <p className="text-sm">Start planning your first adventure!</p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {trips.map((trip) => (
            <motion.div key={trip._id} variants={fadeUp}>
              <TripCard
                trip={trip}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
