'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Textarea } from '@/components';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { ArrowLeft } from 'lucide-react';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
const debugLog = (...args: any[]) => DEBUG && console.log(...args);

export default function NewTripPage() {
  const router = useRouter();
  const { createTrip, isLoading, error, clearError } = useTripStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    debugLog('[CreateTrip] Button clicked - starting submission');
    clearError();
    
    debugLog('[CreateTrip] Form data:', { name, description, destination, startDate, endDate });
    
    const trip = await createTrip({
      name,
      description: description || undefined,
      destination: destination || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    debugLog('[CreateTrip] createTrip result:', trip);

    if (trip) {
      debugLog('[CreateTrip] Redirecting to trip:', trip.id);
      router.push(`/trip/${trip.id}`);
    }
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
                  {error && (
                    <div className="rounded-lg bg-red-50 p-4 text-red-600 dark:bg-red-950">
                      {error}
                    </div>
                  )}
                  
                  <Input
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
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                      label="End Date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isLoading}>
                    Create Trip
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </main>
    </div>
  );
}
