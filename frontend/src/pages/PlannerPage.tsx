import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MessageCircle, Sparkles } from 'lucide-react';
import TravelLoader from '../components/ui/TravelLoader';
import TripForm from '../components/trip/TripForm';
import TripMap from '../components/map/TripMap';
import ItineraryView from '../components/itinerary/ItineraryView';
import ChatPanel from '../components/chat/ChatPanel';
import { useTrip, useCreateTrip } from '../hooks/useTrips';
import { useAgentStream } from '../hooks/useAgentStream';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { fetchItinerary } from '../api/trips';
import type { TripCreate } from '../types/trip';

export default function PlannerPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [activeTripId, setActiveTripId] = useState(tripId || '');
  const [formCollapsed, setFormCollapsed] = useState(!!tripId);
  const [autoGenerate, setAutoGenerate] = useState(false);

  // Sync activeTripId when URL changes (navigating between trips)
  useEffect(() => {
    if (tripId && tripId !== activeTripId) {
      setActiveTripId(tripId);
      setFormCollapsed(true);
    }
  }, [tripId]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: trip } = useTrip(activeTripId || undefined);
  const createMutation = useCreateTrip();
  const { itinerary, destinationInfo, isStreaming, currentPhase } = useChatStore();
  const chatOpen = useUIStore((s) => s.chatOpen);
  const setChatOpen = useUIStore((s) => s.setChatOpen);

  const { generate, sendMessage, disconnect } = useAgentStream(activeTripId);
  const reset = useChatStore((s) => s.reset);
  const setItinerary = useChatStore((s) => s.setItinerary);
  const setDestinationInfo = useChatStore((s) => s.setDestinationInfo);

  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  // Reset chat state and load saved itinerary when trip changes
  useEffect(() => {
    if (!activeTripId) return;
    reset();
    fetchItinerary(activeTripId)
      .then((data) => {
        if (data?.days?.length) setItinerary(data.days);
        if (data?.destination_info) setDestinationInfo(data.destination_info);
      })
      .catch(() => {});
  }, [activeTripId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch from DB when generation completes
  useEffect(() => {
    if (currentPhase !== 'complete' || !activeTripId) return;
    const timer = setTimeout(() => {
      fetchItinerary(activeTripId)
        .then((data) => {
          if (data?.days?.length) setItinerary(data.days);
          if (data?.destination_info) setDestinationInfo(data.destination_info);
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPhase]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasGenerated = useRef(false);
  useEffect(() => {
    if (autoGenerate && activeTripId && !hasGenerated.current) {
      hasGenerated.current = true;
      setAutoGenerate(false);
      const timer = setTimeout(() => generate(activeTripId), 300);
      return () => clearTimeout(timer);
    }
  }, [autoGenerate, activeTripId, generate]);

  const handleCreateTrip = async (tripData: TripCreate) => {
    const newTrip = await createMutation.mutateAsync(tripData);
    setActiveTripId(newTrip._id);
    setFormCollapsed(true);
    hasGenerated.current = false;
    setAutoGenerate(true);
    window.history.replaceState(null, '', `/planner/${newTrip._id}`);
  };

  const isGenerating = isStreaming && currentPhase !== 'idle' && currentPhase !== 'complete';

  return (
    <div className="h-full flex" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      {/* Left Panel: Form + Itinerary */}
      <div className="w-80 border-r flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}>
        <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {formCollapsed ? 'Itinerary' : 'Plan Your Trip'}
            </h2>
            {formCollapsed && !isGenerating && (
              <button
                onClick={() => setFormCollapsed(false)}
                className="text-xs font-medium"
                style={{ color: 'var(--color-accent)' }}
              >
                Edit Trip
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!formCollapsed ? (
            <TripForm
              onSubmit={handleCreateTrip}
              isLoading={createMutation.isPending}
            />
          ) : (
            <>
              {trip && (
                <div className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--color-surface-tertiary)',
                    color: 'var(--color-text-secondary)',
                  }}>
                  <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {trip.destination}
                  </p>
                  <p>{trip.start_date} to {trip.end_date}</p>
                  <p>Budget: ${trip.budget_usd}</p>
                </div>
              )}
              <ItineraryView
                itinerary={itinerary}
                destinationInfo={destinationInfo}
              />
            </>
          )}
        </div>

        {formCollapsed && activeTripId && itinerary.length === 0 && !isGenerating && (
          <div className="p-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => generate(activeTripId)}
              className="w-full gradient-primary text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-md"
            >
              <Sparkles className="w-4 h-4" />
              Generate Itinerary
            </motion.button>
          </div>
        )}
      </div>

      {/* Center: Map */}
      <div className="flex-1 p-4 relative">
        {itinerary.length > 0 ? (
          <TripMap itinerary={itinerary} />
        ) : (
          <div className="h-full rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-surface-tertiary)' }}>
            <div className="text-center">
              {isGenerating ? (
                <TravelLoader />
              ) : (
                <>
                  <Map className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
                  <p style={{ color: 'var(--color-text-muted)' }}>
                    Your itinerary will appear on the map
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat toggle button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setChatOpen(!chatOpen)}
          className="absolute top-6 right-6 glass shadow-md rounded-full w-10 h-10 flex items-center justify-center z-[1000] transition-shadow hover:shadow-lg"
          style={{ color: 'var(--color-accent)' }}
          title={chatOpen ? 'Hide chat' : 'Show chat'}
        >
          <MessageCircle className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Right Panel: Chat */}
      <AnimatePresence>
        {chatOpen && activeTripId && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden p-4"
          >
            <ChatPanel onSendMessage={sendMessage} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
