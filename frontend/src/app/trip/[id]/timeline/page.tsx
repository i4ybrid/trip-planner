'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, EmptyState } from '@/components';
import { mockApi } from '@/services/mock-api';
import { Clock } from 'lucide-react';

const eventTypeIcons: Record<string, string> = {
  trip_created: '🎉',
  member_joined: '👋',
  member_invited: '📨',
  activity_proposed: '💡',
  activity_booked: '✅',
  vote_cast: '🗳️',
  payment_received: '💰',
  payment_sent: '💸',
  status_changed: '🔄',
  message_sent: '💬',
  photo_shared: '📷',
};

export default function TripTimeline() {
  const params = useParams();
  const tripId = params.id as string;
  
  const [events, setEvents] = useState<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
    userId?: string;
  }[]>([]);

  useEffect(() => {
    const loadEvents = async () => {
      const result = await mockApi.getEvents(tripId);
      if (result.data) setEvents(result.data);
    };
    loadEvents();
  }, [tripId]);

  const getUserName = (userId?: string) => {
    if (!userId) return 'System';
    const names: Record<string, string> = {
      'user-1': 'You',
      'user-2': 'Sarah Chen',
      'user-3': 'Mike Johnson',
      'user-4': 'Emma Wilson',
    };
    return names[userId] || 'Unknown';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Timeline</h2>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              title="No events yet"
              description="Events will appear here as the trip progresses"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {events.map((event) => (
                  <div key={event.id} className="relative flex gap-4 pl-8">
                    <div className="absolute left-2 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-background border-2 border-primary">
                      <span className="text-xs">{eventTypeIcons[event.type] || '📌'}</span>
                    </div>
                    <div className="flex-1 rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {getUserName(event.userId)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
