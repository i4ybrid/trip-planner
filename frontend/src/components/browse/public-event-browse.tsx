'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Loader2, MapPin } from 'lucide-react';
import { EventResultRow, publicEventToEventPresentation } from '@/components/events/event-ui';
import { PublicBrowseLocationPanel } from '@/components/browse/public-browse-location-panel';
import { api } from '@/services/api';
import { PublicEvent } from '@/types';

export function PublicEventBrowse() {
  const router = useRouter();
  const [events, setEvents] = useState<PublicEvent[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCountry, setLocationCountry] = useState('US');
  const containerRef = useRef<HTMLDivElement>(null);

  const activeResults = useMemo(() => {
    if (!events) return [];
    return events.map(publicEventToEventPresentation);
  }, [events]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  useEffect(() => {
    const city = locationCity.trim();
    const state = locationState.trim();

    if (!city && !state) {
      setEvents(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timeout = window.setTimeout(async () => {
      try {
        const result = await api.browsePublicEvents({
          limit: 5,
          city: city || undefined,
          state: state || undefined,
          country: locationCountry.trim() || undefined,
        });
        if (!cancelled) {
          setEvents(result.data || []);
          setIsOpen(true);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [locationCity, locationCountry, locationState]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (!locationCity.trim() && !locationState.trim()) return;
    if (locationCity.trim()) params.set('city', locationCity.trim());
    if (locationState.trim()) params.set('state', locationState.trim());
    if (locationCountry.trim()) params.set('country', locationCountry.trim());
    router.push(`/browse?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-2xl md:block">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm shadow-accent/5"
      >
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={locationCity}
          onChange={(event) => {
            setLocationCity(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Browse public events by city"
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
        <input
          value={locationState}
          onChange={(event) => {
            setLocationState(event.target.value.toUpperCase());
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="State"
          maxLength={2}
          className="w-16 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
          aria-label="Browse public events"
        >
          <Compass className="h-4 w-4" />
        </button>
      </form>

      {isOpen && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="border-b border-border/70 p-3">
            <PublicBrowseLocationPanel
              compact
              city={locationCity}
              state={locationState}
              country={locationCountry}
              onCityChange={setLocationCity}
              onStateChange={setLocationState}
              onCountryChange={setLocationCountry}
            />
          </div>
          {!locationCity.trim() && !locationState.trim() ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Enter a city or state to browse promoted public events nearby.
            </div>
          ) : (
            <>
              <div className="border-b border-border/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Public events
                </p>
              </div>
              <div className="max-h-96 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Browsing...
                  </div>
                ) : activeResults.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No public events found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeResults.map((event) => (
                      <EventResultRow
                        key={`${event.kind}-${event.id}`}
                        event={event}
                        onClick={() => setIsOpen(false)}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-border/70 px-4 py-2 text-xs text-muted-foreground">
                Press Enter for full browse results
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
