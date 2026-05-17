'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Award,
  CalendarDays,
  ChevronRight,
  Compass,
  Crown,
  Crosshair,
  Loader2,
  Mail,
  MapPin,
  Plane,
  Plus,
  Search,
  ShieldCheck,
  Waves,
  X,
} from 'lucide-react';
import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { PublicBrowseLocationPanel } from '@/components/browse/public-browse-location-panel';
import { NotificationBell } from '@/components/notification/notification-bell';
import { PendingInvites } from '@/components/notification/pending-invites';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { TripCard } from '@/components/trip-card';
import { UserMenu } from '@/components/user-menu';
import { useTripStore } from '@/store';

const heroImage =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1800&q=85';

const destinations = [
  {
    title: 'Mykonos',
    price: '$199',
    image:
      'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'San Andres',
    price: '$249',
    image:
      'https://images.unsplash.com/photo-1540202404-a2f29016b523?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Maldives',
    price: '$299',
    image:
      'https://images.unsplash.com/photo-1512100356356-de1b84283e18?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Croatia',
    price: '$239',
    image:
      'https://images.unsplash.com/photo-1555990538-c48b568469b3?auto=format&fit=crop&w=900&q=80',
  },
];

const adventures = [
  {
    title: 'Coastal Cruise',
    image:
      'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Sailing',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Camping',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Hiking',
    image:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Scuba Diving',
    image:
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=900&q=80',
  },
];

const awards = [
  {
    title: 'Attractions',
    image:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=75',
  },
  {
    title: 'Hotels',
    image:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=400&q=75',
  },
  {
    title: 'Resorts',
    image:
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=400&q=75',
  },
  {
    title: 'Landmarks',
    image:
      'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=400&q=75',
  },
  {
    title: 'Beaches',
    image:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=400&q=75',
  },
  {
    title: 'Islands',
    image:
      'https://images.unsplash.com/photo-1505881502353-a1986add3762?auto=format&fit=crop&w=400&q=75',
  },
];

const reasons = [
  {
    Icon: ShieldCheck,
    title: 'Guarantee',
    copy: 'Plans stay organized, visible, and easy to adjust as the group changes.',
  },
  {
    Icon: Crown,
    title: 'Service',
    copy: 'Invite friends, browse ideas, and track decisions without losing the thread.',
  },
  {
    Icon: Award,
    title: 'Experience',
    copy: 'A richer travel board that feels closer to a boutique agency than a spreadsheet.',
  },
];

const navItems = [
  { label: 'Home', href: '/dashboard' },
  { label: 'Browse', href: '/browse' },
  { label: 'Friends', href: '/friends' },
  { label: 'Messages', href: '/messages' },
];

const desktopQuickActions = [
  { label: 'Browse events', href: '/browse', Icon: Compass },
  { label: 'Plan new trip', href: '/trip/new', Icon: Plus },
  { label: 'Trip calendar', href: '/feed', Icon: CalendarDays },
];

