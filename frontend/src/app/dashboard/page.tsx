'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { TripCard, EmptyState, Button } from '@/components';
import { ArrowRight, Compass, Plane, PlusCircle } from 'lucide-react';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { PendingInvites } from '@/components/notification/pending-invites';

export default function DashboardPage() {
  const router = useRouter();
  const { trips, isLoading, error, fetchTrips } = useTripStore();

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const activeTrips = trips.filter(
    (t) => !['COMPLETED', 'CANCELLED'].includes(t.status)
  );
  const pastTrips = trips.filter((t) =>
    ['COMPLETED', 'CANCELLED'].includes(t.status)
  );
  const hasTrips = trips.length > 0;

  const handleTripClick = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-farmhouse">
      <LeftSidebar />
      
      <AppHeader />

      <main className="ml-sidebar px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto max-w-6xl">
          {error && (
            <div className="mb-6 rounded-lg bg-error/10 border border-error/20 p-4 text-error">
              {error}
            </div>
          )}

          <section className="mb-6">
            <PendingInvites onInviteProcessed={fetchTrips} />
          </section>

          <section className="travel-hero mb-8 overflow-hidden rounded-lg travel-card-shadow">
            <div className="relative min-h-[280px]">
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(12,64,52,0.92)_0%,rgba(20,91,70,0.74)_48%,rgba(30,124,92,0.36)_100%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(190,239,211,0.34),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.08))]" />
              <div className="relative flex min-h-[280px] flex-col justify-between gap-8 px-5 py-7 text-white sm:px-8 lg:flex-row lg:items-end lg:px-10 lg:py-10">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-semibold backdrop-blur">
                    {hasTrips ? <Compass className="h-4 w-4" /> : <Plane className="h-4 w-4" />}
                    {hasTrips ? 'Keep the next idea moving' : 'Start with the first destination'}
                  </div>
                  <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                    {hasTrips ? 'Find fresh plans for your next group trip.' : 'Create the first trip everyone can plan around.'}
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
                    {hasTrips
                      ? 'Browse public events, nearby ideas, and promoted plans when your crew is ready to add something new.'
                      : 'Set up a trip space first, then invite friends, compare ideas, and turn loose travel talk into a shared plan.'}
                  </p>
                </div>

                <div className="w-full max-w-sm rounded-lg border border-white/20 bg-white/14 p-4 backdrop-blur-md lg:mb-1">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/18 text-white">
                      {hasTrips ? <Compass className="h-5 w-5" /> : <PlusCircle className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold">{hasTrips ? 'Browse for new trips' : 'Create your first trip'}</p>
                      <p className="text-sm text-white/70">
                        {hasTrips ? 'Explore what is happening nearby.' : 'Open a planning space for the crew.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={() => router.push(hasTrips ? '/browse' : '/trip/new')}
                      className="h-11 w-full gap-2 bg-card text-card-foreground shadow-lg shadow-black/10 hover:bg-card/95"
                    >
                      {hasTrips ? <Compass className="h-4 w-4 text-primary" /> : <Plane className="h-4 w-4 text-primary" />}
                      {hasTrips ? 'Browse Events' : 'Create a Trip'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => router.push(hasTrips ? '/trip/new' : '/browse')}
                      variant="outline"
                      className="h-11 w-full gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20"
                    >
                      {hasTrips ? <Plane className="h-4 w-4" /> : <Compass className="h-4 w-4" />}
                      {hasTrips ? 'Create New Trip' : 'Browse Events'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Trips</p>
                <h2 className="font-display text-3xl font-bold text-foreground">Active & Upcoming</h2>
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                Destination cards, member counts, and dates are tuned for quick scanning while you coordinate the fun parts.
              </p>
            </div>
            {isLoading && trips.length === 0 ? (
              <div className="flex h-52 items-center justify-center rounded-lg border border-border/70 bg-card/70">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : activeTrips.length === 0 ? (
              <EmptyState
                title="No active trips"
                description="Start planning your next adventure with friends!"
                action={
                  <Button onClick={() => router.push('/trip/new')}>
                    Create Your First Trip
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {activeTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    memberCount={trip._count?.members}
                    onClick={() => handleTripClick(trip.id)}
                  />
                ))}
                <div
                  className="flex min-h-72 cursor-pointer items-center justify-center rounded-lg border border-dashed border-primary/45 bg-card/70 p-6 text-center transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:bg-primary/10 hover:shadow-xl"
                  onClick={() => router.push('/trip/new')}
                >
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                      <Plane className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-bold text-foreground">New Trip</p>
                    <p className="mt-1 text-sm text-muted-foreground">Sketch the first stop.</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {pastTrips.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-2xl font-bold text-muted-foreground">Past Trips</h2>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {pastTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    memberCount={trip._count?.members}
                    onClick={() => handleTripClick(trip.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
