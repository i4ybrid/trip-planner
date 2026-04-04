import { TimelineEvent, Milestone } from '@/types';
import { formatDistanceToNow, format } from 'date-fns';
import {
  UserPlus,
  UserX,
  UserMinus,
  Shield,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Receipt,
  Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const EVENT_TYPE_CONFIG: Record<
  string,
  { icon: React.ElementType; iconClass?: string }
> = {
  MEMBER_JOINED: { icon: UserPlus, iconClass: 'text-green-500' },
  INVITE_DECLINED: { icon: UserX, iconClass: 'text-red-500' },
  MEMBER_REMOVED: { icon: UserMinus, iconClass: 'text-red-500' },
  MEMBER_JOIN_WITHDRAWN: { icon: UserMinus, iconClass: 'text-orange-500' },
  ROLE_CHANGED: { icon: Shield, iconClass: 'text-purple-500' },
  JOIN_REQUEST_SENT: { icon: UserCheck, iconClass: 'text-blue-500' },
  JOIN_REQUEST_APPROVED: { icon: CheckCircle, iconClass: 'text-green-500' },
  JOIN_REQUEST_DENIED: { icon: XCircle, iconClass: 'text-red-500' },
};

const MILESTONE_TYPE_CONFIG: Record<string, { icon: React.ElementType; iconClass?: string }> = {
  FINAL_PAYMENT_DUE: { icon: DollarSign, iconClass: 'text-amber-500' },
  SETTLEMENT_DUE: { icon: Receipt, iconClass: 'text-orange-500' },
  COMMITMENT_REQUEST: { icon: UserCheck, iconClass: 'text-blue-500' },
  COMMITMENT_DEADLINE: { icon: Clock, iconClass: 'text-purple-500' },
  SETTLEMENT_COMPLETE: { icon: CheckCircle, iconClass: 'text-green-500' },
  CUSTOM: { icon: Flag, iconClass: 'text-pink-500' },
};

interface TimelineEventCardProps {
  event?: TimelineEvent;
  milestone?: Milestone;
  className?: string;
}

export function TimelineEventCard({ event, milestone, className }: TimelineEventCardProps) {
  // Resolve icon from event or milestone
  const config = event
    ? EVENT_TYPE_CONFIG[event.eventType ?? ''] ?? {
        icon: Clock,
        iconClass: 'text-muted-foreground',
      }
    : milestone
      ? MILESTONE_TYPE_CONFIG[milestone.type] ?? {
          icon: Flag,
          iconClass: 'text-muted-foreground',
        }
      : { icon: Clock, iconClass: 'text-muted-foreground' };

  const Icon = config.icon;

  return (
    <div className={cn('flex gap-3', className)}>
      {/* Icon */}
      <div
        className={cn(
          'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted',
          config.iconClass,
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {event && (
          <>
            <p className="text-sm font-medium leading-snug">{event.description}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
            </p>
          </>
        )}
        {milestone && (
          <>
            <p className="text-sm font-medium leading-snug">{milestone.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Due: {format(new Date(milestone.dueDate), 'MMMM d, yyyy')}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
