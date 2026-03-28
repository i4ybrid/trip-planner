'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { Bell, Heart, MessageCircle, Share2, MapPin, DollarSign, Users, Filter, Flag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { logger } from '@/lib/logger';
import { Notification, NotificationCategory } from '@/types';

const categoryToFeedType: Record<NotificationCategory, string> = {
  MILESTONE: 'trip',
  INVITE: 'member',
  FRIEND: 'member',
  PAYMENT: 'payment',
  SETTLEMENT: 'payment',
  CHAT: 'message',
  MEMBER: 'member',
};

const FEED_FILTERS = ['all', 'trip', 'member', 'payment', 'message'];

export default function FeedPage() {
  const { data: session, status } = useSession();
  const [filter, setFilter] = useState('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    const loadNotifications = async () => {
      setIsLoading(true);
      try {
        const result = await api.getNotifications();
        if (result.data) { setNotifications(result.data); }
      } catch (error) { logger.error('Failed to load notifications:', error); }
      setIsLoading(false);
    };
    loadNotifications();
  }, [session]);

  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(n => categoryToFeedType[n.category] === filter);

  const getActivityIcon = (category: NotificationCategory) => {
    switch (category) {
      case 'MILESTONE': return <Flag className="h-4 w-4 text-current" />;
      case 'INVITE': return <Users className="h-4 w-4 text-current" />;
      case 'FRIEND': return <Users className="h-4 w-4 text-current" />;
      case 'PAYMENT': return <DollarSign className="h-4 w-4 text-current" />;
      case 'SETTLEMENT': return <DollarSign className="h-4 w-4 text-current" />;
      case 'CHAT': return <MessageCircle className="h-4 w-4 text-current" />;
      case 'MEMBER': return <Users className="h-4 w-4 text-current" />;
      default: return <Bell className="h-4 w-4 text-current" />;
    }
  };

  const getActivityColor = (category: NotificationCategory) => {
    switch (category) {
      case 'MILESTONE': return 'bg-purple-500/10 text-purple-500';
      case 'INVITE': return 'bg-green-500/10 text-green-500';
      case 'FRIEND': return 'bg-pink-500/10 text-pink-500';
      case 'PAYMENT': return 'bg-yellow-500/10 text-yellow-500';
      case 'SETTLEMENT': return 'bg-red-500/10 text-red-500';
      case 'CHAT': return 'bg-blue-500/10 text-blue-500';
      case 'MEMBER': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getTripId = (notification: Notification): string | null => {
    if (!notification.link) return null;
    const match = notification.link.match(/\/trip\/([^/]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <AppHeader title="Activity Feed" />
      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              {FEED_FILTERS.map((f) => (
                <button key={f} onClick={() => setFilter(f)} className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all ${filter === f ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50'}`}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
          </div>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-8 text-muted-foreground">Loading...</div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex justify-center py-8 text-muted-foreground">No notifications yet</div>
            ) : (
              filteredNotifications.map((notification) => {
                const tripId = getTripId(notification);
                return (
                  <Card key={notification.id} className="p-4">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">{getActivityIcon(notification.category)}</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground">{notification.body}</p>
                            {tripId && <div className="mt-1 flex items-center gap-1 text-xs text-primary"><MapPin className="h-3 w-3" />Trip: {tripId}</div>}
                          </div>
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(notification.category)}`}>{getActivityIcon(notification.category)}</div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <button className="flex items-center gap-1 hover:text-foreground"><Heart className="h-4 w-4" />{notification.isRead ? 1 : 0}</button>
                          <button className="flex items-center gap-1 hover:text-foreground"><Share2 className="h-4 w-4" />Share</button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
