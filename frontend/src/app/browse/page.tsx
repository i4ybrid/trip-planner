'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Compass, Crosshair, Loader2, MapPin } from 'lucide-react';
import { EventResultCard, publicEventToEventPresentation } from '@/components/events/event-ui';
import { PublicBrowseLocationPanel } from '@/components/browse/public-browse-location-panel';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { PublicEvent } from '@/types';

function BrowsePageContent() {
  const router = useRouter();
  const browseParams = useSearchParams();
  const [locationCity, setLocationCity] = useState(browseParams.get('city') || '');
  const [locationState, setLocationState] = useState(browseParams.get('state') || '');
  const [locationCountry, setLocationCountry] = useState(browseParams.get('country') || 'US');
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setLocationCity(browseParams.get('city') || '');
    setLocationState(browseParams.get('state') || '');
    setLocationCountry(browseParams.get('country') || 'US');
  }, [browseParams]);

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

  const handleBrowse = () => {
    const params = new URLSearchParams();
    if (!locationCity.trim() && !locationState.trim()) return;
    if (locationCity.trim()) params.set('city', locationCity.trim());
    if (locationState.trim()) params.set('state', locationState.trim());
    if (locationCountry.trim()) params.set('country', locationCountry.trim());
    router.push(`/browse?${params.toString()}`);
  };

  const applyLocation = (city: string, state: string, country: string) => {
    setLocationCity(city);
    setLocationState(state);
    setLocationCountry(country || 'US');

    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (country) params.set('country', country);
    router.push(`/browse?${params.toString()}`);
  };

  const handleUseBrowserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Browser location is not available.');
      return;
    }

    setLocationError(null);
    setIsCapturingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        try {
          const result = await api.reverseGeocodeLocation(latitude, longitude);
          const location = result.data;
          const city = location?.city || '';
          const state = location?.state || '';
          const country = location?.country || 'US';

          if (!city && !state) {
            setLocationError('Your browser location was found, but city/state could not be resolved.');
            return;
          }

          applyLocation(city, state, country);
        } catch {
          setLocationError('Your browser location was found, but city/state could not be resolved.');
        } finally {
          setIsCapturingLocation(false);
        }
      },
      () => {
        setIsCapturingLocation(false);
        setLocationError('Could not access browser location.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

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
            <Button className="h-12 rounded-lg px-5" onClick={handleBrowse}>
              <Compass className="mr-2 h-4 w-4" />
              Browse
            </Button>
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
                  {hasLocation ? 'No public events found nearby.' : 'Browse public events near you.'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use your browser location to auto-fill city and state.
                </p>
              </div>
              <Button
                type="button"
                className="h-11 rounded-lg px-5"
                onClick={handleUseBrowserLocation}
                disabled={isCapturingLocation}
              >
                {isCapturingLocation ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Crosshair className="mr-2 h-4 w-4" />
                )}
                {isCapturingLocation ? 'Finding...' : 'Based on my location'}
              </Button>
              {locationError && (
                <p className="text-sm text-destructive">{locationError}</p>
              )}
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
