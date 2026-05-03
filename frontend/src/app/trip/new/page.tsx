'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Loader2,
  Lock,
  Plane,
  Radio,
  Users,
} from 'lucide-react';
import { useTripStore } from '@/store';
import { Button, Card, Input, Textarea } from '@/components';
import { PageLayout } from '@/components/page-layout';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { cn } from '@/lib/utils';
import type { TripStyle } from '@/types';

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'long',
  year: 'numeric',
});

const selectedDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function normalizeDateForSubmit(dateStr: string, isEndDate: boolean): string | undefined {
  if (!dateStr) return undefined;
  if (!dateStr.includes('T')) {
    // Date-only, no time component — apply default time
    return `${dateStr}T${isEndDate ? '23:59' : '00:00'}`;
  }
  return dateStr;
}

function formatDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildDateTimeValue(date: string, time: string): string {
  return date ? `${date}T${time || '09:00'}` : '';
}

function getDateTimeParts(value: string) {
  const [date = '', time = ''] = value.split('T');
  return {
    date,
    time: time || '09:00',
  };
}

function getMonthDays(viewDate: Date) {
  const firstOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const cursor = new Date(firstOfMonth);
  cursor.setDate(1 - firstOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + index);
    return day;
  });
}

interface DateTimeFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onInteract?: () => string | void;
}

