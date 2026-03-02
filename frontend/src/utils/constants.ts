// In production, VITE_API_URL points to the Render backend (e.g. https://tripcraft-api.onrender.com)
// In dev, it's empty so requests go through Vite proxy to localhost:8000
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
export const API_BASE = `${API_BASE_URL}/api`;

export const DAY_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
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
