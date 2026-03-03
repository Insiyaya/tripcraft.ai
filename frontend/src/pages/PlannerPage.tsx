import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MessageCircle, Sparkles, ChevronLeft, Plane, X, Compass } from 'lucide-react';
import TravelLoader from '../components/ui/TravelLoader';
import TripForm from '../components/trip/TripForm';
import TripMap from '../components/map/TripMap';
import ItineraryFlipGrid from '../components/itinerary/ItineraryFlipGrid';
import ChatPanel from '../components/chat/ChatPanel';
import { useTrip, useCreateTrip } from '../hooks/useTrips';
import { useAgentStream } from '../hooks/useAgentStream';
import { useChatStore } from '../store/chatStore';
import { useUIStore } from '../store/uiStore';
import { fetchItinerary } from '../api/trips';
import type { TripCreate } from '../types/trip';
import { normalizeItinerary } from '../utils/itineraryNormalizer';

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
  const mapOpen = useUIStore((s) => s.mapOpen);
  const setMapOpen = useUIStore((s) => s.setMapOpen);
  const setSelectedDay = useUIStore((s) => s.setSelectedDay);

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
    setSelectedDay(null);
    fetchItinerary(activeTripId)
      .then((data) => {
        setItinerary(normalizeItinerary(data?.days));
        setDestinationInfo(typeof data?.destination_info === 'string' ? data.destination_info : '');
      })
      .catch(() => {});
  }, [activeTripId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch from DB when generation completes
  useEffect(() => {
    if (currentPhase !== 'complete' || !activeTripId) return;
    const timer = setTimeout(() => {
      fetchItinerary(activeTripId)
        .then((data) => {
          setItinerary(normalizeItinerary(data?.days));
          setDestinationInfo(typeof data?.destination_info === 'string' ? data.destination_info : '');
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

  const handleViewDayOnMap = (dayIdx: number) => {
    setSelectedDay(dayIdx);
    setMapOpen(true);
  };

  return (
    <div className="h-full flex relative overflow-hidden" style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
      {/* LEFT: Form panel - animated collapse */}
      <AnimatePresence initial={false}>
        {!formCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-r flex-shrink-0"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="w-72 h-full flex flex-col overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  Plan Your Trip
                </h2>
                {activeTripId && (
                  <button
                    onClick={() => setFormCollapsed(true)}
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
              <TripForm
                onSubmit={handleCreateTrip}
                isLoading={createMutation.isPending}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER: Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top toolbar */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        >
          {/* Left: trip info / edit button */}
          <div className="flex items-center gap-3 min-w-0">
            {formCollapsed && !isGenerating && (
              <button
                onClick={() => setFormCollapsed(false)}
                className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex-shrink-0"
                style={{
                  backgroundColor: 'var(--color-surface-tertiary)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Edit
              </button>
            )}
            {trip && formCollapsed && (
              <div className="flex items-center gap-2 min-w-0 text-sm">
                {trip.origin && (
                  <>
                    <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {trip.origin}
                    </span>
                    <Plane className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                  </>
                )}
                <span className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {trip.destination}
                </span>
                <span className="text-xs flex-shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {trip.start_date} – {trip.end_date}
                </span>
              </div>
            )}
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {formCollapsed && activeTripId && itinerary.length === 0 && !isGenerating && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => generate(activeTripId)}
                className="gradient-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate
              </motion.button>
            )}
            {itinerary.length > 0 && (
              <button
                onClick={() => setMapOpen(!mapOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  backgroundColor: mapOpen ? 'var(--color-accent-light)' : 'var(--color-surface-tertiary)',
                  color: mapOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                }}
              >
                <Map className="w-3.5 h-3.5" />
                Map
              </button>
            )}
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                backgroundColor: chatOpen ? 'var(--color-accent-light)' : 'var(--color-surface-tertiary)',
                color: chatOpen ? 'var(--color-accent)' : 'var(--color-text-secondary)',
              }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {isGenerating ? (
            <div className="h-full flex items-center justify-center">
              <TravelLoader />
            </div>
          ) : itinerary.length > 0 ? (
            <ItineraryFlipGrid
              itinerary={itinerary}
              destinationInfo={destinationInfo}
              onViewDayOnMap={handleViewDayOnMap}
            />
          ) : formCollapsed ? (
            /* Empty state when no itinerary yet */
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Compass className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  Ready to plan your trip?
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Click "Generate" to create your AI-powered itinerary
                </p>
                {activeTripId && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => generate(activeTripId)}
                    className="gradient-primary text-white px-6 py-2.5 rounded-lg font-medium text-sm flex items-center gap-2 mx-auto shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Itinerary
                  </motion.button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Map overlay panel - slides from right */}
        <AnimatePresence>
          {mapOpen && itinerary.length > 0 && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-y-0 right-0 w-[480px] z-40 border-l shadow-xl flex flex-col"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
            >
              <div
                className="flex items-center justify-between p-3 border-b flex-shrink-0"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  Map View
                </span>
                <button
                  onClick={() => setMapOpen(false)}
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 p-2">
                <TripMap itinerary={itinerary} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* RIGHT: Chat panel */}
      <AnimatePresence>
        {chatOpen && activeTripId && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-l flex-shrink-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="w-80 h-full p-4">
              <ChatPanel onSendMessage={sendMessage} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
