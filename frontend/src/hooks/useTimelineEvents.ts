import { useState, useEffect, useCallback, useRef } from 'react';
import { TimelineEvent } from '@/types';
import { api } from '@/services/api';

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

    intervalRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}
