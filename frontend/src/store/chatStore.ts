import { create } from 'zustand';
import type { ChatMessage, AgentPhase } from '../types/chat';
import type { DayPlan } from '../types/itinerary';

interface CurrencyInfo {
  code: string;
  rate_to_usd: number;
}

interface ChatState {
  messages: ChatMessage[];
  currentPhase: AgentPhase;
  isStreaming: boolean;
  streamingText: string;
  itinerary: DayPlan[];
  destinationInfo: string;
  currencyInfo: CurrencyInfo;

  addMessage: (msg: ChatMessage) => void;
  setCurrentPhase: (phase: AgentPhase) => void;
  setIsStreaming: (v: boolean) => void;
  appendStreamingToken: (token: string) => void;
  clearStreamingText: () => void;
  setItinerary: (days: DayPlan[]) => void;
  setDestinationInfo: (info: string) => void;
  setCurrencyInfo: (info: CurrencyInfo) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentPhase: 'idle',
  isStreaming: false,
  streamingText: '',
  itinerary: [],
  destinationInfo: '',
  currencyInfo: { code: 'USD', rate_to_usd: 1 },

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setIsStreaming: (v) => set({ isStreaming: v }),

  appendStreamingToken: (token) =>
    set((s) => ({ streamingText: s.streamingText + token })),

  clearStreamingText: () => set({ streamingText: '' }),

  setItinerary: (days) => set({ itinerary: days }),
  setDestinationInfo: (info) => set({ destinationInfo: info }),
  setCurrencyInfo: (info) => set({ currencyInfo: info }),

  reset: () =>
    set({
      messages: [],
      currentPhase: 'idle',
      isStreaming: false,
      streamingText: '',
      itinerary: [],
      destinationInfo: '',
      currencyInfo: { code: 'USD', rate_to_usd: 1 },
    }),
}));
