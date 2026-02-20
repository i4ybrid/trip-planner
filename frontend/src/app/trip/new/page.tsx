'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Textarea } from '@/components';
import { LeftSidebar } from '@/components/left-sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';
import { ArrowLeft } from 'lucide-react';

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
    clearError();
    
    const trip = await createTrip({
      name,
      description: description || undefined,
      destination: destination || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });

    if (trip) {
      router.push(`/trip/${trip.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <div className="pl-sidebar">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Create New Trip</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <NotificationDrawer />
          </div>
        </header>

        <main className="p-6">
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
    </div>
  );
}
