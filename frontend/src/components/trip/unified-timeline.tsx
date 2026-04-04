'use client';

import React, { useMemo, useState } from 'react';
import { useTimelineSummary } from '@/hooks/useTimelineSummary';
import { TimelineEventRow } from '@/components/timeline/TimelineEventRow';
import { Loader2, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useSession } from 'next-auth/react';
import { TripMember, TimelineEvent } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { RequestPaymentModal } from '@/components/trip/request-payment-modal';
import { MilestoneEditorModal } from '@/components/trip/milestone-editor-modal';
import { Milestone } from '@/types';

interface UnifiedTimelineProps {
  tripId: string;
  members?: TripMember[];
}

// ─── Now Divider ───────────────────────────────────────────────────────────────
function NowDivider() {
  return (
    <div className="relative py-3">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dashed border-primary/40" />
      </div>
      <div className="relative flex justify-center">
        <span className="rounded-full bg-primary px-4 py-0.5 text-xs font-semibold text-primary-foreground shadow-sm">
          Now
        </span>
      </div>
    </div>
  );
}

// ─── Loading Overlay ────────────────────────────────────────────────────────────
function LoadingOverlay() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading timeline…</p>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ onGenerate }: { onGenerate?: () => void }) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || '';
  const isMaster = false; // can't easily check role here without members prop — let parent handle

  return (
    <div className="rounded-lg border border-border bg-card py-12 text-center text-muted-foreground dark:border-border dark:bg-card">
      <Calendar className="mx-auto h-8 w-8 opacity-50" />
      <p className="mt-2 text-sm font-medium">No timeline events yet</p>
      <p className="mt-1 text-xs">
        Events and milestones will appear here as the trip progresses
      </p>

    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function UnifiedTimeline({ tripId, members = [] }: UnifiedTimelineProps) {
  const { items, needsRefresh, isLoading } = useTimelineSummary(tripId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [paymentModalMilestone, setPaymentModalMilestone] = useState<TimelineEvent | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const currentMember = members.find((m) => m.userId === userId);
  const isOrganizer = currentMember?.role === 'MASTER' || currentMember?.role === 'ORGANIZER';
  const memberIds = members.map((m) => m.userId);

  const handleOpenEditMilestone = (milestoneId: string) => {
    const timelineEvent = items.find((e) => e.sourceId === milestoneId && e.kind === 'MILESTONE');
    if (!timelineEvent) return;
    const meta = JSON.parse(timelineEvent.meta || '{}');
    const milestone: Milestone = {
      id: milestoneId,
      tripId,
      type: (meta.type as Milestone['type']) ?? 'CUSTOM',
      name: timelineEvent.title ?? meta.name ?? 'Milestone',
      dueDate: timelineEvent.effectiveDate,
      isManualOverride: meta.isManualOverride ?? false,
      isSkipped: meta.isSkipped ?? false,
      isLocked: meta.isLocked ?? false,
      isHard: meta.isHard ?? true,
      priority: meta.priority ?? 10,
      createdAt: timelineEvent.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingMilestone(milestone);
  };

  const handleCloseEditMilestone = () => {
    setEditingMilestone(null);
  };

  const handlePaymentSuccess = () => {
    window.location.reload();
  };

  const now = useMemo(() => new Date(), []);

  // Sort by effectiveDate ASC (soonest first)
  const sorted = useMemo(() => {
    return [...items].sort(
      (a, b) =>
        new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime(),
    );
  }, [items]);

  // Split into past / future in real-time
  const { pastItems, futureItems } = useMemo(() => {
    const past: typeof sorted = [];
    const future: typeof sorted = [];
    for (const event of sorted) {
      if (new Date(event.effectiveDate) < now) {
        past.push(event);
      } else {
        future.push(event);
      }
    }
    return { pastItems: past, futureItems: future };
  }, [sorted, now]);

  const handleGenerateDefaults = async () => {
    if (!tripId) return;
    setIsGenerating(true);
    try {
      await api.generateDefaultMilestones(tripId);
      window.location.reload();
    } catch (err) {
      console.error('Failed to generate default milestones:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const hasPast = pastItems.length > 0;
  const hasFuture = futureItems.length > 0;
  const hasContent = hasPast || hasFuture;

  // Loading: spinner overlay when needs refresh is pending or initial load
  if (isLoading || needsRefresh === 'true') {
    return (
      <div className="space-y-4">
        <LoadingOverlay />
      </div>
    );
  }

  if (!hasContent) {
    return (
      <div className="space-y-4">
        <EmptyState onGenerate={handleGenerateDefaults} />
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* Looking Back */}
      {hasPast && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Looking Back
          </p>
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-0.5">
              {pastItems.map((event) => (
                <TimelineEventRow
                  key={event.id}
                  event={event}
                  tripId={tripId}
                  userId={userId}
                  isOrganizer={isOrganizer}
                  memberIds={memberIds}
                  className="relative pl-8"
                  onEditMilestone={handleOpenEditMilestone}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Now divider */}
      {hasPast && hasFuture && <NowDivider />}

      {/* Looking Ahead */}
      {hasFuture && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
            Looking Ahead
          </p>
          <div className="relative">
            <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-0.5">
              {futureItems.map((event) => (
                <TimelineEventRow
                  key={event.id}
                  event={event}
                  tripId={tripId}
                  userId={userId}
                  isOrganizer={isOrganizer}
                  memberIds={memberIds}
                  className="relative pl-8"
                  onEditMilestone={handleOpenEditMilestone}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Request Payment Modal */}
      <RequestPaymentModal
        isOpen={!!paymentModalMilestone}
        onClose={() => setPaymentModalMilestone(null)}
        tripId={tripId}
        milestone={paymentModalMilestone ? {
          id: paymentModalMilestone.sourceId!,
          tripId,
          name: paymentModalMilestone.title ?? '',
          type: 'FINAL_PAYMENT_DUE',
          dueDate: paymentModalMilestone.effectiveDate ?? new Date().toISOString(),
          isManualOverride: false,
          isSkipped: false,
          isLocked: false,
          isHard: false,
          priority: 0,
          createdAt: paymentModalMilestone.createdAt ?? new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } : null}
        members={members}
        onSuccess={handlePaymentSuccess}
      />

      <MilestoneEditorModal
        isOpen={!!editingMilestone}
        milestone={editingMilestone}
        onClose={handleCloseEditMilestone}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
