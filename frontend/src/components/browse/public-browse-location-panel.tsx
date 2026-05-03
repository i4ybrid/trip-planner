'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Crosshair, Loader2, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { PublicEventLocationSuggestion } from '@/types';
import { cn } from '@/lib/utils';

interface PublicBrowseLocationPanelProps {
  city: string;
  state: string;
  country: string;
  compact?: boolean;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onClearLocation?: () => void;
  onUseBrowserLocation?: () => void;
  isCapturingLocation?: boolean;
}

export function PublicBrowseLocationPanel({
  city,
  state,
  country,
  compact = false,
  onCityChange,
  onStateChange,
  onCountryChange,
  onClearLocation,
  onUseBrowserLocation,
  isCapturingLocation = false,
}: PublicBrowseLocationPanelProps) {
  const [suggestions, setSuggestions] = useState<PublicEventLocationSuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const selectedCityRef = useRef('');
  const hasManualLocation = Boolean(city.trim() || state.trim());
  const locationHint = hasManualLocation
    ? `${city || 'Any city'}${state ? `, ${state}` : ''}${country ? ` (${country})` : ''}`
    : 'Enter a city or state';

  useEffect(() => {
    const cityQuery = city.trim();
    if (cityQuery.length < 2 || cityQuery === selectedCityRef.current) {
      setSuggestions([]);
      setIsSuggestionsOpen(false);
      return;
    }

    let cancelled = false;
    setIsLoadingSuggestions(true);

    const timeout = window.setTimeout(async () => {
      try {
        const result = await api.getPublicEventLocationSuggestions(cityQuery);
        const nextSuggestions = result.data || [];
        if (cancelled) return;

        setSuggestions(nextSuggestions);
        setIsSuggestionsOpen(nextSuggestions.length > 0);

        const exactMatches = nextSuggestions.filter(
          (suggestion) => suggestion.city.toLowerCase() === cityQuery.toLowerCase()
        );
        if (exactMatches.length === 1) {
          selectedCityRef.current = exactMatches[0].city;
          onCityChange(exactMatches[0].city);
          onStateChange(exactMatches[0].state || '');
          onCountryChange(exactMatches[0].country || 'US');
          setIsSuggestionsOpen(false);
        }
      } finally {
        if (!cancelled) setIsLoadingSuggestions(false);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [city, onCityChange, onCountryChange, onStateChange]);

  const selectSuggestion = (suggestion: PublicEventLocationSuggestion) => {
    selectedCityRef.current = suggestion.city;
    onCityChange(suggestion.city);
    onStateChange(suggestion.state || '');
    onCountryChange(suggestion.country || 'US');
    setIsSuggestionsOpen(false);
  };

  return (
    <div className={cn(
      'rounded-lg border border-border/70 bg-background/75 backdrop-blur',
      compact ? 'p-3' : 'p-4'
    )}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            Public events are browsed by location
          </div>
          <p className={cn('mt-1 text-muted-foreground', compact ? 'text-xs' : 'text-sm')}>
            Enter a city, state, or both. A state-only browse shows all promoted events in that state; adding a city brings nearby places forward when coordinates are available.
          </p>
        </div>
        <button
          type="button"
          onClick={onUseBrowserLocation}
          disabled={isCapturingLocation}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          {isCapturingLocation ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Crosshair className="h-3.5 w-3.5" />
          )}
          {isCapturingLocation ? 'Finding...' : 'Enter a city or state'}
        </button>
      </div>

      <div className={cn(
        'mt-3 grid gap-2',
        compact ? 'grid-cols-[1fr_5rem_5rem]' : 'md:grid-cols-[1fr_8rem_7rem_auto]'
      )}>
        <div className="relative">
          <Input
            value={city}
            onChange={(event) => {
              selectedCityRef.current = '';
              onCityChange(event.target.value);
            }}
            onFocus={() => suggestions.length > 0 && setIsSuggestionsOpen(true)}
            placeholder="City"
            className="h-10 rounded-lg border-border/70 bg-card/80 pr-9"
          />
          {isLoadingSuggestions && (
            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {isSuggestionsOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 overflow-hidden rounded-lg border border-border/70 bg-card/95 shadow-[var(--travel-card-shadow)] backdrop-blur">
              {suggestions.map((suggestion) => {
                const isSelected =
                  city === suggestion.city &&
                  state === (suggestion.state || '') &&
                  country === suggestion.country;

                return (
                  <button
                    key={`${suggestion.city}-${suggestion.state || ''}-${suggestion.country}`}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                  >
                    <span>
                      <span className="font-semibold text-foreground">{suggestion.city}</span>
                      <span className="ml-2 text-muted-foreground">
                        {suggestion.state ? `${suggestion.state}, ` : ''}{suggestion.country}
                      </span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <Input
          value={state}
          onChange={(event) => onStateChange(event.target.value)}
          placeholder="State"
          className="h-10 rounded-lg border-border/70 bg-card/80"
        />
        <Input
          value={country}
          onChange={(event) => onCountryChange(event.target.value.toUpperCase())}
          placeholder="US"
          maxLength={2}
          className="h-10 rounded-lg border-border/70 bg-card/80"
        />
        {!compact && onClearLocation && (
          <button
            type="button"
            onClick={onClearLocation}
            className="h-10 rounded-lg border border-border/70 bg-card/80 px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
