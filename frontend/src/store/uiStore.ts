import { create } from 'zustand';

// The app has a single theme, so there is no theme state here. The previous
// version defaulted to dark and persisted a 'tripcraft-theme' key in
// localStorage; that key is now ignored and harmless.

interface UIState {
  selectedDay: number | null;
  chatOpen: boolean;
  mapOpen: boolean;
  selectedActivity: { dayIdx: number; actIdx: number } | null;

  setSelectedDay: (day: number | null) => void;
  setChatOpen: (open: boolean) => void;
  setMapOpen: (open: boolean) => void;
  setSelectedActivity: (a: { dayIdx: number; actIdx: number } | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDay: null,
  chatOpen: true,
  mapOpen: false,
  selectedActivity: null,

  setSelectedDay: (day) => set({ selectedDay: day }),
  setChatOpen: (open) => set({ chatOpen: open }),
  setMapOpen: (open) => set({ mapOpen: open }),
  setSelectedActivity: (a) => set({ selectedActivity: a }),
}));
