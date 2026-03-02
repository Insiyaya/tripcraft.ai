import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrips, fetchTrip, createTrip, deleteTrip } from '../api/trips';
import type { TripCreate } from '../types/trip';

export function useTrips() {
  return useQuery({ queryKey: ['trips'], queryFn: fetchTrips });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trip', id],
    queryFn: () => fetchTrip(id!),
    enabled: !!id,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (trip: TripCreate) => createTrip(trip),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTrip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trips'] }),
  });
}
