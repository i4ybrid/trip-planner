import { useState, useEffect, useRef, useCallback } from 'react';
import { TimelineEvent } from '@/types';

const POLL_INTERVAL_MS = 60_000;

interface UseTimelineResult {
  events: TimelineEvent[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

// Cached session token to avoid fetching on every poll
let cachedToken: string | null = null;
let tokenCacheTime = 0;
const TOKEN_CACHE_TTL = 30_000; // 30 seconds

async function getAuthToken(): Promise<string | null> {
  const now = Date.now();
  if (cachedToken && now - tokenCacheTime < TOKEN_CACHE_TTL) {
    return cachedToken;
  }
  try {
    const res = await fetch('/api/auth/session', { credentials: 'include' });
    if (!res.ok) return null;
    const session = await res.json();
    if (session?.accessToken) {
      cachedToken = session.accessToken;
      tokenCacheTime = now;
      return cachedToken;
    }
  } catch {
    // ignore
  }
  return null;
}

export function useTimeline(tripId: string): UseTimelineResult {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiBase}/trips/${tripId}/timeline`, {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEvents(data.data ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setIsLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    fetchEvents();

    pollingRef.current = setInterval(fetchEvents, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [tripId, fetchEvents]);

  return { events, isLoading, error, refetch: fetchEvents };
}
