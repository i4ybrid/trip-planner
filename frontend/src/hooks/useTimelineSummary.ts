import { useState, useEffect, useRef } from 'react';
import { TimelineEvent } from '@/types';

const POLL_INTERVAL_MS = 60_000;

interface TimelineSummaryData {
  items: TimelineEvent[];
  needsRefresh: 'true' | 'false' | null;
  isLoading: boolean;
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

export function useTimelineSummary(tripId: string): TimelineSummaryData {
  const [items, setItems] = useState<TimelineEvent[]>([]);
  const [needsRefresh, setNeedsRefresh] = useState<'true' | 'false' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSummary = async () => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiBase}/trips/${tripId}/timeline-summary`, {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.needsRefresh === 'true') {
        setNeedsRefresh('true');
        setIsLoading(true);
        setTimeout(fetchSummary, 500);
      } else {
        setItems(data.data ?? []);
        setNeedsRefresh('false');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch timeline summary:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!tripId) return;

    fetchSummary();

    pollingIntervalRef.current = setInterval(fetchSummary, POLL_INTERVAL_MS);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [tripId]);

  return { items, needsRefresh, isLoading };
}
