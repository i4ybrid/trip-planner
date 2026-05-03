'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import { EventResultCard, publicEventToEventPresentation } from '@/components/events/event-ui';
import { PublicBrowseLocationPanel } from '@/components/browse/public-browse-location-panel';
import { PageLayout } from '@/components/page-layout';
import { api } from '@/services/api';
import { PublicEvent } from '@/types';

async function loadUserLocation(): Promise<{ city: string; state: string; country: string } | null> {
  try {
    const user = await api.getCurrentUser();
    const { city, state, country } = user.data || {};
    if (city || state) {
      return { city: city || '', state: state || '', country: country || 'US' };
    }
  } catch {}
  return null;
}

function BrowsePageContent() {
  const browseParams = useSearchParams();
  const [locationCity, setLocationCity] = useState(browseParams.get('city') || '');
  const [locationState, setLocationState] = useState(browseParams.get('state') || '');
  const [locationCountry, setLocationCountry] = useState(browseParams.get('country') || 'US');
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Pre-fill from user profile on mount when no URL params are set
  useEffect(() => {
    if (browseParams.get('city') || browseParams.get('state')) return;
    loadUserLocation().then((loc) => {
      if (loc && !locationCity && !locationState) {
        setLocationCity(loc.city);
        setLocationState(loc.state);
        setLocationCountry(loc.country);
      }
    });
  }, []);

  useEffect(() => {
    const city = locationCity.trim();
    const state = locationState.trim();

    if (!city && !state) {
      setEvents([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    api.browsePublicEvents({
      city: city || undefined,
      state: state || undefined,
      country: locationCountry.trim() || undefined,
      limit: 12,
    }).then((result) => {
      if (!cancelled) {
        setEvents(result.data || []);
      }
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [locationCity, locationCountry, locationState]);

  const activeResults = events.map(publicEventToEventPresentation);
  const hasLocation = Boolean(locationCity.trim() || locationState.trim());

  return (
    <PageLayout title="Browse Events">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-lg border border-border/70 bg-card/80 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/70 bg-background/75 px-4 py-3 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              Public events are browsed by city and state.
            </div>
          </div>

          <div className="mt-3">
            <PublicBrowseLocationPanel
              city={locationCity}
              state={locationState}
              country={locationCountry}
              onCityChange={setLocationCity}
              onStateChange={setLocationState}
              onCountryChange={setLocationCountry}
              onClearLocation={() => {
                setLocationCity('');
                setLocationState('');
                setLocationCountry('US');
              }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-border/70 bg-card/80 py-16 text-muted-foreground shadow-[var(--travel-card-shadow)] backdrop-blur">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Browsing...
          </div>
        ) : activeResults.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card/80 px-4 py-14 text-center shadow-[var(--travel-card-shadow)] backdrop-blur">
            <div className="mx-auto flex max-w-md flex-col items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {hasLocation ? 'No public events found for this location.' : 'Enter a location to browse public events.'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeResults.map((event) => (
              <EventResultCard key={`${event.kind}-${event.id}`} event={event} />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <PageLayout title="Browse Events">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    }>
      <BrowsePageContent />
    </Suspense>
  );
}
