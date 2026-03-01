'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { TripCard, EmptyState, Button } from '@/components';
import { Plane, Calendar, MapPin } from 'lucide-react';
import { api } from '@/services/api';
import { User, TripMember } from '@/types';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';

interface TripWithMembers {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  tripMasterId: string;
  coverImage?: string;
  createdAt: string;
  updatedAt: string;
  members: TripMember[];
}

interface MemberInfo {
  name: string;
  avatarUrl?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { trips, isLoading, error, fetchTrips } = useTripStore();
  const [membersMap, setMembersMap] = useState<Record<string, TripMember[]>>({});

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    const loadMembers = async () => {
      const memberPromises = trips.map(async (trip) => {
        try {
          const result = await api.getTripMembers(trip.id);
          return {
            tripId: trip.id,
            members: result.data || []
          };
        } catch (error) {
          console.error(`Failed to load members for trip ${trip.id}:`, error);
          return {
            tripId: trip.id,
            members: []
          };
        }
      });
      const results = await Promise.all(memberPromises);
      const map: Record<string, TripMember[]> = {};
      results.forEach(r => { map[r.tripId] = r.members; });
      setMembersMap(map);
    };
    if (trips.length > 0) {
      loadMembers();
    }
  }, [trips]);

  const getTripMembers = (tripId: string): TripMember[] => {
    return membersMap[tripId] || [];
  };

  const getMemberName = (member: TripMember) => {
    if (member.user?.name) return member.user.name;
    if (member.userId === 'user-1') return 'You';
    return 'Unknown User';
  };

  const getMemberInfo = (member: TripMember): MemberInfo => {
    const name = getMemberName(member);
    return {
      name,
      avatarUrl: member.user?.avatarUrl || undefined,
    };
  };

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
                {activeTrips.map((trip) => {
                  const members = getTripMembers(trip.id);
                  return (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      members={members.map(m => getMemberInfo(m))}
                      onClick={() => handleTripClick(trip.id)}
                    />
                  );
                })}
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
                {pastTrips.map((trip) => {
                  const members = getTripMembers(trip.id);
                  return (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      members={members.map(m => getMemberInfo(m))}
                      onClick={() => handleTripClick(trip.id)}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
