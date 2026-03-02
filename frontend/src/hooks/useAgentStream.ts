import { useCallback, useRef } from 'react';
import { WebSocketManager } from '../api/websocket';
import { useChatStore } from '../store/chatStore';
import type { StreamEvent } from '../types/chat';
import type { DayPlan } from '../types/itinerary';

export function useAgentStream(tripId: string) {
  const wsRef = useRef<WebSocketManager | null>(null);
  const tripIdRef = useRef(tripId);
  tripIdRef.current = tripId;

  const {
    addMessage,
    setCurrentPhase,
    setIsStreaming,
    appendStreamingToken,
    clearStreamingText,
    setItinerary,
    setDestinationInfo,
  } = useChatStore();

  const handleEvent = useCallback(
    (event: StreamEvent) => {
      switch (event.type) {
        case 'node_start':
          setCurrentPhase(event.node as any);
          setIsStreaming(true);
          addMessage({
            role: 'system',
            content: `Phase: ${event.node}`,
          });
          break;

        case 'token':
          if (event.content) appendStreamingToken(event.content);
          break;

        case 'node_end':
          break;

        case 'state_update':
          if (event.data) {
            console.log('[WS] state_update keys:', Object.keys(event.data));
            if (event.data.itinerary) {
              const days = Array.isArray(event.data.itinerary) ? event.data.itinerary : [];
              console.log('[WS] state_update itinerary, days:', days.length);
              setItinerary(days as DayPlan[]);
            }
            if (event.data.destination_info) {
              setDestinationInfo(event.data.destination_info as string);
            }
          }
          break;

        case 'complete':
          setIsStreaming(false);
          setCurrentPhase('complete');
          console.log('[WS] complete event data:', JSON.stringify(event.data).slice(0, 500));
          if (event.data?.itinerary) {
            const days = Array.isArray(event.data.itinerary) ? event.data.itinerary : [];
            console.log('[WS] Setting itinerary, days count:', days.length);
            setItinerary(days as DayPlan[]);
          } else {
            console.warn('[WS] complete event has no itinerary data');
          }
          if (event.data?.destination_info) {
            setDestinationInfo(event.data.destination_info as string);
          }
          addMessage({
            role: 'assistant',
            content: 'Your itinerary is ready! You can view it on the map and timeline. Feel free to ask me to make changes.',
          });
          clearStreamingText();
          break;

        case 'error': {
          setIsStreaming(false);
          setCurrentPhase('error');
          const errorMsg = event.content || 'Something went wrong';
          const isRateLimit = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate_limit');
          addMessage({
            role: 'assistant',
            content: isRateLimit
              ? 'Rate limit reached on the AI service. Please wait a few minutes and try again. The free tier has daily token limits.'
              : `Error: ${errorMsg}`,
          });
          break;
        }
      }
    },
    [
      addMessage, setCurrentPhase, setIsStreaming,
      appendStreamingToken, clearStreamingText,
      setItinerary, setDestinationInfo,
    ]
  );

  const connectWithId = useCallback(async (id: string) => {
    if (wsRef.current?.isConnected) {
      wsRef.current.disconnect();
    }
    wsRef.current = new WebSocketManager(id, handleEvent);
    await wsRef.current.connect();
  }, [handleEvent]);

  const connect = useCallback(async () => {
    if (wsRef.current?.isConnected) return;
    await connectWithId(tripIdRef.current);
  }, [connectWithId]);

  const generate = useCallback(async (overrideTripId?: string) => {
    const id = overrideTripId || tripIdRef.current;
    if (!id) return;
    await connectWithId(id);
    useChatStore.getState().reset();
    setIsStreaming(true);
    setCurrentPhase('research_destination');
    addMessage({ role: 'system', content: 'Starting itinerary generation...' });
    wsRef.current!.send('generate');
  }, [connectWithId, setIsStreaming, setCurrentPhase, addMessage]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!wsRef.current?.isConnected) await connect();
      addMessage({ role: 'user', content: message });
      setIsStreaming(true);
      wsRef.current!.send('chat', message);
    },
    [connect, addMessage, setIsStreaming]
  );

  const disconnect = useCallback(() => {
    wsRef.current?.disconnect();
    wsRef.current = null;
  }, []);

  return { connect, generate, sendMessage, disconnect };
}
