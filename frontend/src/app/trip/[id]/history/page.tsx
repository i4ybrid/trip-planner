'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelineEventRow } from '@/components/timeline/TimelineEventRow';
import { TimelineEventKind } from '@/types';
import { Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type FilterKind = TimelineEventKind | 'ALL';

const FILTERS: { label: string; value: FilterKind }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Events', value: 'EVENT' },
  { label: 'Milestones', value: 'MILESTONE' },
  { label: 'Check-in', value: 'ACTIVITY_START' },
  { label: 'Check-out', value: 'ACTIVITY_END' },
];

export default function TripHistoryPage() {
  const params = useParams();
  const tripId = params.id as string;
  const { events, isLoading, error } = useTimeline(tripId);
  const [filter, setFilter] = useState<FilterKind>('ALL');

  const filtered = filter === 'ALL'
    ? events
    : events.filter((e) => e.kind === filter);

  return (
    <div className="space-y-4">
      {/* Kind filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              filter === f.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:border-primary/50',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* List */}
      {!isLoading && !error && filtered.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No events to show.
        </p>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="divide-y divide-border">
          {filtered.map((event) => (
            <TimelineEventRow
              key={event.id}
              event={event}
              tripId={tripId}
              onEditMilestone={(milestoneId) => {
                window.location.href = `/trip/${tripId}/milestones?edit=${milestoneId}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
