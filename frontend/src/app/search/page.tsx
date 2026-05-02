'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarDays, Globe2, Loader2, MapPin, Search } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { EventSearchResults } from '@/types';
import { cn } from '@/lib/utils';

type SearchScope = 'my' | 'public';

function formatDate(value?: string) {
  if (!value) return 'Dates TBD';
  return new Date(value).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [scope, setScope] = useState<SearchScope>((searchParams.get('scope') as SearchScope) || 'my');
  const [results, setResults] = useState<EventSearchResults>({ myEvents: [], publicEvents: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const nextScope = (searchParams.get('scope') as SearchScope) || 'my';
    setQuery(q);
    setScope(nextScope);
  }, [searchParams]);

  useEffect(() => {
    const loadResults = async () => {
      if (!query.trim()) {
        setResults({ myEvents: [], publicEvents: [] });
        return;
      }

      setIsLoading(true);
      try {
        const result = await api.searchEvents({ q: query.trim(), scope, limit: 12 });
        setResults(result.data || { myEvents: [], publicEvents: [] });
      } finally {
        setIsLoading(false);
      }
    };

    loadResults();
  }, [query, scope]);

  const activeResults = scope === 'my' ? results.myEvents : results.publicEvents;

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}&scope=${scope}`);
  };

  return (
    <PageLayout title="Search">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-lg border border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur md:p-7">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Universal Search</p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-tight md:text-5xl">Find events without leaving the flow.</h1>
            <p className="mt-2 text-muted-foreground">
              Search your private trips, or switch to paid public events promoted near your profile location.
            </p>
          </div>
        </section>

        <div className="rounded-lg border border-border/70 bg-card/80 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSearch();
                }}
                placeholder={scope === 'my' ? 'Search within my events' : 'Search public events'}
                className="h-12 rounded-lg border-border/70 bg-background/80 pl-11"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
              {(['my', 'public'] as SearchScope[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setScope(option)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    scope === option
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {option === 'my' ? 'My events' : 'Public events'}
                </button>
              ))}
            </div>
            <Button className="h-12 rounded-lg px-5" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center rounded-lg border border-border/70 bg-card/80 py-16 text-muted-foreground shadow-[var(--travel-card-shadow)] backdrop-blur">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Searching...
          </div>
        ) : activeResults.length === 0 ? (
          <div className="rounded-lg border border-border/70 bg-card/80 py-16 text-center text-muted-foreground shadow-[var(--travel-card-shadow)] backdrop-blur">
            {query.trim() ? 'No matching events yet.' : 'Enter a search term to begin.'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {scope === 'my'
              ? results.myEvents.map((trip) => (
                  <Link key={trip.id} href={`/trip/${trip.id}/overview`}>
                    <Card className="h-full border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur transition-transform hover:-translate-y-0.5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-2xl font-bold">{trip.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{trip.destination || 'Destination TBD'}</p>
                          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            {(trip._count?.members || 0)} travelers
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))
              : results.publicEvents.map((event) => (
                  <Link key={event.id} href={`/public-events/${event.id}`}>
                    <Card className="h-full border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur transition-transform hover:-translate-y-0.5">
                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                          <Globe2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-display text-2xl font-bold">{event.title}</p>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-primary" />
                              {event.city}{event.state ? `, ${event.state}` : ''}
                            </span>
                            <span>{formatDate(event.startDate)}</span>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{event.description || 'Organizer-managed public event'}</p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <PageLayout title="Search">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
