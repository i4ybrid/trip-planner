'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Button, Input, Textarea } from '@/components';

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
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          ← Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Trip</CardTitle>
            <CardDescription>
              Start planning your next adventure with friends
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-red-600">
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
  );
}
