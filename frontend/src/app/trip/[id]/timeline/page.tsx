'use client';

import { useParams } from 'next/navigation';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { TimelineEventCard } from '@/components/timeline/TimelineEventCard';
import { Calendar } from 'lucide-react';

export default function TripTimeline() {
  const params = useParams();
  const tripId = params.id as string;
  const { events, isLoading, error } = useTimelineEvents(tripId);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 flex-shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2 rounded-lg bg-muted p-3" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (sortedEvents.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timeline</h2>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            No activity yet
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Member join requests, approvals, and role changes will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Timeline</h2>
      <div className="space-y-3">
        {sortedEvents.map((event) => (
          <TimelineEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
