'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, MapPin, Radio } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';

export default function NewPublicEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    venueName: '',
    addressLine: '',
    city: '',
    state: '',
    country: 'US',
    startDate: '',
    endDate: '',
    regionRadiusMiles: 50,
    amount: 49,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const eventResult = await api.createPublicEvent({
        title: form.title,
        description: form.description || undefined,
        venueName: form.venueName || undefined,
        addressLine: form.addressLine || undefined,
        city: form.city,
        state: form.state || undefined,
        country: form.country || 'US',
        startDate: new Date(form.startDate).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
        regionRadiusMiles: Number(form.regionRadiusMiles),
      });

      if (!eventResult.data) {
        setError(eventResult.error || 'Could not create public event');
        return;
      }

      const paymentResult = await api.createPublicEventPromotionCheckout(eventResult.data.id, {
        amount: Number(form.amount),
        durationDays: 30,
        regionCity: form.city,
        regionState: form.state || undefined,
        regionCountry: form.country || 'US',
        regionRadiusMiles: Number(form.regionRadiusMiles),
      });

      if (paymentResult.data?.checkoutUrl) {
        router.push(paymentResult.data.checkoutUrl.replace(window.location.origin, ''));
      } else {
        router.push(`/public-events/${eventResult.data.id}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout title="Public Event">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-lg border border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur md:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Radio className="h-3.5 w-3.5" />
            Organizer tools
          </div>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">Create a promoted public event.</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Public events are organizer-managed and only become searchable after a paid regional promotion is confirmed.
          </p>
        </section>

        <Card className="border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur md:p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">Event title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="min-h-28 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input id="venue" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="grid grid-cols-[1fr_7rem] gap-3">
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="start">Start</Label>
              <Input id="start" type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End</Label>
              <Input id="end" type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="radius">Promotion radius miles</Label>
              <Input id="radius" type="number" min={5} max={500} value={form.regionRadiusMiles} onChange={(e) => setForm({ ...form, regionRadiusMiles: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Promotion payment USD</Label>
              <Input id="amount" type="number" min={1} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              Promoted near the event city after payment.
            </div>
            <Button className="h-12 rounded-lg px-5" onClick={handleSubmit} disabled={isSubmitting || !form.title || !form.city || !form.startDate}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Create & Pay to Promote
            </Button>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
