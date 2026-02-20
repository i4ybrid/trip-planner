'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { TripCard, EmptyState, Button } from '@/components';

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

  const handleTripClick = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-2xl font-bold">TripPlanner</h1>
          <Button onClick={() => router.push('/trip/new')}>
            + New Trip
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-600">
            {error}
          </div>
        )}

        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Active & Upcoming</h2>
          {isLoading && trips.length === 0 ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : activeTrips.length === 0 ? (
            <EmptyState
              title="No active trips"
              description="Start planning your next adventure!"
              action={
                <Button onClick={() => router.push('/trip/new')}>
                  Create Trip
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip.id)}
                />
              ))}
              <div
                className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary"
                onClick={() => router.push('/trip/new')}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground">
                    +
                  </div>
                  <p className="text-sm text-muted-foreground">New Trip</p>
                </div>
              </div>
            </div>
          )}
        </section>

        {pastTrips.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold">Past Trips</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onClick={() => handleTripClick(trip.id)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
