'use client';

import { useState } from 'react';
import { LeftSidebar } from '@/components/left-sidebar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationDrawer } from '@/components/notification-drawer';
import { Bell, Heart, MessageCircle, ThumbsUp, Share2, MapPin, Calendar, DollarSign, Users, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Activity {
  id: string;
  type: 'vote' | 'message' | 'like' | 'payment' | 'trip' | 'member';
  user: {
    name: string;
    avatar: string | null;
  };
  content: string;
  trip?: string;
  timestamp: string;
  likes: number;
  comments: number;
}

export default function FeedPage() {
  const [filter, setFilter] = useState('all');

  const activities: Activity[] = [
    {
      id: '1',
      type: 'vote',
      user: { name: 'Sarah Chen', avatar: null },
      content: 'voted for "Visit the Eiffel Tower" in Paris Adventure',
      trip: 'Paris Adventure',
      timestamp: '2 minutes ago',
      likes: 3,
      comments: 1,
    },
    {
      id: '2',
      type: 'message',
      user: { name: 'Mike Johnson', avatar: null },
      content: 'shared a photo in Summer Road Trip 2024',
      trip: 'Summer Road Trip 2024',
      timestamp: '15 minutes ago',
      likes: 8,
      comments: 2,
    },
    {
      id: '3',
      type: 'payment',
      user: { name: 'Emily Davis', avatar: null },
      content: 'paid $50 for hotel booking',
      trip: 'Tokyo Adventure',
      timestamp: '1 hour ago',
      likes: 2,
      comments: 0,
    },
    {
      id: '4',
      type: 'member',
      user: { name: 'Alex Rivera', avatar: null },
      content: 'joined Summer Road Trip 2024',
      trip: 'Summer Road Trip 2024',
      timestamp: '2 hours ago',
      likes: 5,
      comments: 3,
    },
    {
      id: '5',
      type: 'trip',
      user: { name: 'Jordan Lee', avatar: null },
      content: 'created a new trip: Winter Getaway 2024',
      trip: 'Winter Getaway 2024',
      timestamp: '3 hours ago',
      likes: 12,
      comments: 4,
    },
    {
      id: '6',
      type: 'like',
      user: { name: 'Taylor Smith', avatar: null },
      content: 'liked your comment on Beach Day activities',
      trip: 'Summer Road Trip 2024',
      timestamp: '5 hours ago',
      likes: 1,
      comments: 0,
    },
    {
      id: '7',
      type: 'vote',
      user: { name: 'Casey Brown', avatar: null },
      content: 'voted for "Sushi dinner at 7pm" in Tokyo Adventure',
      trip: 'Tokyo Adventure',
      timestamp: 'Yesterday',
      likes: 4,
      comments: 2,
    },
    {
      id: '8',
      type: 'message',
      user: { name: 'Morgan White', avatar: null },
      content: 'started a discussion about flight options',
      trip: 'Paris Adventure',
      timestamp: 'Yesterday',
      likes: 2,
      comments: 5,
    },
  ];

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'vote': return <ThumbsUp className="h-4 w-4" />;
      case 'message': return <MessageCircle className="h-4 w-4" />;
      case 'like': return <Heart className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'trip': return <Calendar className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
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
      <div className="pl-sidebar">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Activity Feed</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <NotificationDrawer />
          </div>
        </header>

        <main className="p-6">
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
              {filteredActivities.map((activity) => (
                <Card key={activity.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{activity.user.name}</p>
                          <p className="text-sm text-muted-foreground">{activity.content}</p>
                          {activity.trip && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-primary">
                              <MapPin className="h-3 w-3" />
                              {activity.trip}
                            </div>
                          )}
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getActivityColor(activity.type)}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{activity.timestamp}</span>
                        <button className="flex items-center gap-1 hover:text-foreground">
                          <Heart className="h-4 w-4" />
                          {activity.likes}
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground">
                          <MessageCircle className="h-4 w-4" />
                          {activity.comments}
                        </button>
                        <button className="flex items-center gap-1 hover:text-foreground">
                          <Share2 className="h-4 w-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
