import { TimelineEvent } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import {
  UserPlus,
  UserX,
  UserMinus,
  Shield,
  UserCheck,
  CheckCircle,
  XCircle,
  Clock,
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

interface TimelineEventCardProps {
  event: TimelineEvent;
  className?: string;
}

export function TimelineEventCard({ event, className }: TimelineEventCardProps) {
  const config = EVENT_TYPE_CONFIG[event.eventType] ?? {
    icon: Clock,
    iconClass: 'text-muted-foreground',
  };
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
        <p className="text-sm font-medium leading-snug">{event.description}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}
