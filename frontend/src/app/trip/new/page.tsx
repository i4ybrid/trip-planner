'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarDays,
  Check,
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
import { DateTimeField } from '@/components/ui/date-time-field';
import { useFormSubmit } from '@/hooks/useFormSubmit';
import { cn } from '@/lib/utils';
import type { TripStyle } from '@/types';

function normalizeDateForSubmit(dateStr: string, isEndDate: boolean): string | undefined {
  if (!dateStr) return undefined;
  if (!dateStr.includes('T')) {
    // Date-only, no time component — apply default time
    return `${dateStr}T${isEndDate ? '23:59' : '00:00'}`;
  }
  return dateStr;
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
        <form onSubmit={handleSubmit} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-lg border border-white/20 bg-white/14 p-5 md:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-glass">Trip details</h2>
                <p className="mt-1 text-sm text-glass-muted">
                  Keep this lightweight. You can tune dates, milestones, and payments after creation.
                </p>
              </div>
            </div>

            {(hookError || error) && (
              <div className="mb-5 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-200">
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
                variant="glass"
                className="h-12"
                required
              />

              <Textarea
                label="Description"
                placeholder="What is the shape of this trip?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                variant="glass"
                className="min-h-28"
              />

              <Input
                label="Destination"
                placeholder="Hawaii, Lisbon, New York..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                variant="glass"
                className="h-12"
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
          </div>

          <aside className="grid gap-4 lg:grid-cols-2 xl:block xl:space-y-4">
            <div className="rounded-lg border border-white/20 bg-white/14 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-glass">Invite style</h2>
                  <p className="mt-1 text-sm text-glass-muted">Choose how people join from invite links.</p>
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
                        'flex min-h-20 items-start gap-3 rounded-lg border border-white/20 bg-white/14 p-3 text-left transition-all',
                        selected
                          ? 'border-white/40 bg-white/20 shadow-sm'
                          : 'hover:border-white/40 hover:bg-white/20'
                      )}
                    >
                      <span className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                        selected ? 'bg-white/30 text-white' : 'bg-white/14 text-white/70'
                      )}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 font-semibold text-white">
                          {option.title}
                          {selected && <Check className="h-4 w-4 text-white" />}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-glass-muted">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 border-t border-white/20 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/public-events/new')}
                  aria-describedby="public-event-tooltip"
                  className="group relative flex w-full items-start gap-3 rounded-lg border border-white/20 bg-white/14 p-3 text-left transition-all hover:border-white/40 hover:bg-white/20"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/14 text-white/70">
                    <Radio className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold text-glass">Create public event</span>
                    <span className="mt-1 block text-sm leading-5 text-glass-muted">
                      Use the event workflow for a promoted public listing.
                    </span>
                  </span>
                  <span
                    id="public-event-tooltip"
                    role="tooltip"
                    className="pointer-events-none absolute bottom-[calc(100%+0.5rem)] left-3 right-3 z-20 rounded-lg border border-white/20 bg-[#1B8A8A] px-3 py-2 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Public event promotion requires a premium payment.
                  </span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-white/20 bg-white/14 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-glass-muted">Next up</p>
              <div className="mt-4 space-y-3 text-sm text-glass-muted">
                <p className="flex gap-2">
                  <Plane className="mt-0.5 h-4 w-4 shrink-0 text-glass-muted" />
                  Add activities and collect votes.
                </p>
                <p className="flex gap-2">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-glass-muted" />
                  Milestones generate once dates are set.
                </p>
                <p className="flex gap-2">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-glass-muted" />
                  Invite travelers from the trip dashboard.
                </p>
              </div>
            </div>
          </aside>

          <div className="flex flex-col-reverse gap-3 rounded-lg border border-white/20 bg-white/14 p-3 sm:flex-row sm:items-center sm:justify-between xl:col-span-2">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="gap-2 text-white/70 hover:text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" size="lg" disabled={!canSubmit} variant="glass" className="gap-2 rounded-lg">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plane className="h-5 w-5" />}
              {isSubmitting ? 'Creating...' : 'Create Trip'}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
