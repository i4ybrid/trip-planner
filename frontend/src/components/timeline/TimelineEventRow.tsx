'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TimelineEvent, TimelineEventKind } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  UserMinus,
  UserX,
  Shield,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Flag,
  Calendar,
  Bed,
  MapPin,
  Utensils,
  Plane,
  Camera,
  Vote,
  MessageSquare,
  Sparkles,
  MoreVertical,
  SkipForward,
  Bell,
  Pencil,
  Trash2,
  Check,
  RotateCcw,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Icon + color config per kind / eventType ─────────────────────────────────
const KIND_CONFIG: Record<
  TimelineEventKind,
  { icon: React.ElementType; dotClass?: string }
> = {
  EVENT: { icon: Calendar, dotClass: 'bg-blue-500' },
  MILESTONE: { icon: Flag, dotClass: 'bg-amber-500' },
  ACTIVITY_START: { icon: Bed, dotClass: 'bg-green-500' },
  ACTIVITY_END: { icon: Bed, dotClass: 'bg-orange-500' },
};

const EVENT_TYPE_ICONS: Record<string, { icon: React.ElementType; dotClass?: string }> = {
  trip_created: { icon: Sparkles, dotClass: 'bg-purple-500' },
  member_joined: { icon: UserPlus, dotClass: 'bg-green-500' },
  member_invited: { icon: UserCheck, dotClass: 'bg-blue-500' },
  member_removed: { icon: UserMinus, dotClass: 'bg-red-500' },
  invite_declined: { icon: UserX, dotClass: 'bg-red-500' },
  role_changed: { icon: Shield, dotClass: 'bg-purple-500' },
  join_request_sent: { icon: UserCheck, dotClass: 'bg-blue-500' },
  join_request_approved: { icon: CheckCircle, dotClass: 'bg-green-500' },
  join_request_denied: { icon: XCircle, dotClass: 'bg-red-500' },
  activity_proposed: { icon: Vote, dotClass: 'bg-blue-500' },
  activity_booked: { icon: CheckCircle, dotClass: 'bg-green-500' },
  activity_added: { icon: MapPin, dotClass: 'bg-green-500' },
  activity_removed: { icon: MapPin, dotClass: 'bg-red-500' },
  vote_cast: { icon: Vote, dotClass: 'bg-blue-500' },
  payment_received: { icon: DollarSign, dotClass: 'bg-green-500' },
  payment_sent: { icon: DollarSign, dotClass: 'bg-orange-500' },
  status_changed: { icon: Clock, dotClass: 'bg-purple-500' },
  message_sent: { icon: MessageSquare, dotClass: 'bg-blue-500' },
  photo_shared: { icon: Camera, dotClass: 'bg-pink-500' },
  accommodation_added: { icon: Bed, dotClass: 'bg-green-500' },
  excursion_added: { icon: MapPin, dotClass: 'bg-green-500' },
  restaurant_added: { icon: Utensils, dotClass: 'bg-green-500' },
  transport_added: { icon: Plane, dotClass: 'bg-green-500' },
};

