'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { Tabs } from '@/components/tabs';
import { api } from '@/services/api';
import { Trip, TripMember } from '@/types';
import { useAuth } from '@/hooks/use-auth';

const allTripTabs = [
  { id: 'overview', label: 'Overview', href: '' },
  { id: 'activities', label: 'Activities', href: '/activities' },
  { id: 'timeline', label: 'Timeline', href: '/timeline' },
  { id: 'chat', label: 'Chat', href: '/chat' },
  { id: 'payments', label: 'Payments', href: '/payments' },
  { id: 'memories', label: 'Memories', href: '/memories' },
];

const viewerTabs = allTripTabs.filter(t => t.id === 'overview' || t.id === 'activities');

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchTripAndMembers = async () => {
      const [tripResult, membersResult] = await Promise.all([
        api.getTrip(tripId),
        api.getTripMembers(tripId),
      ]);
      if (tripResult.data) {
        setTrip(tripResult.data);
      }
      if (membersResult.data && user?.id) {
        const myMembership = membersResult.data.find((m: TripMember) => m.userId === user.id);
        if (myMembership) {
          setUserRole(myMembership.role);
        }
      }
    };
    fetchTripAndMembers();
  }, [tripId, user?.id]);

  const visibleTabs = userRole === 'VIEWER' ? viewerTabs : allTripTabs;

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <AppHeader 
        title={trip?.name || `Trip ${tripId}`}
      />

      <div className="border-b border-border bg-background ml-sidebar">
        <Tabs tabs={visibleTabs} basePath={`/trip/${tripId}`} />
      </div>

      <main className="ml-sidebar p-6">
        {children}
      </main>
    </div>
  );
}
