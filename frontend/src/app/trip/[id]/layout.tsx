'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Tabs } from '@/components/tabs';
import { HeroImagePicker } from '@/components/trip/HeroImagePicker';
import { api } from '@/services/api';
import { Trip, TripMember, HeroImage } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { formatDateRange } from '@/lib/utils';
import { CalendarDays, MapPin, Sparkles, Users, Pencil } from 'lucide-react';

const allTripTabs = [
  { id: 'overview', label: 'Overview', href: '/overview' },
  { id: 'activities', label: 'Activities', href: '/activities' },
  { id: 'timeline', label: 'Timeline', href: '/timeline' },
  { id: 'chat', label: 'Chat', href: '/chat' },
  { id: 'payments', label: 'Payments', href: '/payments' },
  { id: 'memories', label: 'Memories', href: '/memories' },
];

const viewerTabs = allTripTabs.filter(t => t.id === 'overview' || t.id === 'activities');

const formatPanelValue = (value?: string | null) => {
  if (!value) return 'Loading';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

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
  const [memberCount, setMemberCount] = useState(0);
  const [heroPickerOpen, setHeroPickerOpen] = useState(false);
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
        setMemberCount(membersResult.data.length);
        const myMembership = membersResult.data.find((m: TripMember) => m.userId === user.id);
        if (myMembership) {
          setUserRole(myMembership.role);
        }
      }
    };
    fetchTripAndMembers();
  }, [tripId, user?.id]);

  const visibleTabs = userRole === 'VIEWER' ? viewerTabs : allTripTabs;
  const canEditHero = userRole === 'OWNER' || userRole === 'EDITOR';

  const handleHeroSelect = async (heroImage: HeroImage) => {
    if (!trip) return;
    await api.updateTripHeroImage(trip.id, heroImage.id);
    const result = await api.getTrip(tripId);
    if (result.data) setTrip(result.data);
  };

  return (
    <PageLayout
      title={trip?.name || `Trip ${tripId}`}
      stickyHeader={false}
      className="px-0 pb-24 pt-0 sm:pb-8"
    >
      <main className="px-4 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section 
            className="overflow-hidden rounded-lg border border-border/70 glass shadow-[var(--travel-card-shadow)]"
            style={trip?.heroImage ? {
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%), url('/images/heroes/${trip.heroImage.filename}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : undefined}
          >
            <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Trip folders
                </div>
                <div className="flex items-center gap-3">
                  <h1 className="font-display text-4xl font-bold leading-tight text-glass sm:text-5xl">
                    {trip?.name || `Trip ${tripId}`}
                  </h1>
                  {canEditHero && (
                    <span className="mt-2 rounded-lg bg-black/30 p-1.5 hover:bg-black/50">
                      <button
                        onClick={() => setHeroPickerOpen(true)}
                        className="text-white/90 hover:text-white"
                        title="Change cover image"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm font-medium text-muted-foreground">
                  {trip?.destination && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary" />
                      {trip.destination}
                    </span>
                  )}
                  {trip?.startDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      {formatDateRange(trip.startDate, trip.endDate)}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-primary" />
                    {memberCount || 0} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[25rem]">
                <div className="rounded-lg border border-border/70 bg-card/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
                  <p className="mt-2 text-lg font-bold text-foreground">{formatPanelValue(trip?.status)}</p>
                </div>
                <div className="rounded-lg border border-border/70 bg-card/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Access</p>
                  <p className="mt-2 text-lg font-bold text-foreground">{formatPanelValue(trip?.style || 'Trip')}</p>
                </div>
                <div className="col-span-2 rounded-lg border border-border/70 bg-card/70 p-4 sm:col-span-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Role</p>
                  <p className="mt-2 text-lg font-bold text-foreground">{formatPanelValue(userRole || 'Member')}</p>
                </div>
              </div>
            </div>

            <Tabs tabs={visibleTabs} basePath={`/trip/${tripId}`} />
          </section>

          <div className="pt-6">
            {children}
          </div>
        </div>
      </main>

      <HeroImagePicker
        isOpen={heroPickerOpen}
        onClose={() => setHeroPickerOpen(false)}
        currentHeroImageId={trip?.heroImage?.id}
        tripId={tripId}
        onSelect={handleHeroSelect}
      />
    </PageLayout>
  );
}
