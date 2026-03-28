import { useState, useEffect, useCallback, useRef } from 'react';
import { TimelineEvent } from '@/types';
import { api } from '@/services/api';
import { getSocket } from '@/lib/socket';

const POLL_INTERVAL_MS = 60_000;

interface UseTimelineEventsResult {
  events: TimelineEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useTimelineEvents(tripId: string): UseTimelineEventsResult {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const result = await api.getTripTimeline(tripId);
      if (result.error) {
        setError(result.error);
      } else {
        setEvents(result.data ?? []);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline events');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    fetchEvents();

    // Real-time: join trip room and listen for new timeline events
    const socket = getSocket();
    if (socket) {
      socket.emit('join-trip', tripId);
      socket.on('timeline:event', (event: TimelineEvent) => {
        if (event.tripId === tripId) {
          setEvents((prev) => [event, ...prev]);
        }
      });
    }

    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (socket) {
        socket.off('timeline:event');
        socket.emit('leave-trip', tripId);
      }
    };
  }, [fetchEvents, tripId]);

  return { events, isLoading, error, refetch: fetchEvents };
}