const MILESTONE_TYPE_CONFIG: Record<string, { dotClass?: string }> = {
  FINAL_PAYMENT_DUE: { dotClass: 'bg-amber-500' },
  SETTLEMENT_DUE: { dotClass: 'bg-orange-500' },
  COMMITMENT_REQUEST: { dotClass: 'bg-blue-500' },
  COMMITMENT_DEADLINE: { dotClass: 'bg-purple-500' },
  SETTLEMENT_COMPLETE: { dotClass: 'bg-green-500' },
  CUSTOM: { dotClass: 'bg-pink-500' },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getMeta(event: TimelineEvent): Record<string, unknown> {
  try {
    return JSON.parse(event.meta || '{}');
  } catch {
    return {};
  }
}

function getMilestoneType(meta: Record<string, unknown>): string | null {
  return (meta.type as string) ?? null;
}

function formatDate(dateString: string): string {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

// ─── Milestone status ─────────────────────────────────────────────────────────
type MilestoneStatus = 'PENDING' | 'COMPLETED' | 'OVERDUE' | 'SKIPPED';

function computeMilestoneStatus(
  event: TimelineEvent,
  meta: Record<string, unknown>,
): MilestoneStatus {
  const title = event.title ?? '';
  const icon = event.icon ?? '';
  const effectiveDate = event.effectiveDate;
  const isSkipped = meta.isSkipped === true;

  if (isSkipped) return 'SKIPPED';
  if (title.startsWith('Completed:') || icon === 'CheckCircle') return 'COMPLETED';
  if (effectiveDate && new Date(effectiveDate) < new Date()) return 'OVERDUE';
  return 'PENDING';
}

const STATUS_BADGE_CLASSES: Record<MilestoneStatus, string> = {
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  SKIPPED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

// ─── Dropdown Menu ─────────────────────────────────────────────────────────────
interface MilestoneDropdownProps {
  milestoneId: string;
  tripId?: string;
  userId?: string;
  status: MilestoneStatus;
  milestoneType: string | null;
  isOrganizer: boolean;
  memberIds?: string[];
  milestone?: TimelineEvent;
  onEditMilestone?: (milestoneId: string) => void;
}

function MilestoneDropdown({
  milestoneId,
  tripId,
  userId,
  status,
  milestoneType,
  isOrganizer,
  memberIds,
  milestone,
  onEditMilestone,
}: MilestoneDropdownProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const isCompleted = status === 'COMPLETED';
  const isSkipped = status === 'SKIPPED';

  const handleMarkComplete = async () => {
    if (!userId) return;
    setOpen(false);
    await api.updateMilestoneCompletion(milestoneId, userId, 'COMPLETED');
    window.location.reload();
  };

  const handleMarkIncomplete = async () => {
    if (!userId) return;
    setOpen(false);
    await api.updateMilestoneCompletion(milestoneId, userId, 'PENDING');
    window.location.reload();
  };

  const handleSkip = async () => {
    setOpen(false);
    await api.updateMilestone(milestoneId, { isSkipped: true });
    window.location.reload();
  };

  const handleUnskip = async () => {
    setOpen(false);
    await api.updateMilestone(milestoneId, { isSkipped: false });
    window.location.reload();
  };

  const handleEdit = () => {
    setOpen(false);
    onEditMilestone?.(milestoneId);
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setOpen(false);
    await api.deleteMilestone(milestoneId);
    window.location.reload();
  };

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => { setOpen((v) => !v); setConfirmDelete(false); }}
        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus:opacity-100 group-hover:opacity-100"
        aria-label="Milestone actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-popover shadow-md animate-in fade-in-0 zoom-in-95">
          <div className="py-1">
            {/* Mark Complete / Mark Incomplete — visible to all */}
            {!isCompleted ? (
              <DropdownItem icon={<Check className="h-4 w-4" />} onClick={handleMarkComplete}>
                Mark Complete
              </DropdownItem>
            ) : (
              <DropdownItem icon={<RotateCcw className="h-4 w-4" />} onClick={handleMarkIncomplete}>
                Mark Incomplete
              </DropdownItem>
            )}

            {/* Edit — available to all users */}
            <DropdownItem icon={<Pencil className="h-4 w-4" />} onClick={handleEdit}>
              Edit
            </DropdownItem>

            {/* Organizer-only actions */}
            {isOrganizer && (
              <>
                <div className="my-1 border-t border-border" />
                {status === 'PENDING' || status === 'OVERDUE' ? (
                  <DropdownItem icon={<SkipForward className="h-4 w-4" />} onClick={handleSkip}>
                    Skip
                  </DropdownItem>
                ) : isSkipped ? (
                  <DropdownItem icon={<SkipForward className="h-4 w-4" />} onClick={handleUnskip}>
                    Unskip
                  </DropdownItem>
                ) : null}

                <DropdownItem
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={handleDelete}
                  danger={!confirmDelete}
                  className={confirmDelete ? 'bg-red-50 text-red-600 dark:bg-red-950' : ''}
                >
                  {confirmDelete ? 'Confirm Delete' : 'Delete'}
                </DropdownItem>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  icon,
  children,
  onClick,
  danger,
  className,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950'
          : 'text-foreground hover:bg-accent dark:text-foreground dark:hover:bg-accent',
        className ?? '',
      )}
    >
      {icon}
      {children}
    </button>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface TimelineEventRowProps {
  event: TimelineEvent;
  tripId?: string;
  userId?: string;
  isOrganizer?: boolean;
  memberIds?: string[];
  className?: string;
  onEditMilestone?: (milestoneId: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────
export function TimelineEventRow({
  event,
  tripId,
  userId,
  isOrganizer,
  memberIds = [],
  className,
  onEditMilestone,
}: TimelineEventRowProps) {
  const meta = getMeta(event);

  // Icon
  let dotClass: string;
  let DotIcon: React.ElementType;

  if (event.kind === 'MILESTONE') {
    const milestoneType = getMilestoneType(meta);
    const config = milestoneType ? MILESTONE_TYPE_CONFIG[milestoneType] : null;
    dotClass = config?.dotClass ?? KIND_CONFIG.MILESTONE.dotClass!;
    DotIcon = KIND_CONFIG.MILESTONE.icon;
  } else if (event.kind === 'EVENT') {
    const config = event.eventType ? EVENT_TYPE_ICONS[event.eventType] : null;
    dotClass = config?.dotClass ?? KIND_CONFIG.EVENT.dotClass!;
    DotIcon = config?.icon ?? KIND_CONFIG.EVENT.icon;
  } else if (event.kind === 'ACTIVITY_START') {
    dotClass = KIND_CONFIG.ACTIVITY_START.dotClass!;
    DotIcon = KIND_CONFIG.ACTIVITY_START.icon;
  } else {
    dotClass = KIND_CONFIG.ACTIVITY_END.dotClass!;
    DotIcon = KIND_CONFIG.ACTIVITY_END.icon;
  }

  // Label text
  let label: string;
  let badge: string | null = null;

  if (event.kind === 'MILESTONE') {
    label = event.title ?? meta.name as string ?? 'Milestone';
    const milestoneType = getMilestoneType(meta);
    // Only show type badge for CUSTOM milestones; other types display their icon via MILESTONE_TYPE_CONFIG
    if (milestoneType === 'CUSTOM') {
      badge = milestoneType.replace(/_/g, ' ');
    }
  } else if (event.kind === 'EVENT') {
    label = event.description ?? event.title ?? '';
  } else if (event.kind === 'ACTIVITY_START') {
    label = `Check-in: ${event.title ?? ''}`;
  } else {
    label = `Check-out: ${event.title ?? ''}`;
  }

  // Status badge (milestones only)
  const milestoneStatus: MilestoneStatus | null =
    event.kind === 'MILESTONE' ? computeMilestoneStatus(event, meta) : null;
  const milestoneType = event.kind === 'MILESTONE' ? getMilestoneType(meta) : null;

  return (
    <div
      className={cn(
        'group flex h-11 min-h-11 items-center gap-3 px-1',
        className,
      )}
    >
      {/* Icon dot */}
      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-background">
        <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', dotClass)} />
      </div>

      {/* Label */}
      <span className="flex-1 truncate text-sm">{label}</span>

      {/* Milestone type badge */}
      {badge && (
        <span className="flex-shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900 dark:text-amber-300">
          {badge}
        </span>
      )}

      {/* Status badge (milestones only) */}
      {milestoneStatus && (
        <span
          className={cn(
            'flex-shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold',
            STATUS_BADGE_CLASSES[milestoneStatus],
          )}
        >
          {milestoneStatus.charAt(0) + milestoneStatus.slice(1).toLowerCase()}
        </span>
      )}

      {/* Timestamp */}
      <span className="flex-shrink-0 text-xs text-muted-foreground">
        {formatDate(event.effectiveDate)}
      </span>

      {/* Dropdown menu (milestones only) */}
      {event.kind === 'MILESTONE' && event.sourceId && tripId && userId && (
        <MilestoneDropdown
          milestoneId={event.sourceId}
          tripId={tripId}
          userId={userId}
          status={milestoneStatus!}
          milestoneType={milestoneType}
          isOrganizer={isOrganizer ?? false}
          memberIds={memberIds}
          milestone={event}
          onEditMilestone={onEditMilestone}
        />
      )}
    </div>
  );
}
