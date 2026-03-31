'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useTimelineEvents } from '@/hooks/useTimelineEvents';
import { UnifiedTimeline } from '@/components/trip/unified-timeline';
import { api } from '@/services/api';
import { Milestone, TripMember, BillSplit } from '@/types';
import { useAuth } from '@/hooks/use-auth';

export default function TripTimeline() {
  const params = useParams();
  const tripId = params.id as string;
  const { user } = useAuth();
  const { events, isLoading: eventsLoading, error: eventsError } = useTimelineEvents(tripId);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [members, setMembers] = useState<TripMember[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Track whether auth session has been loaded (NextAuth may return null initially)
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [milestonesResult, membersResult, billSplitsResult] = await Promise.all([
        api.getMilestones(tripId),
        api.getTripMembers(tripId),
        api.getBillSplits(tripId),
      ]);
      if (milestonesResult.data) setMilestones(milestonesResult.data);
      if (membersResult.data) setMembers(membersResult.data);
      if (billSplitsResult.data) setBillSplits(billSplitsResult.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load timeline data');
    } finally {
      // Always set loading to false, even if an unhandled exception escapes.
      // Without this, exceptions that bypass the catch block (e.g. from state
      // updates during render) would leave the page stuck on the skeleton.
      setIsLoading(false);
    }
  }, [tripId]);

  // Safety timeout: if loading state never resolves (e.g. API throws before
  // finally), force loading=false after 15s to prevent infinite skeleton.
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 15_000);
    return () => clearTimeout(timer);
  }, [tripId]);

  // Mark auth as ready once user is available (not null)
  useEffect(() => {
    if (user) {
      setAuthReady(true);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData();
  };

  if (isLoading || eventsLoading || !authReady) {
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

  if (error || eventsError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300">
        {error || eventsError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Timeline</h2>
      <UnifiedTimeline
        events={events}
        milestones={milestones}
        members={members}
        billSplits={billSplits}
        tripId={tripId}
      />
    </div>
  );
}