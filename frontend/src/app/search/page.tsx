'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { PageLayout } from '@/components/page-layout';
import { SearchBar } from '@/components/search';
import { Loader2, Search, Plane, MapPin, CreditCard, ArrowRight } from 'lucide-react';
import { api } from '@/services/api';
import { SearchResult, SearchResponse } from '@/types';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'trip' | 'activity' | 'expense';

function SearchPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterType>('all');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = async (q: string, type?: 'trip' | 'activity' | 'expense') => {
    if (!q.trim()) { setData(null); return; }
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.search(q, { type, limit: 50 });
      setData(result);
    } catch (e: any) {
      setError(e.message || 'Search failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Search when filter changes (if we already have a query)
  useEffect(() => {
    if (!query) return;
    const typeFilter = filter === 'all' ? undefined : filter as 'trip' | 'activity' | 'expense';
    performSearch(query, typeFilter);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial search on mount
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setQuery(inputValue.trim());
    router.replace(`/search?q=${encodeURIComponent(inputValue.trim())}`, { scroll: false });
    const typeFilter = filter === 'all' ? undefined : filter as 'trip' | 'activity' | 'expense';
    performSearch(inputValue.trim(), typeFilter);
  };

  const filteredResults = data?.results.filter((r) => {
    if (filter === 'all') return true;
    return r.type === filter;
  }) ?? [];

  const grouped = {
    trip: filteredResults.filter((r) => r.type === 'trip'),
    activity: filteredResults.filter((r) => r.type === 'activity'),
    expense: filteredResults.filter((r) => r.type === 'expense'),
  };

  const typeMeta = {
    trip: { label: 'Trips', icon: <Plane className="h-4 w-4" />, color: 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950' },
    activity: { label: 'Activities', icon: <MapPin className="h-4 w-4" />, color: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950' },
    expense: { label: 'Expenses', icon: <CreditCard className="h-4 w-4" />, color: 'text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950' },
  };

  return (
    <PageLayout
      title="Search"
      actions={
        <div className="w-full max-w-sm">
          <SearchBar placeholder="Search…" />
        </div>
      }
    >
      <div className="max-w-3xl mx-auto">
        {/* Search input */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="search"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search trips, activities, expenses…"
              className="flex h-10 w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            />
          </div>
          <button
            type="submit"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter tabs */}
        {data && (
          <div className="flex gap-1 mb-6 bg-secondary/50 rounded-lg p-1 w-fit">
            {(['all', 'trip', 'activity', 'expense'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f === 'all' ? `All (${data.total})` : f.charAt(0).toUpperCase() + f.slice(1) + ` (${grouped[f as keyof typeof grouped].length})`}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">{error}</p>
          </div>
        )}

        {/* Empty query */}
        {!query && !isLoading && (
          <div className="text-center py-20">
            <Search className="h-10 w-10 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="text-lg font-medium">Search your trips</p>
            <p className="text-sm text-muted-foreground mt-1">
              Find trips, activities, and expenses by keyword
            </p>
          </div>
        )}

        {/* No results */}
        {query && !isLoading && !error && data && data.total === 0 && (
          <div className="text-center py-20">
            <p className="text-lg font-medium">No results for &ldquo;{query}&rdquo;</p>
            <p className="text-sm text-muted-foreground mt-1">
              Try different keywords or check your spelling
            </p>
          </div>
        )}

        {/* Results grouped by type */}
        {query && !isLoading && !error && filteredResults.length > 0 && (
          <div className="space-y-8">
            {/* Timing info */}
            {data && (
              <p className="text-xs text-muted-foreground">
                {data.total} result{data.total !== 1 ? 's' : ''} for &ldquo;{query}&rdquo; · {data.timingMs}ms
              </p>
            )}

            {((filter === 'all' ? ['trip', 'activity', 'expense'] : [filter]) as Array<'trip' | 'activity' | 'expense'>).map((type) => {
              const items = grouped[type as keyof typeof grouped];
              if (items.length === 0) return null;
              const meta = typeMeta[type as keyof typeof typeMeta];
              return (
                <section key={type}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('p-1.5 rounded-md', meta.color)}>{meta.icon}</span>
                    <h2 className="text-base font-semibold">{meta.label}</h2>
                    <span className="text-xs text-muted-foreground">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => router.push(result.url)}
                        className="flex w-full items-center gap-4 rounded-lg border border-border bg-background p-4 text-left hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{result.title}</div>
                          {result.tripTitle && (
                            <div className="text-sm text-muted-foreground truncate mt-0.5">
                              {result.tripTitle}
                            </div>
                          )}
                          {result.description && (
                            <div className="text-sm text-muted-foreground/70 truncate mt-0.5">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageContent />
    </Suspense>
  );
}
