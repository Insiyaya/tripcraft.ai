export interface Trip {
  _id: string;
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
  destination: string;
  start_date: string;
  end_date: string;
  budget_usd: number;
  interests: string[];
  travelers: number;
  accommodation_area: string;
}
