'use client';

import React, { useState } from 'react';
import { Milestone, TimelineEvent, TripMember, BillSplit } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components';
import { Clock, Calendar, Sparkles, Flag, DollarSign, Users, CheckCircle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { api } from '@/services/api';
import { RequestPaymentModal } from '@/components/trip/request-payment-modal';
import { TimelineEventCard } from '@/components/timeline/TimelineEventCard';
import { RemindSettleModal } from '@/components/trip/remind-settle-modal';
import { MilestoneEditorModal } from '@/components/trip/milestone-editor-modal';

// ─── Icons per milestone type ────────────────────────────────────────────────
const MILESTONE_TYPE_ICONS: Record<string, { icon: React.ElementType; className?: string }> = {
  FINAL_PAYMENT_DUE: { icon: DollarSign, className: 'text-amber-500' },
  SETTLEMENT_DUE: { icon: DollarSign, className: 'text-orange-500' },
  COMMITMENT_REQUEST: { icon: Users, className: 'text-blue-500' },
  COMMITMENT_DEADLINE: { icon: Users, className: 'text-purple-500' },
  SETTLEMENT_COMPLETE: { icon: CheckCircle, className: 'text-green-500' },
  CUSTOM: { icon: Flag, className: 'text-pink-500' },
};

// ─── Past timeline event icons (reuse from existing page) ────────────────────
const EVENT_TYPE_ICONS: Record<string, string> = {
  trip_created: '🎉',
  member_joined: '👋',
  member_invited: '📨',
  activity_proposed: '💡',
  activity_booked: '✅',
  vote_cast: '🗳️',
  payment_received: '💰',
  payment_sent: '💸',
  status_changed: '🔄',
  message_sent: '💬',
  photo_shared: '📷',
};

function getMilestoneStatus(
  milestone: Milestone,
  now: Date,
): 'completed' | 'in-progress' | 'overdue' | 'upcoming' | 'skipped' {
  if (milestone.isSkipped) return 'skipped';
  const dueDate = new Date(milestone.dueDate);
  const total = milestone.totalMembers || 1;
  const completed = milestone.completedCount || 0;
  if (completed >= total) return 'completed';
  if (dueDate < now) return 'overdue';
  if (completed > 0) return 'in-progress';
  return 'upcoming';
}

// ─── Milestone Card ──────────────────────────────────────────────────────────
interface MilestoneCardProps {
  milestone: Milestone;
  members: TripMember[];
  currentUserId: string;
  currentUserRole: string;
  isCompleted?: boolean; // true = past/completed milestone
  onRequestPayment?: (milestone: Milestone) => void;
  onRemindSettle?: (milestone: Milestone) => void;
  onEdit?: (milestone: Milestone) => void;
}

function MilestoneCard({
  milestone,
  members,
  currentUserId,
  currentUserRole,
  isCompleted = false,
  onRequestPayment,
  onRemindSettle,
  onEdit,
}: MilestoneCardProps) {
  const now = new Date();
  const status = getMilestoneStatus(milestone, now);
  const canManage = currentUserRole === 'MASTER' || currentUserRole === 'ORGANIZER';
  const isPaymentType =
    milestone.type === 'FINAL_PAYMENT_DUE' || milestone.type === 'SETTLEMENT_DUE';
  const isCommitmentType =
    milestone.type === 'COMMITMENT_REQUEST' || milestone.type === 'COMMITMENT_DEADLINE';

  const statusStyles = {
    completed: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900',
    'in-progress': 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900',
    overdue: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900',
    upcoming: 'border-border bg-card dark:border-border dark:bg-card',
    skipped: 'border-border bg-muted dark:border-border dark:bg-muted',
  };

  const statusBadge = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
    upcoming: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200',
    skipped: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  const MilestoneIcon = MILESTONE_TYPE_ICONS[milestone.type]?.icon || Flag;
  const milestoneIconClass = MILESTONE_TYPE_ICONS[milestone.type]?.className || 'text-muted-foreground';

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isCompleted ? statusStyles.completed : statusStyles[status],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Milestone type icon — Lucide icon circle */}
          <div
            className={cn(
              'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted',
              milestoneIconClass,
            )}
          >
            <MilestoneIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-medium">{milestone.name}</h4>
              <span
                className={cn(
                  'rounded px-1.5 py-0.5 text-xs font-medium',
                  isCompleted ? statusBadge.completed : statusBadge[status],
                )}
              >
                {isCompleted
                  ? 'Completed'
                  : status === 'upcoming'
                    ? 'Upcoming'
                    : status === 'overdue'
                      ? 'Overdue'
                      : status === 'in-progress'
                        ? 'In Progress'
                        : 'Skipped'}
              </span>
              {milestone.type === 'CUSTOM' && (
                <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                  Custom
                </span>
              )}
              {milestone.isHard && !isCompleted && (
                <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-600 dark:bg-red-900 dark:text-red-200">
                  Hard
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Due: {format(new Date(milestone.dueDate), 'MMMM d, yyyy')}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {milestone.completedCount || 0}/{milestone.totalMembers || 0} members
              completed
            </p>
          </div>
        </div>

        {/* Action buttons */}
        {!isCompleted && status !== 'skipped' && (
          <div className="flex flex-wrap items-center gap-1">
            {isPaymentType && canManage && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onRequestPayment?.(milestone)}
                >
                  Request Payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => onRemindSettle?.(milestone)}
                >
                  Remind to Settle
                </Button>
              </>
            )}
            {(isCommitmentType || isPaymentType) && canManage && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Remind
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs"
                onClick={() => onEdit?.(milestone)}
              >
                Edit
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Timeline Event Row ────────────────────────────────────────────────────────
interface EventRowProps {
  event: TimelineEvent;
}

function EventRow({ event }: EventRowProps) {
  const getUserName = (userId?: string) => {
    if (!userId) return 'System';
    const names: Record<string, string> = {
      'user-1': 'You',
      'user-2': 'Sarah Chen',
      'user-3': 'Mike Johnson',
      'user-4': 'Emma Wilson',
    };
    return names[userId] || 'Unknown';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="relative flex gap-4 pl-8">
      <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-muted-foreground/30">
        <span className="text-xs">
          {EVENT_TYPE_ICONS[event.eventType] || '📌'}
        </span>
      </div>
      <div className="flex-1 rounded-lg border border-border bg-white dark:bg-[hsl(var(--card))] p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium">{event.description}</p>
            <p className="text-sm text-muted-foreground">
              {getUserName(event.createdBy)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(event.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Today Divider ─────────────────────────────────────────────────────────────
function TodayDivider() {
  return (
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-dashed border-primary/40" />
      </div>
      <div className="relative flex justify-center">
        <span className="rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
          Today
        </span>
      </div>
    </div>
  );
}

// ─── Main Unified Timeline Component ────────────────────────────────────────
interface UnifiedTimelineProps {
  events: TimelineEvent[];
  milestones: Milestone[];
  members: TripMember[];
  tripId: string;
  billSplits?: BillSplit[];
}

export function UnifiedTimeline({
  events,
  milestones,
  members,
  tripId,
  billSplits = [],
}: UnifiedTimelineProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || '';
  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const currentUserRole = currentUserMember?.role || '';
  const canManage = currentUserRole === 'MASTER' || currentUserRole === 'ORGANIZER';
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal state
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [showRequestPayment, setShowRequestPayment] = useState(false);
  const [showRemindSettle, setShowRemindSettle] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Milestone card handlers
  const handleRequestPayment = (milestone: Milestone) => {
    // Guard: ensure milestone is valid before opening modal
    if (!milestone || !milestone.id) return;
    setSelectedMilestone(milestone);
    setShowRequestPayment(true);
  };

  const handleRemindSettle = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowRemindSettle(true);
  };

  const handleEdit = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setShowEditor(true);
  };

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

  const now = new Date();

  // Intersperse milestones with events chronologically
  const timelineItems = React.useMemo(() => {
    const items: Array<{ type: 'event'; event: TimelineEvent } | { type: 'milestone'; milestone: Milestone }> = [];

    // Add all events
    for (const event of events) {
      items.push({ type: 'event', event });
    }

    // Add all non-skipped milestones
    for (const milestone of milestones) {
      if (!milestone.isSkipped) {
        items.push({ type: 'milestone', milestone });
      }
    }

    // Sort chronologically (newest first)
    items.sort((a, b) => {
      const dateA = a.type === 'event' ? new Date(a.event.createdAt).getTime() : new Date(a.milestone.dueDate).getTime();
      const dateB = b.type === 'event' ? new Date(b.event.createdAt).getTime() : new Date(b.milestone.dueDate).getTime();
      return dateB - dateA;
    });

    return items;
  }, [events, milestones]);

  // Separate into past and upcoming based on today
  const { pastItems, upcomingItems } = React.useMemo(() => {
    const past: typeof timelineItems = [];
    const upcoming: typeof timelineItems = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const item of timelineItems) {
      const itemDate = item.type === 'event' 
        ? new Date(item.event.createdAt) 
        : new Date(item.milestone.dueDate);
      
      // Set to start of day for comparison
      const compareDate = new Date(itemDate);
      compareDate.setHours(0, 0, 0, 0);

      if (compareDate < today) {
        past.push(item);
      } else {
        upcoming.push(item);
      }
    }

    return { pastItems: past, upcomingItems: upcoming };
  }, [timelineItems]);

  const hasPastContent = pastItems.length > 0;
  const hasUpcomingContent = upcomingItems.length > 0;

  if (!hasPastContent && !hasUpcomingContent) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Calendar className="mx-auto h-8 w-8 opacity-50" />
          <p className="mt-2 text-sm font-medium">No timeline events yet</p>
          <p className="mt-1 text-xs">
            Events and milestones will appear here as the trip progresses
          </p>
          {canManage && (
            <div className="mt-6 mx-auto max-w-sm rounded-lg border bg-card p-4 dark:border-border dark:bg-card">
              <div className="flex items-start gap-3 text-left">
                <Sparkles className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground dark:text-foreground">
                    No milestones yet
                  </h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Generate default milestones based on your trip dates.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleGenerateDefaults}
                    disabled={isGenerating}
                    className="mt-3 bg-secondary text-foreground hover:bg-secondary/80 dark:bg-secondary-dark"
                  >
                    {isGenerating ? 'Generating…' : 'Generate Default Milestones'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── LOOKING BACK ── */}
      {(hasPastContent || hasUpcomingContent) && (
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Looking Back
          </h3>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-4">
              {pastItems.map((item, index) => {
                if (item.type === 'event') {
                  return <EventRow key={`${item.type}-${item.event.id}`} event={item.event} />;
                } else {
                  return (
                    <TimelineEventCard
                      key={`${item.type}-${item.milestone.id}`}
                      milestone={item.milestone}
                      className="relative pl-8"
                    />
                  );
                }
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TODAY DIVIDER ── */}
      {hasPastContent && hasUpcomingContent && <TodayDivider />}

      {/* ── LOOKING AHEAD ── */}
      {hasUpcomingContent && (
        <div>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
            Looking Ahead
          </h3>
          <div className="space-y-3">
            {upcomingItems.map((item) => {
              if (item.type === 'milestone') {
                return (
                  <div key={`${item.type}-${item.milestone.id}`} className="relative pl-8">
                    <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-amber-400 dark:border-amber-600">
                      <Target className="h-2.5 w-2.5 text-amber-500" />
                    </div>
                    <MilestoneCard
                      milestone={item.milestone}
                      members={members}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      onRequestPayment={handleRequestPayment}
                      onRemindSettle={handleRemindSettle}
                      onEdit={handleEdit}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <RequestPaymentModal
        isOpen={showRequestPayment}
        onClose={() => {
          setShowRequestPayment(false);
          setSelectedMilestone(null);
        }}
        tripId={tripId}
        milestone={selectedMilestone}
        members={members}
        onSuccess={() => {
          setShowRequestPayment(false);
          setSelectedMilestone(null);
        }}
      />
      <RemindSettleModal
        isOpen={showRemindSettle}
        onClose={() => {
          setShowRemindSettle(false);
          setSelectedMilestone(null);
        }}
        tripId={tripId}
        milestone={selectedMilestone}
        members={members}
        billSplits={billSplits}
        onSuccess={() => {
          setShowRemindSettle(false);
          setSelectedMilestone(null);
        }}
      />
      <MilestoneEditorModal
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setSelectedMilestone(null);
        }}
        milestone={selectedMilestone}
        onSuccess={() => {
          setShowEditor(false);
          setSelectedMilestone(null);
        }}
      />
    </div>
  );
}
