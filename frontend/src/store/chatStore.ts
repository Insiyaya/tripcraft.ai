import { create } from 'zustand';
import type { ChatMessage, AgentPhase } from '../types/chat';
import type { DayPlan } from '../types/itinerary';

interface CurrencyInfo {
  code: string;
  rate_to_usd: number;
}

const USD: CurrencyInfo = { code: 'USD', rate_to_usd: 1 };

/**
 * Accept whatever the API or WebSocket sends and reduce it to something safe to
 * display.
 *
 * The important rule: a non-USD code with no usable rate falls back to USD
 * rather than being trusted. Keeping the code while defaulting the rate to 1 is
 * what makes a $500 hotel render as "₹500" — a number in one currency wearing
 * another's symbol. Showing USD is honest; mislabelling is not.
 */
function normalizeCurrencyInfo(info: unknown): CurrencyInfo {
  if (!info || typeof info !== 'object') return USD;

  const raw = info as Record<string, unknown>;
  const code = typeof raw.code === 'string' ? raw.code.trim().toUpperCase() : '';
  const rate = Number(raw.rate_to_usd);

  if (!code || code === 'USD') return USD;
  if (!Number.isFinite(rate) || rate <= 0) return USD;

  return { code, rate_to_usd: rate };
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
  /** Takes unvalidated API/WebSocket payloads; normalised on the way in. */
  setCurrencyInfo: (info: unknown) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentPhase: 'idle',
  isStreaming: false,
  streamingText: '',
  itinerary: [],
  destinationInfo: '',
  currencyInfo: USD,

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setIsStreaming: (v) => set({ isStreaming: v }),

  appendStreamingToken: (token) =>
    set((s) => ({ streamingText: s.streamingText + token })),

  clearStreamingText: () => set({ streamingText: '' }),

  setItinerary: (days) => set({ itinerary: days }),
  setDestinationInfo: (info) => set({ destinationInfo: info }),
  setCurrencyInfo: (info) => set({ currencyInfo: normalizeCurrencyInfo(info) }),

  reset: () =>
    set({
      messages: [],
      currentPhase: 'idle',
      isStreaming: false,
      streamingText: '',
      itinerary: [],
      destinationInfo: '',
      currencyInfo: USD,
    }),
}));
