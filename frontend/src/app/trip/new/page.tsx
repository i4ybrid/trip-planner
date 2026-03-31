'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader } from 'lucide-react';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Textarea } from '@/components';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { ArrowLeft } from 'lucide-react';
import { useFormSubmit } from '@/hooks/useFormSubmit';

function normalizeDateForSubmit(dateStr: string, isEndDate: boolean): string | undefined {
  if (!dateStr) return undefined;
  if (!dateStr.includes('T')) {
    // Date-only, no time component — apply default time
    return `${dateStr}T${isEndDate ? '23:59' : '00:00'}`;
  }
  return dateStr;
}

export default function NewTripPage() {
  const router = useRouter();
  const { createTrip, error, clearError } = useTripStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { isSubmitting, error: hookError, submitForm } = useFormSubmit({
    waitForNavigation: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitForm(async () => {
      const normalizedStart = normalizeDateForSubmit(startDate, false);
      const normalizedEnd = normalizeDateForSubmit(endDate, true);

      const trip = await createTrip({
        name,
        description: description || undefined,
        destination: destination || undefined,
        startDate: normalizedStart,
        endDate: normalizedEnd,
      });

      if (trip) {
        router.push(`/trip/${trip.id}`);
      }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <AppHeader title="Create New Trip" />

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-2xl">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>Plan Your Next Adventure</CardTitle>
                <CardDescription>
                  Create a new trip and invite friends to start planning together
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  {hookError && (
                    <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950">
                      {hookError}
                    </div>
                  )}
                  
                  <Input
                    id="name"
                    label="Trip Name"
                    placeholder="Summer Vacation 2026"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />

                  <Textarea
                    label="Description (optional)"
                    placeholder="What's this trip about?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />

                  <Input
                    label="Destination"
                    placeholder="Hawaii, Paris, NYC..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Start Date"
                      type="datetime-local"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      label="End Date"
                      type="datetime-local"
                      value={endDate}
                      onFocus={() => {
                        if (!endDate && startDate) {
                          // Extract date portion (before any T)
                          const dateOnly = startDate.split('T')[0];
                          setEndDate(dateOnly);
                        }
                      }}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Trip'
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
    </div>
  );
}
