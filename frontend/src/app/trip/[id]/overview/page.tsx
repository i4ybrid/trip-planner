'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTripStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Select } from '@/components';
import { formatDateRange, formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services';
import { MapPin, Calendar, Users, DollarSign, Share2, Settings } from 'lucide-react';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

export default function TripOverview() {
  const params = useParams();
  const tripId = params.id as string;
  
  const { currentTrip, isLoading, fetchTrip, changeStatus } = useTripStore();
  const [members, setMembers] = useState<{ userId: string; role: string; user: { name: string; email: string } }[]>([]);

  useEffect(() => {
    if (tripId) {
      fetchTrip(tripId);
      if (USE_MOCK) {
        import('@/services').then(({ mockTrip }) => {
          setMembers(mockTrip.getTripMembersWithUsers(tripId));
        });
      } else {
        api.getTripMembers(tripId).then((response) => {
          if (response.data) {
            setMembers(response.data.map((m: any) => ({
              userId: m.userId,
              role: m.role,
              user: m.user || { name: 'Unknown', email: '' },
            })));
          }
        });
      }
    }
  }, [tripId, fetchTrip, USE_MOCK]);

  if (isLoading || !currentTrip) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{currentTrip.name}</h2>
          {currentTrip.destination && (
            <p className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {currentTrip.destination}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Invite
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Trip Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge status={currentTrip.status} className="text-sm" />
                <Select
                  value={currentTrip.status}
                  onChange={(e) => changeStatus(tripId, e.target.value as any)}
                  options={[
                    { value: 'IDEA', label: 'Idea (Feelers)' },
                    { value: 'PLANNING', label: 'Planning' },
                    { value: 'CONFIRMED', label: 'Confirmed' },
                    { value: 'HAPPENING', label: 'Happening' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'CANCELLED', label: 'Cancelled' },
                  ]}
                />
              </div>
              
              {currentTrip.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
                  <p className="mt-1">{currentTrip.description}</p>
                </div>
              )}
              
              {currentTrip.startDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDateRange(currentTrip.startDate, currentTrip.endDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Members ({members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {members.map((member) => (
                  <div key={member.userId} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium">
                      {member.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Activities</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Members</span>
                <span className="font-semibold">{members.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Memories</span>
                <span className="font-semibold">0</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-semibold">{formatCurrency(0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Collected</span>
                <span className="font-semibold text-green-600">{formatCurrency(0)}</span>
              </div>
              <Button variant="outline" className="w-full">
                View Payments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
