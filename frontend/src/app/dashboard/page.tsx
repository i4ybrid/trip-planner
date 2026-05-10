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
  Menu,
  Plane,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Waves,
} from 'lucide-react';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { PublicBrowseLocationPanel } from '@/components/browse/public-browse-location-panel';
import { NotificationBell } from '@/components/notification/notification-bell';
import { PendingInvites } from '@/components/notification/pending-invites';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { TripCard } from '@/components';
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
  { label: 'New Trip', href: '/trip/new' },
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

  // Pre-fill browse from user profile
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
    <div className="min-h-screen bg-stone-100">
      <header className="absolute left-0 right-0 top-0 z-30">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 text-white sm:px-6 lg:px-8">
          <button
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-left"
          >
            <Star className="h-8 w-8 fill-[#008c95] text-[#008c95]" />
            <span className="font-display text-2xl font-bold leading-none">
              Trip Planner
            </span>
          </button>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/90 lg:flex">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-2 py-1 backdrop-blur">
            <ThemeSwitcher />
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-farmhouse pb-24 lg:pb-0">
        <section className="relative min-h-[720px] overflow-hidden text-white sm:min-h-[760px] lg:min-h-[820px] xl:min-h-[900px]">
          <img
            src={heroImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,38,45,0.35)_0%,rgba(2,38,45,0.08)_42%,rgba(2,38,45,0.42)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#f7fbfa] to-transparent" />

          <div className="relative mx-auto flex min-h-[720px] max-w-[1500px] flex-col justify-center px-4 pt-20 sm:min-h-[760px] sm:px-6 lg:min-h-[820px] lg:px-10 xl:min-h-[900px]">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:text-left">
                <p className="mb-4 font-script text-2xl font-semibold text-white drop-shadow md:text-4xl">
                  Explore the World with us.
                </p>
                <h1 className="font-display text-5xl font-bold leading-[0.95] drop-shadow-xl sm:text-6xl lg:text-7xl xl:text-8xl">
                  Your Dream Vacation Awaits
                </h1>
                <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/88 sm:text-lg lg:mx-0">
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
                    className="rounded-md border border-white/45 bg-white/12 px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-white backdrop-blur transition hover:bg-white/20"
                  >
                    Browse Events
                  </button>
                </div>
              </div>

              <aside className="hidden rounded-lg border border-white/25 bg-white/14 p-5 text-white shadow-2xl shadow-black/20 backdrop-blur-xl lg:block">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                  Desktop Planner
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold">
                  Plan faster on a wide canvas.
                </h2>
                <div className="mt-6 space-y-3">
                  {desktopQuickActions.map(({ label, href, Icon }) => (
                    <button
                      key={href}
                      onClick={() => router.push(href)}
                      className="flex w-full items-center justify-between rounded-lg border border-white/18 bg-white/12 px-4 py-3 text-left transition hover:bg-white/20"
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
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/65">
                      Active
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{pastTrips.length}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/65">
                      Past
                    </p>
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold">{trips.length}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-white/65">
                      Total
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            <div className="mx-auto mt-10 w-full max-w-4xl lg:max-w-6xl">
              <div className="mx-auto flex w-fit overflow-hidden rounded-t-lg bg-[#008c95] text-xs font-bold uppercase tracking-[0.12em] text-white shadow-xl">
                {['Flights', 'Hotels', 'Tours'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => router.push(tab === 'Tours' ? '/trip/new' : '/browse')}
                    className="px-5 py-3 transition hover:bg-white/15"
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 rounded-lg border border-white/55 bg-white/88 p-3 text-left text-[#54615f] shadow-2xl backdrop-blur md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:rounded-t-none lg:p-4">
                {[
                  ['From', 'Where to?'],
                  ['To', 'Destination'],
                  ['Depart', 'Select dates'],
                  ['Travelers', '2 adults'],
                ].map(([label, value]) => (
                  <button
                    key={label}
                    onClick={() => router.push('/browse')}
                    className="flex min-h-16 items-center gap-3 rounded-md px-3 hover:bg-[#e7f7f5] lg:min-h-20"
                  >
                    <MapPin className="h-4 w-4 text-[#008c95]" />
                    <span>
                      <span className="block text-xs font-bold uppercase tracking-[0.12em] text-[#7c8b88]">
                        {label}
                      </span>
                      <span className="block text-sm font-semibold text-[#20312f]">
                        {value}
                      </span>
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => router.push('/browse')}
                  aria-label="Search packages"
                  className="flex min-h-16 items-center justify-center rounded-md bg-[#008c95] px-5 text-white shadow-lg shadow-[#008c95]/20 transition hover:bg-[#007681] lg:min-h-20"
                >
                  <Search className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-stone-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {error && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50/95 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <PendingInvites onInviteProcessed={fetchTrips} />

            <div className="mt-10 text-center">
              <h2 className="font-script text-4xl font-semibold text-[#20312f]">
                Browse Events
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#6d7a78]">
                Find public events happening near you or anywhere in the world.
              </p>
            </div>
            <div className="mt-8 rounded-lg border border-white/55 bg-white/88 p-4 text-left text-[#54615f] shadow-2xl backdrop-blur">
              <PublicBrowseLocationPanel
                city={browseCity}
                state={browseState}
                country={browseCountry}
                onCityChange={setBrowseCity}
                onStateChange={setBrowseState}
                onCountryChange={setBrowseCountry}
                onClearLocation={() => {
                  setBrowseCity('');
                  setBrowseState('');
                  setBrowseCountry('US');
                }}
              />
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Use my location', icon: Crosshair, action: handleUseMyLocation, loading: isLoadingLocation },
                { label: browseCity || browseState || 'Any location', icon: MapPin, action: () => router.push(`/browse${browseCity || browseState ? `?city=${encodeURIComponent(browseCity)}&state=${encodeURIComponent(browseState)}&country=${encodeURIComponent(browseCountry)}` : ''}`) },
              ].map(({ label, icon: Icon, action, loading }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center gap-3 rounded-lg bg-white/80 px-4 py-3 text-left text-sm font-semibold text-[#20312f] shadow-lg transition hover:bg-white"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#008c95]" />
                  ) : (
                    <Icon className="h-5 w-5 text-[#008c95]" />
                  )}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="relative min-h-[420px] overflow-hidden sm:min-h-[560px]">
          <img
            src="https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1800&q=85"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
          <button
            onClick={() => router.push('/browse')}
            aria-label="Browse travel experiences"
            className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-white/10 text-white backdrop-blur transition hover:scale-105 sm:h-32 sm:w-32"
          >
            <Plane className="h-10 w-10" />
          </button>
        </section>

        <section className="bg-[#f7fbfa] py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-script text-4xl font-semibold">
              Why Us?
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {reasons.map(({ Icon, title, copy }) => (
                <article
                  key={title}
                  className="min-h-56 rounded-lg border border-[#dce8e5] bg-white/76 p-8 text-center shadow-lg shadow-[#0d4e5b]/5 backdrop-blur"
                >
                  <Icon className="mx-auto h-7 w-7 text-[#008c95]" />
                  <h3 className="mt-5 font-display text-lg font-bold uppercase tracking-[0.08em]">
                    {title}
                  </h3>
                  <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#6d7a78]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#eef8f7] py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center font-script text-4xl font-semibold">
              Have an Adventure Today
            </h2>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {adventures.map((adventure, index) => (
                <article
                  key={adventure.title}
                  className={`group relative min-h-60 overflow-hidden rounded-lg bg-[#dbecea] shadow-xl shadow-[#0d4e5b]/10 ${
                    index === 0 ? 'lg:row-span-2 lg:min-h-[500px]' : ''
                  }`}
                >
                  <img
                    src={adventure.image}
                    alt={adventure.title}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 bg-white/86 p-4 backdrop-blur">
                    <div>
                      <h3 className="font-display text-base font-bold">
                        {adventure.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#6d7a78]">
                        Add this experience to your next shared itinerary.
                      </p>
                    </div>
                    <button
                      onClick={() => router.push('/trip/new')}
                      aria-label={`Plan ${adventure.title}`}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#008c95] text-[#008c95]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7fbfa] py-16 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="rounded-lg border border-[#dce8e5] bg-white/78 p-8 shadow-xl shadow-[#0d4e5b]/8 backdrop-blur sm:p-12">
              <Mail className="mx-auto h-8 w-8 text-[#008c95]" />
              <h2 className="mt-5 text-center font-display text-2xl font-bold uppercase tracking-[0.08em]">
                Newsletter
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-6 text-[#6d7a78]">
                Get seasonal destination ideas and planning prompts for your
                travel crew.
              </p>
              <div className="mt-8 space-y-4">
                <input
                  aria-label="Name"
                  placeholder="Name"
                  className="h-12 w-full rounded-none border-0 bg-[#edf5f3] px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[#008c95]"
                />
                <input
                  aria-label="Email"
                  placeholder="Email"
                  className="h-12 w-full rounded-none border-0 bg-[#edf5f3] px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[#008c95]"
                />
              </div>
              <button className="mt-8 w-full rounded-md bg-[#008c95] px-5 py-3 text-sm font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#007681]">
                Subscribe
              </button>
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="font-script text-4xl font-semibold">
                Award Winning
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#6d7a78]">
                Discover top-rated categories and turn inspiration into a
                coordinated group plan.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {awards.map((award) => (
                  <button
                    key={award.title}
                    onClick={() => router.push('/browse')}
                    className="grid grid-cols-[82px_1fr] items-center gap-3 text-left"
                  >
                    <img
                      src={award.image}
                      alt={award.title}
                      className="h-20 w-20 rounded-sm object-cover"
                    />
                    <span>
                      <span className="block text-sm font-bold">
                        {award.title}
                      </span>
                      <span className="mt-1 block text-xs text-[#7c8b88]">
                        Top 10 {award.title}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white/80 py-12 text-center">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="font-script text-4xl font-semibold">
              Looking for an experience?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#6d7a78]">
              Browse public events or create a private trip board for your
              friends.
            </p>
            <button
              onClick={() => router.push(hasTrips ? '/browse' : '/trip/new')}
              className="mt-5 rounded-md bg-[#008c95] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-[#008c95]/20 transition hover:bg-[#007681]"
            >
              {hasTrips ? 'Browse Events' : 'Create a Trip'}
            </button>
          </div>
        </section>

        <section className="bg-[#eef8f7] py-14 lg:py-20">
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

      <footer className="bg-stone-100 px-4 py-14 text-center text-stone-700">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-center gap-3">
            <Star className="h-16 w-16 fill-[#008c95] text-[#008c95]" />
            <span className="font-display text-5xl font-bold">Trip Planner</span>
          </div>
          <nav className="mt-8 flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm font-semibold">
            {navItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}>
                {item.label}
              </button>
            ))}
          </nav>
          <p className="mt-8 text-xs text-[#7c8b88]">
            Copyright 2026 Trip Planner | All Rights Reserved.
          </p>
        </div>
      </footer>

      <BottomTabBar />
    </div>
  );
}
