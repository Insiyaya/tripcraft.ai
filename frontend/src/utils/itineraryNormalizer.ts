import type { Activity, DayPlan } from '../types/itinerary';

const toString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const toFiniteNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const toPositiveInt = (value: unknown, fallback: number): number => {
  const parsed = Math.trunc(toFiniteNumber(value, fallback));
  return parsed > 0 ? parsed : fallback;
};

const toActivity = (raw: unknown): Activity => {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  return {
    name: toString(obj.name, 'Untitled activity'),
    category: toString(obj.category, 'landmark').toLowerCase(),
    lat: toFiniteNumber(obj.lat, 0),
    lng: toFiniteNumber(obj.lng, 0),
    estimated_duration_hrs: toFiniteNumber(obj.estimated_duration_hrs, 1),
    cost_estimate_usd: toFiniteNumber(obj.cost_estimate_usd, 0),
    opening_hours: toString(obj.opening_hours),
    rating: toFiniteNumber(obj.rating, 0),
    description: toString(obj.description),
    start_time: toString(obj.start_time),
    end_time: toString(obj.end_time),
  };
};

const toDayPlan = (raw: unknown, idx: number): DayPlan => {
  const obj = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const activitiesRaw = Array.isArray(obj.activities) ? obj.activities : [];
  const activities = activitiesRaw.map(toActivity);
  const defaultCost = activities.reduce((sum, activity) => sum + activity.cost_estimate_usd, 0);
  const travelTimesRaw = Array.isArray(obj.travel_times_min) ? obj.travel_times_min : [];
  const travelTimes = travelTimesRaw.map((value) =>
    Math.max(0, Math.trunc(toFiniteNumber(value, 0)))
  );

  return {
    day_number: toPositiveInt(obj.day_number, idx + 1),
    date: toString(obj.date),
    activities,
    travel_times_min: travelTimes,
    weather_summary: toString(obj.weather_summary),
    total_cost_usd: toFiniteNumber(obj.total_cost_usd, defaultCost),
  };
};

export function normalizeItinerary(raw: unknown): DayPlan[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((day, idx) => toDayPlan(day, idx));
}
