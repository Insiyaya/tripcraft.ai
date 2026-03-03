import { useAuthStore } from '../store/authStore';

export async function getAuthToken(): Promise<string | null> {
  return useAuthStore.getState().token;
}
