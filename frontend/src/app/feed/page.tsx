'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { NavigationBar } from '@/components/navigation/NavigationBar';
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
    <div className="min-h-screen text-foreground">
      <NavigationBar title="Activity Feed" />
      <main className="px-4 pb-24 pt-6 sm:px-6 lg:pb-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <section className="rounded-lg border border-border/70 bg-card/85 p-5 shadow-[var(--travel-card-shadow)] backdrop-blur md:p-7">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  <Bell className="h-3.5 w-3.5" />
                  Live Updates
                </div>
                <div>
                  <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">Activity Feed</h1>
                  <p className="mt-2 max-w-xl text-base text-muted-foreground">
                    Follow trip decisions, payments, invitations, and messages as plans come together.
                  </p>
                </div>
              </div>
              <div className="rounded-lg border border-border/70 bg-background/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Visible updates</p>
                <p className="mt-1 text-3xl font-bold">{filteredNotifications.length}</p>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-lg border border-border/70 bg-card/80 p-3 shadow-[var(--travel-card-shadow)] backdrop-blur md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {FEED_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-all ${
                    filter === f
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background/70 text-muted-foreground hover:bg-background hover:text-foreground'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-10 rounded-full bg-background/60">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="rounded-lg border border-border/70 bg-card/80 py-12 text-center text-muted-foreground shadow-[var(--travel-card-shadow)] backdrop-blur">
                Loading updates...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="rounded-lg border border-border/70 bg-card/80 py-12 text-center text-muted-foreground shadow-[var(--travel-card-shadow)] backdrop-blur">
                No notifications yet
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const tripId = getTripId(notification);
                return (
                  <Card key={notification.id} className="overflow-hidden border-border/70 bg-card/85 shadow-[var(--travel-card-shadow)] backdrop-blur">
                    <div className="flex gap-4 p-4 sm:p-5">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${getActivityColor(notification.category)}`}>
                        {getActivityIcon(notification.category)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-base font-semibold text-foreground">{notification.title}</p>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>
                            {tripId && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                                <MapPin className="h-3 w-3" />
                                Trip: {tripId}
                              </div>
                            )}
                          </div>
                          <span className="w-fit rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                            {categoryToFeedType[notification.category] || 'update'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(notification.createdAt).toLocaleDateString()}</span>
                          <button className="flex items-center gap-1 transition-colors hover:text-foreground">
                            <Heart className="h-4 w-4" />
                            {notification.isRead ? 1 : 0}
                          </button>
                          <button className="flex items-center gap-1 transition-colors hover:text-foreground">
                            <Share2 className="h-4 w-4" />
                            Share
                          </button>
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
