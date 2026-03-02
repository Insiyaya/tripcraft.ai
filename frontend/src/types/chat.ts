export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export interface StreamEvent {
  type: 'node_start' | 'node_end' | 'token' | 'state_update' | 'complete' | 'error';
  node?: string;
  content?: string;
  data?: Record<string, unknown>;
}

export type AgentPhase =
  | 'idle'
  | 'research_destination'
  | 'fetch_external_data'
  | 'plan_itinerary'
  | 'validate_itinerary'
  | 'optimize_route'
  | 'handle_chat'
  | 'complete'
  | 'error';
