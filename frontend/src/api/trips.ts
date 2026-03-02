import api from './client';
import type { Trip, TripCreate } from '../types/trip';
import type { Itinerary } from '../types/itinerary';

export async function fetchTrips(): Promise<Trip[]> {
  const { data } = await api.get('/trips');
  return data;
}

export async function fetchTrip(id: string): Promise<Trip> {
  const { data } = await api.get(`/trips/${id}`);
  return data;
}

export async function createTrip(trip: TripCreate): Promise<Trip> {
  const { data } = await api.post('/trips', trip);
  return data;
}

export async function updateTrip(id: string, trip: Partial<TripCreate>): Promise<Trip> {
  const { data } = await api.put(`/trips/${id}`, trip);
  return data;
}

export async function deleteTrip(id: string): Promise<void> {
  await api.delete(`/trips/${id}`);
}

export async function fetchItinerary(tripId: string): Promise<Itinerary> {
  const { data } = await api.get(`/trips/${tripId}/itinerary`);
  return data;
}
