'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { Tabs } from '@/components/tabs';
import { api } from '@/services';
import { Trip } from '@/types';

const tripTabs = [
  { id: 'overview', label: 'Overview', href: '' },
  { id: 'activities', label: 'Activities', href: '/activities' },
  { id: 'timeline', label: 'Timeline', href: '/timeline' },
  { id: 'chat', label: 'Chat', href: '/chat' },
  { id: 'payments', label: 'Payments', href: '/payments' },
  { id: 'memories', label: 'Memories', href: '/memories' },
];

export default function TripLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const fetchTrip = async () => {
      const result = await api.getTrip(tripId);
      if (result.data) {
        setTrip(result.data);
      }
    };
    fetchTrip();
  }, [tripId]);

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <AppHeader 
        title={trip?.name || `Trip ${tripId}`}
      />

      <div className="border-b border-border bg-background ml-sidebar">
        <Tabs tabs={tripTabs} basePath={`/trip/${tripId}`} />
      </div>

      <main className="ml-sidebar p-6">
        {children}
      </main>
    </div>
  );
}
