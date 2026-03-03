import api from './client';
import axios from 'axios';

interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

interface MeResponse {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const RETRY_DELAYS_MS = [600, 1200];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function googleLogin(credential: string): Promise<AuthResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { data } = await api.post('/auth/google', { credential });
      // Map _id to id if needed
      if (data.user._id && !data.user.id) {
        data.user.id = data.user._id;
      }
      return data;
    } catch (error) {
      lastError = error;
      const isAxiosError = axios.isAxiosError(error);
      const isTransient = isAxiosError && !error.response;
      const hasRetry = attempt < RETRY_DELAYS_MS.length;

      if (!isTransient || !hasRetry) break;
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  throw lastError;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await api.get('/auth/me');
  if (data._id && !data.id) {
    data.id = data._id;
  }
  return data;
}
