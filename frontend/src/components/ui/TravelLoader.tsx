import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import type { AgentPhase } from '../../types/chat';

interface Props {
  phase?: AgentPhase;
}

const PHASE_LABELS: Record<string, string> = {
  research_destination: 'Researching destination',
  fetch_external_data: 'Fetching weather & local data',
  plan_itinerary: 'Crafting your itinerary',
  validate_itinerary: 'Validating activities',
  optimize_route: 'Optimizing your route',
};

const PHASE_ORDER = [
  'research_destination',
  'fetch_external_data',
  'plan_itinerary',
  'validate_itinerary',
  'optimize_route',
];

const TRAVEL_FACTS = [
  "France is the most visited country in the world, with over 89 million tourists annually.",
  "Japan has more than 6,800 islands, but most people live on just four of them.",
  "Iceland has no mosquitoes - one of the few habitable places on Earth without them.",
  "The Great Wall of China is not visible from space with the naked eye - that's a myth!",
  "Australia is wider than the Moon. The Moon is 3,400 km across, Australia is 4,000 km.",
  "In Switzerland, it's illegal to own just one guinea pig - they get lonely!",
  "The shortest commercial flight in the world lasts just 57 seconds (Westray to Papa Westray).",
  "Venice is built on 118 small islands connected by over 400 bridges.",
  "There's a town in Norway called Hell, and yes, it freezes over in winter.",
  "Singapore has the world's first night zoo, open only after dark.",
  "Costa Rica abolished its army in 1948 and redirected funds to education and healthcare.",
  "The Eiffel Tower grows about 6 inches in summer due to thermal expansion of the iron.",
  "New Zealand was the first country to give women the right to vote in 1893.",
  "There are more saunas than cars in Finland.",
  "The longest place name in the world is in New Zealand: Taumatawhakatangihanga­koauauotamateaturipukakapiki­maungahoronukupokaiwhenuakitanatahu.",
  "Monaco is smaller than Central Park in New York City.",
  "Canada has the longest coastline of any country at 202,080 km.",
  "In Colombia, it's a tradition to carry an empty suitcase around the block on New Year's Eve for good travel luck.",
  "The Dead Sea is so salty you can float on it without any effort.",
  "Bhutan measures Gross National Happiness instead of GDP.",
  "Portugal decriminalized all drugs in 2001, focusing on treatment over punishment.",
  "The Amazon Rainforest produces 20% of the world's oxygen.",
  "Dubai's police fleet includes Lamborghinis, Ferraris, and Bentleys.",
  "In Thailand, it's considered disrespectful to step on money because the king's face is on it.",
];

const TRAVEL_TIPS = [
  "Pack a portable charger - you'll thank yourself later!",
  "Always keep digital copies of your passport and important docs.",
  "Learn 'hello', 'thank you', and 'sorry' in the local language.",
  "Roll your clothes instead of folding - saves space and reduces wrinkles.",
  "Book flights on Tuesdays - historically the cheapest day.",
  "Use a VPN on public Wi-Fi to protect your data while traveling.",
  "Carry a reusable water bottle - saves money and the environment.",
  "Take a photo of your hotel address in the local language for taxi drivers.",
];

export default function TravelLoader({ phase }: Props) {
  const currentPhaseIdx = PHASE_ORDER.indexOf(phase || '');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-6 max-w-lg mx-auto px-4"
    >
      {/* SVG Animation: Plane flying along a curved path */}
      <div className="relative w-64 h-40">
        <svg viewBox="0 0 280 160" fill="none" className="w-full h-full">
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
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
          >
            <circle cx="30" cy="120" r="6" fill="var(--color-accent)" />
            <circle cx="30" cy="120" r="3" fill="white" />
            <motion.circle
              cx="30" cy="120" r="6"
              stroke="var(--color-accent)" strokeWidth="2" fill="none"
              initial={{ r: 6, opacity: 0.6 }}
              animate={{ r: 16, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.g>
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.4, type: 'spring' }}
          >
            <circle cx="250" cy="40" r="6" fill="#10b981" />
            <circle cx="250" cy="40" r="3" fill="white" />
            <motion.circle
              cx="250" cy="40" r="6"
              stroke="#10b981" strokeWidth="2" fill="none"
              initial={{ r: 6, opacity: 0.6 }}
              animate={{ r: 16, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.75 }}
            />
          </motion.g>
          <motion.g
            initial={{ offsetDistance: '0%' }}
            animate={{ offsetDistance: '100%' }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            style={{
              offsetPath: 'path("M 30 120 Q 80 20, 140 70 Q 200 120, 250 40")',
              offsetRotate: 'auto',
            }}
          >
            <g transform="translate(-10, -10) scale(0.8)">
              <path
                d="M12 2L4 12l1.5 1L10 11v6l-2 2v1l4-1.5L16 20v-1l-2-2v-6l4.5 2L20 12z"
                fill="var(--color-accent)"
                stroke="var(--color-surface)"
                strokeWidth="0.5"
              />
            </g>
          </motion.g>
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
          >
            <ellipse cx="90" cy="35" rx="18" ry="8" fill="var(--color-text-muted)" opacity="0.15" />
            <ellipse cx="100" cy="30" rx="14" ry="7" fill="var(--color-text-muted)" opacity="0.1" />
          </motion.g>
        </svg>
      </div>

      {/* Phase progress steps */}
      <div className="w-full flex items-center gap-1">
        {PHASE_ORDER.map((p, i) => {
          const isDone = currentPhaseIdx > i;
          const isActive = currentPhaseIdx === i;
          return (
            <div key={p} className="flex-1 flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'h-1.5 w-full rounded-full transition-all duration-500',
                  isDone && 'bg-emerald-500',
                  isActive && 'bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse',
                  !isDone && !isActive && 'bg-gray-200 dark:bg-gray-700',
                )}
              />
            </div>
          );
        })}
      </div>

      {/* Current phase label */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className="font-semibold text-base"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {PHASE_LABELS[phase || ''] || 'Preparing your trip...'}
        </motion.p>
      </AnimatePresence>

      {/* Rotating fun facts & tips */}
      <div
        className="w-full rounded-xl p-4 text-center min-h-[80px] flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-surface-tertiary)' }}
      >
        <RotatingFacts />
      </div>
    </motion.div>
  );
}

function RotatingFacts() {
  const allContent = [
    ...TRAVEL_FACTS.map((f) => ({ text: f, type: 'fact' as const })),
    ...TRAVEL_TIPS.map((t) => ({ text: t, type: 'tip' as const })),
  ];

  const [index, setIndex] = useState(() => Math.floor(Math.random() * allContent.length));

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % allContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allContent.length]);

  const item = allContent[index];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-1.5"
      >
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
            item.type === 'fact'
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          )}
        >
          {item.type === 'fact' ? 'Did you know?' : 'Travel tip'}
        </span>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          {item.text}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
