import { create } from 'zustand';
import axios from 'axios';
import { API_BASE } from '../utils/constants';

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoaded: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

const TOKEN_KEY = 'tripcraft_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isLoaded: false,

  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ user, token, isLoaded: true });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, isLoaded: true });
  },

  initialize: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoaded: true });
      return;
    }

    try {
      const resp = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({
        user: {
          id: resp.data.id || resp.data._id,
          name: resp.data.name,
          email: resp.data.email,
          picture: resp.data.picture,
        },
        isLoaded: true,
      });
    } catch {
      // Token expired or invalid — clear it
      localStorage.removeItem(TOKEN_KEY);
      set({ user: null, token: null, isLoaded: true });
    }
  },
}));
