import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, CalendarDays, Route, Plane, MapPin, Sparkles } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

const features = [
  {
    icon: Search,
    title: 'Research',
    desc: 'AI finds top attractions for your interests',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: CalendarDays,
    title: 'Plan',
    desc: 'Day-by-day itinerary with timing & budget',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Route,
    title: 'Optimize',
    desc: 'Routes optimized, shown on interactive map',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export default function HomePage() {
  return (
    <div className="h-full flex items-center justify-center overflow-auto"
      style={{ background: 'linear-gradient(135deg, var(--color-surface-secondary), var(--color-surface))' }}>
      <motion.div
        className="text-center max-w-2xl px-6 py-12"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Icon */}
        <motion.div variants={fadeUp} className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-lg">
              <Plane className="w-10 h-10 text-white" />
            </div>
            <motion.div
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-amber-400 flex items-center justify-center shadow-md"
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl font-bold mb-4"
          style={{ color: 'var(--color-text-primary)' }}
        >
          AI Travel Itinerary <span className="gradient-text">Planner</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fadeUp}
          className="text-lg mb-8 leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Tell us your destination, dates, and interests. Our AI agent will
          research attractions, plan your day-by-day itinerary, validate
          logistics, and optimize your route — all in real-time.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex gap-4 justify-center">
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/planner"
              className="gradient-primary text-white px-8 py-3 rounded-xl font-semibold text-lg inline-flex items-center gap-2 shadow-lg"
            >
              <MapPin className="w-5 h-5" />
              Plan a Trip
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/trips"
              className="px-8 py-3 rounded-xl font-semibold text-lg inline-block border transition-colors"
              style={{
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                borderColor: 'var(--color-border)',
              }}
            >
              My Trips
            </Link>
          </motion.div>
        </motion.div>

        {/* Feature cards */}
        <motion.div variants={fadeUp} className="mt-14 grid grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, desc, gradient }) => (
            <motion.div
              key={title}
              className="glass rounded-xl p-5 text-center"
              whileHover={{ y: -4, boxShadow: 'var(--shadow-lg)' }}
              transition={{ duration: 0.2 }}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mx-auto mb-3 shadow-md`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                {title}
              </h3>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                {desc}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
