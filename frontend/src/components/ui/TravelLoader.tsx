import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const TIPS = [
  'Researching top attractions...',
  'Checking weather forecasts...',
  'Planning day-by-day activities...',
  'Optimizing your route...',
  'Calculating travel times...',
];

export default function TravelLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6"
    >
      {/* SVG Animation: Plane flying along a curved path with pins */}
      <div className="relative w-64 h-40">
        <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
          {/* Dotted flight path */}
          <motion.path
            d="M 30 120 Q 80 20, 140 70 Q 200 120, 250 40"
            stroke="var(--color-text-muted)"
            strokeWidth="2"
            strokeDasharray="6 4"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeInOut' }}
          />

          {/* Location Pin A (origin) */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
          >
            <circle cx="30" cy="120" r="6" fill="var(--color-accent)" />
            <circle cx="30" cy="120" r="3" fill="white" />
            {/* Pulse ring */}
            <motion.circle
              cx="30" cy="120" r="6"
              stroke="var(--color-accent)"
              strokeWidth="2"
              fill="none"
              initial={{ r: 6, opacity: 0.6 }}
              animate={{ r: 16, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.g>

          {/* Location Pin B (destination) */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.4, type: 'spring' }}
          >
            <circle cx="250" cy="40" r="6" fill="#10b981" />
            <circle cx="250" cy="40" r="3" fill="white" />
            <motion.circle
              cx="250" cy="40" r="6"
              stroke="#10b981"
              strokeWidth="2"
              fill="none"
              initial={{ r: 6, opacity: 0.6 }}
              animate={{ r: 16, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
            />
          </motion.g>

          {/* Plane moving along the path */}
          <motion.g
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{
              offsetPath: 'path("M 30 120 Q 80 20, 140 70 Q 200 120, 250 40")',
              offsetRotate: 'auto',
            }}
          >
            {/* Plane icon */}
            <g transform="translate(-10, -10) scale(0.8)">
              <path
                d="M12 2L4 12l1.5 1L10 11v6l-2 2v1l4-1.5L16 20v-1l-2-2v-6l4.5 2L20 12z"
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth="0.5"
              />
            </g>
          </motion.g>

          {/* Small cloud puffs */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
          >
            <ellipse cx="90" cy="35" rx="18" ry="8" fill="var(--color-text-muted)" opacity="0.15" />
            <ellipse cx="100" cy="30" rx="14" ry="7" fill="var(--color-text-muted)" opacity="0.1" />
          </motion.g>
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0] }}
            transition={{ repeat: Infinity, duration: 5, delay: 1.5 }}
          >
            <ellipse cx="200" cy="85" rx="16" ry="7" fill="var(--color-text-muted)" opacity="0.15" />
            <ellipse cx="210" cy="80" rx="12" ry="6" fill="var(--color-text-muted)" opacity="0.1" />
          </motion.g>
        </svg>
      </div>

      {/* Text */}
      <div className="text-center">
        <p className="font-semibold text-lg" style={{ color: 'var(--color-text-primary)' }}>
          Planning your trip...
        </p>
        <motion.p
          className="text-sm mt-1"
          style={{ color: 'var(--color-text-muted)' }}
          key="tip"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <RotatingTips />
        </motion.p>
      </div>
    </motion.div>
  );
}

function RotatingTips() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % TIPS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.span
      key={index}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      {TIPS[index]}
    </motion.span>
  );
}
