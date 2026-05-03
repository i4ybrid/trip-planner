import Link from 'next/link';
import { CalendarDays, Globe2, MapPin, Radio, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PublicEvent, Trip } from '@/types';
import { cn, formatDateRange } from '@/lib/utils';

/**
 * Shared presentation contract for private trips and public events.
 *
 * Public events intentionally extend the private trip presentation instead of
 * introducing a parallel UI vocabulary. Their extra fields should appear as
 * extension labels/panels: promotion, regional reach, organizer, and payment
 * state. Keep browse rows/cards/detail heroes mapped through this contract.
 */
export type EventKind = 'private' | 'public';

export interface EventPresentation {
  id: string;
  kind: EventKind;
  title: string;
  description?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  href: string;
  countLabel?: string;
  eyebrow: string;
  extensionLabel?: string;
}

export function privateTripToEventPresentation(trip: Trip): EventPresentation {
  const memberCount = trip._count?.members || 0;

  return {
    id: trip.id,
    kind: 'private',
    title: trip.name,
    description: trip.description,
    location: trip.destination || 'Destination TBD',
    startDate: trip.startDate,
    endDate: trip.endDate,
    href: `/trip/${trip.id}/overview`,
    countLabel: `${memberCount} traveler${memberCount === 1 ? '' : 's'}`,
    eyebrow: 'Private trip',
  };
}

export function publicEventToEventPresentation(event: PublicEvent): EventPresentation {
  return {
    id: event.id,
    kind: 'public',
    title: event.title,
    description: event.description || 'Organizer-managed public event',
    location: `${event.city}${event.state ? `, ${event.state}` : ''}`,
    startDate: event.startDate,
    endDate: event.endDate,
    href: `/public-events/${event.id}`,
    countLabel: `${event.regionRadiusMiles} mi promotion`,
    eyebrow: 'Public event',
    extensionLabel: 'Promoted',
  };
}

function EventIcon({ kind, compact = false }: { kind: EventKind; compact?: boolean }) {
  const Icon = kind === 'public' ? Globe2 : CalendarDays;
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg',
        compact ? 'h-10 w-10' : 'h-11 w-11',
        kind === 'public' ? 'bg-accent/15 text-accent' : 'bg-primary/10 text-primary'
      )}
    >
      <Icon className={compact ? 'h-4 w-4' : 'h-5 w-5'} />
    </div>
  );
}

export function EventResultRow({
  event,
  onClick,
}: {
  event: EventPresentation;
  onClick?: () => void;
}) {
  return (
    <Link
      href={event.href}
      onClick={onClick}
      className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-background/70"
    >
      <EventIcon kind={event.kind} compact />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-foreground">{event.title}</p>
          {event.extensionLabel && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              {event.extensionLabel}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {event.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location}</span>
            </span>
          )}
          <span>{event.startDate ? formatDateRange(event.startDate, event.endDate) : 'Dates TBD'}</span>
        </div>
      </div>
    </Link>
  );
}

export function EventResultCard({ event }: { event: EventPresentation }) {
  return (
    <Link href={event.href}>
      <Card className="h-full border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur transition-transform hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
          <EventIcon kind={event.kind} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl font-bold">{event.title}</p>
              {event.extensionLabel && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary">
                  {event.extensionLabel}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
              {event.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-primary" />
                  {event.location}
                </span>
              )}
              <span>{event.startDate ? formatDateRange(event.startDate, event.endDate) : 'Dates TBD'}</span>
            </div>
            {event.description && (
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
            )}
            {event.countLabel && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {event.kind === 'public' ? <Radio className="h-3.5 w-3.5 text-accent" /> : <Users className="h-3.5 w-3.5 text-accent" />}
                {event.countLabel}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
