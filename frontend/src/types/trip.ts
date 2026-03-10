export interface Trip {
  _id: string;
  origin?: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_usd: number;
  interests: string[];
  travelers: number;
  accommodation_area: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TripCreate {
  origin: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_usd: number;
  currency?: string;
  interests: string[];
  travelers: number;
  accommodation_area: string;
}
