'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Globe2, Loader2, MapPin, Search } from 'lucide-react';
import { api } from '@/services/api';
import { EventSearchResults } from '@/types';
import { cn } from '@/lib/utils';

type SearchScope = 'my' | 'public';

const scopeLabels: Record<SearchScope, string> = {
  my: 'My events',
  public: 'Public events',
};

function formatDate(value?: string) {
  if (!value) return 'Dates TBD';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function UniversalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('my');
  const [results, setResults] = useState<EventSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeResults = useMemo(() => {
    if (!results) return [];
    return scope === 'my' ? results.myEvents : results.publicEvents;
  }, [results, scope]);

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
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const timeout = window.setTimeout(async () => {
      try {
        const result = await api.searchEvents({ q: trimmed, scope, limit: 5 });
        if (!cancelled) {
          setResults(result.data || { myEvents: [], publicEvents: [] });
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
  }, [query, scope]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&scope=${scope}`);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-2xl md:block">
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm shadow-accent/5"
      >
        <Search className="h-4 w-4 shrink-0 text-primary" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          placeholder={scope === 'my' ? 'Search within my events' : 'Search promoted public events'}
          className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
        />
        <div className="flex rounded-full bg-muted/70 p-0.5">
          {(['my', 'public'] as SearchScope[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setScope(option)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                scope === option
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {scopeLabels[option]}
            </button>
          ))}
        </div>
      </form>

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="border-b border-border/70 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {scopeLabels[scope]}
            </p>
          </div>
          <div className="max-h-96 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            ) : activeResults.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No {scope === 'my' ? 'events' : 'public events'} found
              </div>
            ) : (
              <div className="space-y-1">
                {scope === 'my'
                  ? results?.myEvents.map((trip) => (
                      <Link
                        key={trip.id}
                        href={`/trip/${trip.id}/overview`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-background/70"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{trip.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{trip.destination || 'Destination TBD'}</p>
                        </div>
                      </Link>
                    ))
                  : results?.publicEvents.map((event) => (
                      <Link
                        key={event.id}
                        href={`/public-events/${event.id}`}
                        onClick={() => setIsOpen(false)}
                        className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-background/70"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                          <Globe2 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-foreground">{event.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.city}{event.state ? `, ${event.state}` : ''}
                            </span>
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
              </div>
            )}
          </div>
          <div className="border-t border-border/70 px-4 py-2 text-xs text-muted-foreground">
            Press Enter for full results
          </div>
        </div>
      )}
    </div>
  );
}
