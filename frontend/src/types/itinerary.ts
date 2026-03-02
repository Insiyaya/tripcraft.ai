export interface Activity {
  name: string;
  category: string;
  lat: number;
  lng: number;
  estimated_duration_hrs: number;
  cost_estimate_usd: number;
  opening_hours: string;
  rating: number;
  description: string;
  start_time: string;
  end_time: string;
}

export interface DayPlan {
  day_number: number;
  date: string;
  activities: Activity[];
  travel_times_min: number[];
  weather_summary: string;
  total_cost_usd: number;
}

export interface Itinerary {
  _id: string;
  trip_id: string;
  version: number;
  destination_info: string;
  currency: { code: string; rate_to_usd: number };
  weather_forecast: WeatherDay[];
  days: DayPlan[];
  total_cost_usd: number;
}

export interface WeatherDay {
  date: string;
  temp_max: number;
  temp_min: number;
  precipitation: number;
  weathercode: number;
}