function DateTimeField({ label, value, onChange, onInteract }: DateTimeFieldProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const selected = getDateTimeParts(value);
  const selectedDate = selected.date ? new Date(`${selected.date}T00:00`) : null;
  const [viewDate, setViewDate] = useState(selectedDate || new Date());
  const todayValue = formatDateValue(new Date());
  const monthDays = getMonthDays(viewDate);

  const handleOpenCalendar = () => {
    const interactionValue = onInteract?.();
    const nextSelected = getDateTimeParts(typeof interactionValue === 'string' ? interactionValue : value);
    if (nextSelected.date) {
      setViewDate(new Date(`${nextSelected.date}T00:00`));
    }
    setIsCalendarOpen((current) => !current);
  };

  const handleSelectDate = (date: Date) => {
    onChange(buildDateTimeValue(formatDateValue(date), selected.time));
    setIsCalendarOpen(false);
  };

  const handleTimeFocus = () => {
    onInteract?.();
  };

  const handleTimeChange = (time: string) => {
    onChange(buildDateTimeValue(selected.date || formatDateValue(new Date()), time));
  };

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_8.5rem]">
        <button
          type="button"
          onClick={handleOpenCalendar}
          className="flex h-12 min-w-0 items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/75 px-3 text-left text-sm text-foreground transition-colors hover:border-primary/40 hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
            <span className={cn('truncate', !selectedDate && 'text-muted-foreground')}>
              {selectedDate ? selectedDateFormatter.format(selectedDate) : 'Select date'}
            </span>
          </span>
        </button>

        <div className="flex h-12 items-center gap-2 rounded-lg border border-border/70 bg-background/75 px-3 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
          <Clock className="h-4 w-4 shrink-0 text-accent" />
          <input
            type="time"
            value={selected.time}
            onFocus={handleTimeFocus}
            onChange={(event) => handleTimeChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
          />
        </div>
      </div>

      {isCalendarOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full max-w-sm rounded-lg border border-border/70 bg-card/95 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-foreground">{monthFormatter.format(viewDate)}</p>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day} className="py-1">{day}</span>
            ))}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {monthDays.map((day) => {
              const dayValue = formatDateValue(day);
              const isSelected = selected.date === dayValue;
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isToday = dayValue === todayValue;

              return (
                <button
                  key={dayValue}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-lg text-sm font-medium transition-colors',
                    isSelected && 'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
                    !isSelected && isToday && 'border border-primary/50 text-primary',
                    !isSelected && !isToday && isCurrentMonth && 'text-foreground hover:bg-secondary',
                    !isSelected && !isToday && !isCurrentMonth && 'text-muted-foreground/45 hover:bg-secondary/70'
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewTripPage() {
  const router = useRouter();
  const { createTrip, error, clearError } = useTripStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [style, setStyle] = useState<TripStyle>('OPEN');

  const { isSubmitting, error: hookError, submitForm } = useFormSubmit({
    waitForNavigation: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await submitForm(async () => {
      const normalizedStart = normalizeDateForSubmit(startDate, false);
      const normalizedEnd = normalizeDateForSubmit(endDate, true);

      const trip = await createTrip({
        name,
        description: description || undefined,
        destination: destination || undefined,
        startDate: normalizedStart,
        endDate: normalizedEnd,
        style,
      });

      if (trip) {
        router.push(`/trip/${trip.id}`);
      }
    });
  };

  const canSubmit = Boolean(name.trim()) && !isSubmitting;
  const setEndDateFromStart = () => {
    if (!endDate && startDate) {
      setEndDate(startDate);
      return startDate;
    }
  };

  return (
    <PageLayout title="New Trip" showBack onBack={() => router.back()} className="px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <Card className="border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">Trip details</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Keep this lightweight. You can tune dates, milestones, and payments after creation.
                </p>
              </div>
            </div>

            {(hookError || error) && (
              <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {hookError || error}
              </div>
            )}

            <div className="grid gap-5">
              <Input
                id="name"
                label="Trip name"
                placeholder="Summer Vacation 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12 rounded-lg border-border/70 bg-background/75"
                required
              />

              <Textarea
                label="Description"
                placeholder="What is the shape of this trip?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="min-h-28 rounded-lg border-border/70 bg-background/75"
              />

              <Input
                label="Destination"
                placeholder="Hawaii, Lisbon, New York..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="h-12 rounded-lg border-border/70 bg-background/75"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <DateTimeField
                  label="Start"
                  value={startDate}
                  onChange={setStartDate}
                />
                <DateTimeField
                  label="End"
                  value={endDate}
                  onChange={setEndDate}
                  onInteract={setEndDateFromStart}
                />
              </div>
            </div>
          </Card>

          <aside className="grid gap-4 lg:grid-cols-2 xl:block xl:space-y-4">
            <Card className="border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Invite style</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose how people join from invite links.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {([
                  {
                    value: 'OPEN' as TripStyle,
                    icon: Users,
                    title: 'Open',
                    description: 'Invitees can join after accepting.',
                  },
                  {
                    value: 'MANAGED' as TripStyle,
                    icon: Lock,
                    title: 'Managed',
                    description: 'Organizers approve new members.',
                  },
                ]).map((option) => {
                  const Icon = option.icon;
                  const selected = style === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStyle(option.value)}
                      className={cn(
                        'flex min-h-20 items-start gap-3 rounded-lg border p-3 text-left transition-all',
                        selected
                          ? 'border-primary bg-primary/10 shadow-sm shadow-primary/10'
                          : 'border-border/70 bg-background/65 hover:border-primary/40 hover:bg-secondary/60'
                      )}
                    >
                      <span className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold">
                          {option.title}
                          {selected && <Check className="h-4 w-4 text-primary" />}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted-foreground">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-border/70 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/public-events/new')}
                  aria-describedby="public-event-tooltip"
                  className="group relative flex w-full items-start gap-3 rounded-lg border border-border/70 bg-background/65 p-3 text-left transition-all hover:border-primary/40 hover:bg-secondary/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Radio className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">Create public event</span>
                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                      Use the event workflow for a promoted public listing.
                    </span>
                  </span>
                  <span
                    id="public-event-tooltip"
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-3 right-3 z-20 rounded-lg border border-border/70 bg-popover px-3 py-2 text-xs font-medium text-popover-foreground opacity-0 shadow-[var(--travel-card-shadow)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Public event promotion requires a premium payment.
                  </span>
                </button>
              </div>
            </Card>

            <Card className="border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Next up</p>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <p className="flex gap-2">
                  <Plane className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Add activities and collect votes.
                </p>
                <p className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  Milestones generate once dates are set.
                </p>
                <p className="flex gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  Invite travelers from the trip dashboard.
                </p>
              </div>
            </Card>
          </aside>

          <div className="flex flex-col-reverse gap-3 rounded-lg border border-border/70 bg-card/85 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={!canSubmit} className="gap-2">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plane className="h-5 w-5" />}
              {isSubmitting ? 'Creating...' : 'Create Trip'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
