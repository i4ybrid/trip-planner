'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { TripCard, EmptyState, Button } from '@/components';
import { CalendarDays, Compass, MapPin, Plane, Sparkles, Users } from 'lucide-react';
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
  const totalMembers = trips.reduce((sum, trip) => sum + (trip._count?.members || 0), 0);

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

          <section className="mb-8 rounded-lg border border-border/70 bg-gradient-to-r from-primary/8 via-primary/5 to-accent/8 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary shadow-sm">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">Discover Public Events</p>
                  <p className="text-sm text-muted-foreground">Browse promoted events near you or anywhere in the US.</p>
                </div>
              </div>
              <Button
                onClick={() => router.push('/browse')}
                className="gap-2 shrink-0 h-11 rounded-lg px-5"
              >
                <Compass className="h-4 w-4" />
                Browse Events
              </Button>
            </div>
          </section>

          {!isLoading && activeTrips.length === 0 && (
            <section className="travel-hero mb-8 overflow-hidden rounded-lg travel-card-shadow">
              <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
                <div className="max-w-2xl">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-medium text-white backdrop-blur">
                    <Sparkles className="h-4 w-4" />
                    Plan the next shared escape
                  </div>
                  <h1 className="font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                    Find the trip everyone says yes to.
                  </h1>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/82 sm:text-lg">
                    Build beautiful group plans, collect decisions, and keep every booking detail in one calm place.
                  </p>
                  <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="gap-2 bg-card text-card-foreground shadow-xl shadow-black/10 hover:bg-card/95"
                      onClick={() => router.push('/trip/new')}
                    >
                      <Plane className="h-5 w-5 text-primary" />
                      Create a Trip
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="gap-2 border-white/35 bg-white/10 text-white backdrop-blur hover:bg-white/20"
                      onClick={() => router.push('/browse')}
                    >
                      <Compass className="h-5 w-5" />
                      Browse Events
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          )}

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
