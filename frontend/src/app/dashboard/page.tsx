'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { TripCard, EmptyState, Button } from '@/components';
import { Plane } from 'lucide-react';
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

  const handleTripClick = (tripId: string) => {
    router.push(`/trip/${tripId}`);
  };

  return (
    <div className="min-h-screen bg-theme-gradient">
      <LeftSidebar />
      
      <AppHeader />

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-4xl">
          {error && (
            <div className="mb-6 rounded-lg bg-error/10 border border-error/20 p-4 text-error">
              {error}
            </div>
          )}

          <section className="mb-6">
            <PendingInvites onInviteProcessed={fetchTrips} />
          </section>

          <section className="mb-10">
            <h2 className="mb-4 text-xl font-semibold flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              Active & Upcoming
            </h2>
            {isLoading && trips.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    memberCount={trip._count?.members}
                    onClick={() => handleTripClick(trip.id)}
                  />
                ))}
                <div
                  className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border p-6 transition-all duration-200 hover:border-primary hover:bg-primary/5 card-hover"
                  onClick={() => router.push('/trip/new')}
                >
                  <div className="text-center">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Plane className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">New Trip</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {pastTrips.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold text-muted-foreground">Past Trips</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
