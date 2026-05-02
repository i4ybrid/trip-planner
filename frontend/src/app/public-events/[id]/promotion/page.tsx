'use client';

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { PageLayout } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/services/api';

export default function PublicEventPromotionPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get('payment');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!paymentId) {
      setError('Missing promotion payment id.');
      return;
    }

    setIsConfirming(true);
    setError('');
    try {
      const result = await api.confirmPublicEventPromotionPayment(params.id, paymentId);
      if (result.error) {
        setError(result.error);
      } else {
        router.push(`/public-events/${params.id}`);
      }
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <PageLayout title="Promote Event">
      <div className="mx-auto max-w-2xl">
        <Card className="border-border/70 bg-card/85 p-6 shadow-[var(--travel-card-shadow)] backdrop-blur">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CreditCard className="h-6 w-6" />
          </div>
          <h1 className="mt-5 font-display text-4xl font-bold">Confirm public promotion</h1>
          <p className="mt-2 text-muted-foreground">
            This development checkout confirms the organizer paid to promote this event regionally. A production payment provider can use this same payment record as its webhook target.
          </p>
          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <Button className="mt-6 h-12 rounded-lg" onClick={handleConfirm} disabled={isConfirming || !paymentId}>
            {isConfirming ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Confirm Payment & Publish
          </Button>
        </Card>
      </div>
    </PageLayout>
  );
}
