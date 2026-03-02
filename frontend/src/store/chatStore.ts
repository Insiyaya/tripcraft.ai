import { create } from 'zustand';
import type { ChatMessage, AgentPhase } from '../types/chat';
import type { DayPlan } from '../types/itinerary';

interface ChatState {
  messages: ChatMessage[];
  currentPhase: AgentPhase;
  isStreaming: boolean;
  streamingText: string;
  itinerary: DayPlan[];
  destinationInfo: string;

  addMessage: (msg: ChatMessage) => void;
  setCurrentPhase: (phase: AgentPhase) => void;
  setIsStreaming: (v: boolean) => void;
  appendStreamingToken: (token: string) => void;
  clearStreamingText: () => void;
  setItinerary: (days: DayPlan[]) => void;
  setDestinationInfo: (info: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentPhase: 'idle',
  isStreaming: false,
  streamingText: '',
  itinerary: [],
  destinationInfo: '',

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setIsStreaming: (v) => set({ isStreaming: v }),

  appendStreamingToken: (token) =>
    set((s) => ({ streamingText: s.streamingText + token })),

  clearStreamingText: () => set({ streamingText: '' }),

  setItinerary: (days) => set({ itinerary: days }),
  setDestinationInfo: (info) => set({ destinationInfo: info }),

  reset: () =>
    set({
      messages: [],
      currentPhase: 'idle',
      isStreaming: false,
      streamingText: '',
      itinerary: [],
      destinationInfo: '',
    }),
}));
