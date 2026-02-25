'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { Bell, Heart, MessageCircle, ThumbsUp, Share2, MapPin, Calendar, DollarSign, Users, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { Notification, NotificationType } from '@/types';

const notificationTypeMap: Record<NotificationType, string> = {
  INVITE: 'member',
  VOTE: 'vote',
  ACTIVITY: 'trip',
  PAYMENT: 'payment',
  MESSAGE: 'message',
  REMINDER: 'trip',
  MILESTONE: 'trip',
  PAYMENT_DUE: 'payment',
  PAYMENT_RECEIVED: 'payment',
  VOTE_DEADLINE: 'vote',
  TRIP_STARTING: 'trip',
  FRIEND_REQUEST: 'member',
  DM_MESSAGE: 'message',
};

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for session to be loaded
    if (!session) return;

    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const result = await api.getNotifications();
        if (result.data) {
          setNotifications(result.data);
        }
      } catch (error) {
        // Error handled by 401 redirect in api.ts
        console.error('Failed to load notifications:', error);
      }
      setIsLoading(false);
    };
    loadNotifications();
  }, [session]);

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => notificationTypeMap[n.type] === filter);

  const getActivityIcon = (type: NotificationType) => {
    const mappedType = notificationTypeMap[type] || 'trip';
    switch (mappedType) {
      case 'vote': return <ThumbsUp className="h-4 w-4 text-current" />;
      case 'message': return <MessageCircle className="h-4 w-4 text-current" />;
      case 'like': return <Heart className="h-4 w-4 text-current" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-current" />;
      case 'trip': return <Calendar className="h-4 w-4 text-current" />;
      case 'member': return <Users className="h-4 w-4 text-current" />;
      default: return <Bell className="h-4 w-4 text-current" />;
    }
  };

  const getActivityColor = (type: NotificationType) => {
    const mappedType = notificationTypeMap[type] || 'trip';
    switch (mappedType) {
      case 'vote': return 'bg-blue-500/10 text-blue-500';
      case 'message': return 'bg-green-500/10 text-green-500';
      case 'like': return 'bg-red-500/10 text-red-500';
      case 'payment': return 'bg-yellow-500/10 text-yellow-500';
      case 'trip': return 'bg-purple-500/10 text-purple-500';
      case 'member': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <AppHeader title="Activity Feed" />

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                {['all', 'vote', 'message', 'trip', 'payment'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                      filter === f
                        ? 'bg-background text-foreground shadow-sm'
                        : 'hover:bg-background/50'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>

            <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-8 text-muted-foreground">Loading...</div>
              ) : filteredNotifications.length === 0 ? (
                <div className="flex justify-center py-8 text-muted-foreground">No notifications yet</div>
              ) : (
                filteredNotifications.map((notification) => (
                  <Card key={notification.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.body}</p>
                            {notification.tripId && (
                              <div className="mt-1 flex items-center gap-1 text-xs text-primary">
                                <MapPin className="h-3 w-3" />
                                Trip ID: {notification.tripId}
                              </div>
                            )}
                          </div>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(notification.type)}`}>
                            {getActivityIcon(notification.type)}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <button className="flex items-center gap-1 hover:text-foreground">
                            <Heart className="h-4 w-4" />
                            {notification.read ? 1 : 0}
                          </button>
                          <button className="flex items-center gap-1 hover:text-foreground">
                            <Share2 className="h-4 w-4" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
    </div>
  );
}
