import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  selectedDay: number | null;
  chatOpen: boolean;
  selectedActivity: { dayIdx: number; actIdx: number } | null;
  theme: Theme;

  setSelectedDay: (day: number | null) => void;
  setChatOpen: (open: boolean) => void;
  setSelectedActivity: (a: { dayIdx: number; actIdx: number } | null) => void;
  setTheme: (theme: Theme) => void;
}

const getStoredTheme = (): Theme => {
  const stored = localStorage.getItem('tripcraft-theme');
  if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  return 'system';
};

export const useUIStore = create<UIState>((set) => ({
  selectedDay: null,
  chatOpen: true,
  selectedActivity: null,
  theme: getStoredTheme(),

  setSelectedDay: (day) => set({ selectedDay: day }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setSelectedActivity: (a) => set({ selectedActivity: a }),
  setTheme: (theme) => {
    localStorage.setItem('tripcraft-theme', theme);
    set({ theme });
  },
}));
