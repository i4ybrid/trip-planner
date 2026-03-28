'use client';

import { useState, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { LeftSidebar } from '@/components/left-sidebar';
import { AppHeader } from '@/components/app-header';
import { Bell, Check, CheckCheck, X, Calendar, DollarSign, MessageCircle, ThumbsUp, Users, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NotificationType } from '@/types';

const ITEMS_PER_PAGE = 20;

const NOTIFICATION_ICONS: Record<string, typeof Bell> = {
  MILESTONE: Flag,
  INVITE: Users,
  VOTE: ThumbsUp,
  ACTIVITY: Calendar,
  PAYMENT: DollarSign,
  MESSAGE: MessageCircle,
  REMINDER: Bell,
  PAYMENT_DUE: DollarSign,
  PAYMENT_RECEIVED: DollarSign,
  VOTE_DEADLINE: ThumbsUp,
  TRIP_STARTING: Calendar,
  FRIEND_REQUEST: Users,
  DM_MESSAGE: MessageCircle,
  PAYMENT_REQUEST: DollarSign,
  SETTLEMENT_REMINDER: DollarSign,
};

const NOTIFICATION_COLORS: Record<string, string> = {
  MILESTONE: 'bg-purple-500/10 text-purple-500',
  INVITE: 'bg-green-500/10 text-green-500',
  VOTE: 'bg-blue-500/10 text-blue-500',
  ACTIVITY: 'bg-purple-500/10 text-purple-500',
  PAYMENT: 'bg-yellow-500/10 text-yellow-500',
  PAYMENT_DUE: 'bg-yellow-500/10 text-yellow-500',
  PAYMENT_RECEIVED: 'bg-green-500/10 text-green-500',
  SETTLEMENT: 'bg-red-500/10 text-red-500',
  SETTLEMENT_REMINDER: 'bg-red-500/10 text-red-500',
  PAYMENT_REQUEST: 'bg-yellow-500/10 text-yellow-500',
  MESSAGE: 'bg-blue-500/10 text-blue-500',
  DM_MESSAGE: 'bg-blue-500/10 text-blue-500',
  REMINDER: 'bg-amber-500/10 text-amber-500',
  TRIP_STARTING: 'bg-green-500/10 text-green-500',
  FRIEND_REQUEST: 'bg-pink-500/10 text-pink-500',
  VOTE_DEADLINE: 'bg-blue-500/10 text-blue-500',
};

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'trip', label: 'Trips' },
  { key: 'payment', label: 'Payments' },
  { key: 'message', label: 'Messages' },
  { key: 'member', label: 'Members' },
  { key: 'vote', label: 'Votes' },
];

const TYPE_TO_CATEGORY: Record<NotificationType, string> = {
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
  PAYMENT_REQUEST: 'payment',
  SETTLEMENT_REMINDER: 'payment',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return diffMins + 'm ago';
  if (diffHours < 24) return diffHours + 'h ago';
  if (diffDays < 7) return diffDays + 'd ago';
  return date.toLocaleDateString();
}

function getNotificationLink(notification: { type: NotificationType; referenceId?: string; referenceType?: string; link?: string }): string {
  if (notification.link) {
    return notification.link;
  }
  
  switch (notification.referenceType) {
    case 'TRIP':
    case 'MILESTONE':
      return '/trip/' + notification.referenceId;
    case 'BILL_SPLIT':
      return '/trip/' + notification.referenceId + '/payments';
    case 'INVITE':
      return '/invites/pending';
    case 'FRIEND_REQUEST':
      return '/friends';
    case 'MESSAGE':
      return '/trip/' + notification.referenceId + '/chat';
    case 'USER':
      return '/profile/' + notification.referenceId;
    default:
      return '/dashboard';
  }
}

export default function NotificationsPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();

  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications;
    return notifications.filter(n => TYPE_TO_CATEGORY[n.type] === activeCategory);
  }, [notifications, activeCategory]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE);

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LeftSidebar />
      <AppHeader 
        title="Notifications"
        actions={
          unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )
        }
      />

      <main className="ml-sidebar p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex items-center gap-2 border-b border-border pb-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.key}
                onClick={() => {
                  setActiveCategory(category.key);
                  setCurrentPage(1);
                }}
                className={"px-4 py-2 text-sm font-medium rounded-lg transition-colors " + (
                  activeCategory === category.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {category.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p>Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">
                {activeCategory === 'all'
                  ? "You're all caught up!"
                  : 'No ' + activeCategory + ' notifications'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedNotifications.map((notification) => {
                  const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
                  const colorClass = NOTIFICATION_COLORS[notification.type] || 'bg-gray-500/10 text-gray-500';
                  const link = getNotificationLink(notification);

                  return (
                    <Card
                      key={notification.id}
                      className={"p-4 transition-colors hover:bg-accent/50 " + (
                        !notification.isRead ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                      )}
                    >
                      <div className="flex gap-4">
                        <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full " + colorClass}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={link}
                            onClick={() => handleNotificationClick(notification)}
                            className="block"
                          >
                            <p className={"text-sm " + (!notification.isRead ? 'font-semibold' : 'font-medium')}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {notification.body}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </a>
                        </div>
                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
