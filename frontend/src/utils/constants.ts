// In production, VITE_API_URL points to the Render backend (e.g. https://tripcraft-api.onrender.com)
// In dev, it's empty so requests go through Vite proxy to localhost:8000
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = `${API_BASE_URL}/api`;

// Optional. Empty means Google sign-in is unavailable and the login page shows
// only the email/password form — it must never block the rest of the app.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Per-day identity colours for map markers, routes, and day badges.
 *
 * Deeper and earthier than the previous set so they sit on butter-yellow
 * surfaces without shouting, while still being told apart at a glance.
 *
 * The order is deliberate and must not be reshuffled casually: these were
 * validated for lightness band, chroma floor, colour-vision-deficiency
 * separation between *adjacent* entries, and contrast against both the light and
 * dark surfaces. Reordering changes which pairs are adjacent and can reintroduce
 * a red/green clash — orange↔olive and crimson↔emerald both failed deuteranopia
 * separation during tuning and had to be pulled apart.
 *
 * Pair with readableInkOn() from utils/color.ts for any label placed on one;
 * a hardcoded white fails on the cyan.
 */
export const DAY_COLORS = [
  '#BE123C', // crimson
  '#13A3C7', // cyan
  '#A16207', // gold
  '#7E22CE', // violet
  '#4D7C0F', // olive
  '#0369A1', // blue
  '#C2410C', // rust
  '#A21CAF', // fuchsia
];

export const INTEREST_OPTIONS = [
  'History', 'Food', 'Nature', 'Art', 'Nightlife',
  'Shopping', 'Adventure', 'Culture', 'Architecture',
  'Photography', 'Music', 'Sports', 'Relaxation',
];

export const PHASE_LABELS: Record<string, string> = {
  research_destination: 'Researching destination...',
  fetch_external_data: 'Fetching weather & data...',
  plan_itinerary: 'Planning your itinerary...',
  validate_itinerary: 'Validating the plan...',
  optimize_route: 'Optimizing routes...',
  handle_chat: 'Processing your request...',
  complete: 'Done!',
};

export const WEATHER_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '🌧️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
};

// Lucide icon name maps (used to look up icons dynamically)
export const CATEGORY_ICONS: Record<string, string> = {
  museum: 'Landmark',
  restaurant: 'UtensilsCrossed',
  outdoor: 'TreePine',
  nightlife: 'Moon',
  shopping: 'ShoppingBag',
  landmark: 'MapPin',
  cultural: 'Theater',
  adventure: 'Mountain',
  food: 'UtensilsCrossed',
  nature: 'TreePine',
  art: 'Palette',
  default: 'MapPin',
};

export const INTEREST_ICONS: Record<string, string> = {
  History: 'Landmark',
  Food: 'UtensilsCrossed',
  Nature: 'TreePine',
  Art: 'Palette',
  Nightlife: 'Moon',
  Shopping: 'ShoppingBag',
  Adventure: 'Mountain',
  Culture: 'Theater',
  Architecture: 'Building2',
  Photography: 'Camera',
  Music: 'Music',
  Sports: 'Dumbbell',
  Relaxation: 'Coffee',
};
