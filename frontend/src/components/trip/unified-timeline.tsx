'use client';

import React, { useEffect, useState } from 'react';
import { Milestone, TimelineEvent, TripMember } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components';
import { Clock, Check, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { useSession } from 'next-auth/react';

// ─── Icons per milestone type ────────────────────────────────────────────────
const MILESTONE_TYPE_ICONS: Record<string, string> = {
  COMMITMENT_REQUEST: '📋',
  COMMITMENT_DEADLINE: '⏰',
  FINAL_PAYMENT_DUE: '💰',
  SETTLEMENT_DUE: '📊',
  SETTLEMENT_COMPLETE: '✅',
  CUSTOM: '🎯',
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
  onRefresh: () => void;
  isCompleted?: boolean; // true = past/completed milestone
}

function MilestoneCard({
  milestone,
  members,
  currentUserId,
  currentUserRole,
  onRefresh,
  isCompleted = false,
}: MilestoneCardProps) {
  const now = new Date();
  const status = getMilestoneStatus(milestone, now);
  const canManage = currentUserRole === 'MASTER' || currentUserRole === 'ORGANIZER';
  const isPaymentType =
    milestone.type === 'FINAL_PAYMENT_DUE' || milestone.type === 'SETTLEMENT_DUE';
  const isCommitmentType =
    milestone.type === 'COMMITMENT_REQUEST' || milestone.type === 'COMMITMENT_DEADLINE';

  const handleMarkComplete = async () => {
    await api.updateMilestoneCompletion(milestone.id, currentUserId, 'COMPLETED');
    onRefresh();
  };

  const statusStyles = {
    completed: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900',
    'in-progress': 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900',
    overdue: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900',
    upcoming: 'border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-900',
    skipped: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900',
  };

  const statusBadge = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200',
    'in-progress': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-200',
    overdue: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200',
    upcoming: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200',
    skipped: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isCompleted ? statusStyles.completed : statusStyles[status],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Milestone type icon */}
          <span className="mt-0.5 text-xl">
            {MILESTONE_TYPE_ICONS[milestone.type] || '📌'}
          </span>
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
                >
                  Request Payment
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
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
            {status !== 'completed' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkComplete}
                className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                <Check className="mr-1 h-3 w-3" />
                Mark Complete
              </Button>
            )}
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs"
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
  members: TripMember[];
  tripId: string;
}

export function UnifiedTimeline({
  events,
  members,
  tripId,
}: UnifiedTimelineProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || '';
  const currentUserMember = members.find((m) => m.userId === currentUserId);
  const currentUserRole = currentUserMember?.role || '';

  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    api.getMilestones(tripId).then((result) => {
      if (result.data) setMilestones(result.data);
    }).catch(() => {
      // Milestones might not exist for IDEA trips
    });
  }, [tripId]);

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
        </CardContent>
      </Card>
    );
  }

  const handleRefresh = () => {
    api.getMilestones(tripId).then((result) => {
      if (result.data) setMilestones(result.data);
    });
  };

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
                    <div key={`${item.type}-${item.milestone.id}`} className="relative pl-8">
                      <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-green-400 dark:border-green-600">
                        <span className="text-xs">✅</span>
                      </div>
                      <MilestoneCard
                        milestone={item.milestone}
                        members={members}
                        currentUserId={currentUserId}
                        currentUserRole={currentUserRole}
                        onRefresh={handleRefresh}
                        isCompleted
                      />
                    </div>
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
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Looking Ahead
          </h3>
          <div className="space-y-3">
            {upcomingItems.map((item) => {
              if (item.type === 'milestone') {
                return (
                  <div key={`${item.type}-${item.milestone.id}`} className="relative pl-8">
                    <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-amber-400 dark:border-amber-600">
                      <span className="text-xs">🎯</span>
                    </div>
                    <MilestoneCard
                      milestone={item.milestone}
                      members={members}
                      currentUserId={currentUserId}
                      currentUserRole={currentUserRole}
                      onRefresh={handleRefresh}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
