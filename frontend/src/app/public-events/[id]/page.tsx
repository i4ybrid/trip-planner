'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CalendarDays, Globe2, Loader2, MapPin, Radio } from 'lucide-react';
import { publicEventToEventPresentation } from '@/components/events/event-ui';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';
import { PublicEvent } from '@/types';

function formatDate(value?: string) {
  if (!value) return 'Dates TBD';
  return new Date(value).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function PublicEventDetailPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const presentedEvent = event ? publicEventToEventPresentation(event) : null;

  useEffect(() => {
    const loadEvent = async () => {
      setIsLoading(true);
      try {
        const result = await api.getPublicEvent(params.id);
        if (result.data) {
          setEvent(result.data);
        } else {
          setError(result.error || 'Public event not found');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadEvent();
  }, [params.id]);

  return (
    <PageLayout title="Public Event">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error || !event ? (
        <div className="mx-auto max-w-3xl rounded-lg border border-border/70 bg-card/80 py-16 text-center text-muted-foreground shadow-[var(--travel-card-shadow)] backdrop-blur">
          {error || 'Public event not found'}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="overflow-hidden rounded-lg border border-border/70 bg-card/85 shadow-[var(--travel-card-shadow)] backdrop-blur">
            <div className="bg-gradient-slate p-6 text-white md:p-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                <Radio className="h-3.5 w-3.5" />
                {presentedEvent?.extensionLabel} {presentedEvent?.eyebrow}
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-tight md:text-6xl">
                {presentedEvent?.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/82">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-1">
                  <MapPin className="h-4 w-4" />
                  {event.venueName ? `${event.venueName}, ` : ''}{presentedEvent?.location}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/12 px-3 py-1">
                  <CalendarDays className="h-4 w-4" />
                  {formatDate(event.startDate)}
                </span>
              </div>
            </div>
            <div className="grid gap-5 p-5 md:grid-cols-[1fr_18rem] md:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Private trip presentation</p>
                <h2 className="mt-1 font-display text-2xl font-bold">About this event</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  {event.description || 'The organizer has not added a description yet.'}
                </p>
              </div>
              <Card className="border-border/70 bg-background/70 p-4">
                <Globe2 className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">Public extension</p>
                <p className="mt-1 text-2xl font-bold">{event.regionRadiusMiles} miles</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Promoted near {event.city}{event.state ? `, ${event.state}` : ''}.
                </p>
                <Button className="mt-4 w-full rounded-lg" disabled>
                  Registration coming soon
                </Button>
              </Card>
            </div>
          </section>
        </div>
      )}
    </PageLayout>
  );
}