export default function DashboardPage() {
  const router = useRouter();
  const { trips, isLoading, error, fetchTrips } = useTripStore();

  // Browse location state
  const [browseCity, setBrowseCity] = useState('');
  const [browseState, setBrowseState] = useState('');
  const [browseCountry, setBrowseCountry] = useState('US');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    async function loadProfileLocation() {
      try {
        const { api } = await import('@/services/api');
        const user = await api.getCurrentUser();
        const { city, state, country } = user.data || {};
        if (city && !browseCity) setBrowseCity(city);
        if (state && !browseState) setBrowseState(state);
        if (country && !browseCountry) setBrowseCountry(country);
      } catch {}
    }
    loadProfileLocation();
  }, [browseCity, browseState, browseCountry]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { api } = await import('@/services/api');
          const result = await api.reverseGeocodeLocation(position.coords.latitude, position.coords.longitude);
          const loc = result.data;
          if (loc) {
            setBrowseCity(loc.city || '');
            setBrowseState(loc.state || '');
            setBrowseCountry(loc.country || 'US');
          }
        } catch {} finally {
          setIsLoadingLocation(false);
        }
      },
      () => setIsLoadingLocation(false)
    );
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const activeTrips = trips.filter(
    (trip) => !['COMPLETED', 'CANCELLED'].includes(trip.status)
  );
  const pastTrips = trips.filter((trip) =>
    ['COMPLETED', 'CANCELLED'].includes(trip.status)
  );
  const hasTrips = trips.length > 0;

  return (
    <div className="min-h-screen">
      <header className="absolute left-0 right-0 top-0 z-30 w-full">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-foreground sm:px-6 lg:px-8">
          
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-left"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card backdrop-blur">
              <Compass className="h-6 w-6 text-foreground" />
            </div>
            <span className="font-display text-2xl font-bold leading-none text-foreground">
              Trip Planner
            </span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-muted-foreground lg:flex">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1 backdrop-blur">
            <ThemeSwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      

      <main className="min-h-screen pt-16">
        <section className="relative min-h-[480px] sm:min-h-[520px] lg:min-h-[580px]">
          <div className="relative mx-auto flex max-w-[1500px] flex-col justify-start px-4 sm:px-6 lg:px-10">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
                <p className="mb-4 font-script text-2xl font-semibold text-primary drop-shadow md:text-4xl">
                  Explore the World with us.
                </p>
                <h1 className="font-display text-5xl font-bold leading-[0.95] text-foreground sm:text-6xl lg:text-7xl xl:text-8xl">
                  Your Dream Vacation Awaits
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
                  Build beautiful group trips, compare destinations, and keep the
                  whole crew moving from first idea to final booking.
                </p>
                <div className="mt-8 hidden items-center gap-3 lg:flex">
                  <button
                    onClick={() => router.push('/trip/new')}
                    className="rounded-md bg-[#008c95] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-xl shadow-black/20 transition hover:bg-[#007681]"
                  >
                    Start Planning
                  </button>
                  <button
                    onClick={() => router.push('/browse')}
                    className="rounded-md border border-border bg-card px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-foreground backdrop-blur transition hover:bg-accent"
                  >
                    Browse Events
                  </button>
                </div>
              </div>

              <aside className="hidden rounded-lg border border-border/50 bg-card/60 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Desktop Planner
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold text-foreground">
                  Plan faster on a wide canvas.
                </h2>
                <div className="mt-6 space-y-3">
                  {desktopQuickActions.map(({ label, href, Icon }) => (
                    <button
                      key={href}
                      onClick={() => router.push(href)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left transition hover:bg-accent"
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <Icon className="h-4 w-4" />
                        {label}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/20 pt-5 text-center">
                  <div>
                    <p className="font-display text-2xl font-bold">{activeTrips.length}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Active
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{pastTrips.length}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Past
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{trips.length}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                      Total
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="bg-transparent py-14 lg:py-20">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-10">
            <div className="grid gap-8 xl:grid-cols-[300px_minmax(0,1fr)]">
              <aside className="hidden xl:block">
                <div className="sticky top-6 rounded-lg border border-[#dce8e5] bg-white/82 p-6 shadow-xl shadow-[#0d4e5b]/8 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#008c95]">
                    Workspace
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-bold leading-tight">
                    Your trip command center
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-[#6d7a78]">
                    Desktop mode gives planning room for trip cards, quick
                    actions, and status at a glance.
                  </p>
                  <div className="mt-6 space-y-3">
                    {desktopQuickActions.map(({ label, href, Icon }) => (
                      <button
                        key={href}
                        onClick={() => router.push(href)}
                        className="flex w-full items-center gap-3 rounded-md border border-[#dce8e5] bg-[#f7fbfa] px-4 py-3 text-left text-sm font-bold text-[#20312f] transition hover:border-[#008c95] hover:text-[#008c95]"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>

              <div>
                <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#008c95]">
                      Your Trips
                    </p>
                    <h2 className="font-display text-3xl font-bold lg:text-4xl">
                      Active & Upcoming
                    </h2>
                  </div>
                  <button
                    onClick={() => router.push('/trip/new')}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#008c95] px-5 text-sm font-bold text-[#008c95] transition hover:bg-[#008c95] hover:text-white"
                  >
                    <Plane className="h-4 w-4" />
                    New Trip
                  </button>
                </div>
                {isLoading && trips.length === 0 ? (
                  <div className="flex h-52 items-center justify-center rounded-lg bg-white/80 shadow-lg">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#008c95] border-t-transparent" />
                  </div>
                ) : activeTrips.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#90c9c8] bg-white/82 p-10 text-center shadow-lg">
                    <Waves className="mx-auto h-10 w-10 text-[#008c95]" />
                    <h3 className="mt-4 font-display text-2xl font-bold">
                      No active trips yet
                    </h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7a78]">
                      Start the first shared plan and give your crew somewhere
                      beautiful to gather ideas.
                    </p>
                    <button
                      onClick={() => router.push('/trip/new')}
                      className="mt-5 rounded-md bg-[#008c95] px-5 py-3 text-sm font-bold text-white"
                    >
                      Create Your First Trip
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                    {activeTrips.map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        memberCount={trip._count?.members}
                        onClick={() => router.push(`/trip/${trip.id}`)}
                      />
                    ))}
                  </div>
                )}

                {pastTrips.length > 0 && (
                  <div className="mt-12">
                    <h2 className="mb-4 font-display text-2xl font-bold text-[#53615f]">
                      Past Trips
                    </h2>
                    <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                      {pastTrips.map((trip) => (
                        <TripCard
                          key={trip.id}
                          trip={trip}
                          memberCount={trip._count?.members}
                          onClick={() => router.push(`/trip/${trip.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-transparent px-4 py-14 text-center text-muted-foreground">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-card shadow">
              <Compass className="h-10 w-10 text-foreground" />
            </div>
            <span className="font-display text-5xl font-bold text-foreground">Trip Planner</span>
          </div>
          <nav className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm font-semibold">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}>
                {item.label}
              </button>
            ))}
          </nav>
          <p className="mt-8 text-xs text-muted-foreground">
            Copyright 2026 Trip Planner | All Rights Reserved.
          </p>
        </div>
      </footer>

      <BottomTabBar />
    </div>
  );
}
