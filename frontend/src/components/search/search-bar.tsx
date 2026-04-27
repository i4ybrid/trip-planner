'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import type { SearchResult } from '@/types';

interface SearchBarProps {
  /** Extra CSS classes applied to the wrapper */
  className?: string;
  /** Placeholder text (default: "Search trips, activities…") */
  placeholder?: string;
}

interface QuickResults {
  results: SearchResult[];
  query: string;
}

export function SearchBar({ className, placeholder = 'Search trips, activities…' }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [quickResults, setQuickResults] = useState<QuickResults | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search as user types
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setQuickResults(null);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await api.search(value, { limit: 5 });
        setQuickResults(data);
        setIsOpen(true);
      } catch {
        setQuickResults(null);
      } finally {
        setIsLoading(false);
      }
    }, 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleResultClick = (url: string) => {
    setIsOpen(false);
    setQuery('');
    router.push(url);
  };

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'trip') return '✈️';
    if (type === 'activity') return '📍';
    return '💰';
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleInputChange}
          onFocus={() => quickResults && setIsOpen(true)}
          placeholder={placeholder}
          className="flex h-9 w-full rounded-md border border-border bg-secondary/40 pl-9 pr-8 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setQuickResults(null); setIsOpen(false); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
          </button>
        )}
      </form>

      {/* Live dropdown results */}
      {isOpen && quickResults && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-background border border-border rounded-md shadow-lg overflow-hidden">
          {quickResults.results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results for &ldquo;{quickResults.query}&rdquo;
            </div>
          ) : (
            <>
              {quickResults.results.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  type="button"
                  onClick={() => handleResultClick(result.url)}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors border-b border-border last:border-0"
                >
                  <span className="text-lg leading-none mt-0.5">{typeIcon(result.type)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{result.title}</div>
                    {result.tripTitle && (
                      <div className="text-xs text-muted-foreground truncate">
                        {result.type === 'expense' ? `Expense · ${result.tripTitle}` : `${result.type} · ${result.tripTitle}`}
                      </div>
                    )}
                    {result.description && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        {result.description}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground shrink-0 mt-0.5">
                    {result.type}
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setIsOpen(false); router.push(`/search?q=${encodeURIComponent(quickResults.query)}`); }}
                className="flex w-full items-center justify-center gap-2 px-4 py-2.5 text-xs text-primary hover:bg-secondary transition-colors font-medium"
              >
                <Search className="h-3 w-3" />
                See all results for &ldquo;{quickResults.query}&rdquo;
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
