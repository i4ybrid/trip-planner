'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCheck } from 'lucide-react';
import { useClickOutside } from '@/hooks/use-click-outside';

const NOTIFICATION_COLORS: Record<string, string> = {
  payment: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  vote: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  reminder: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  message: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  milestone: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  invite: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m ago`;
    }
    return `${hours}h ago`;
  } else if (days === 1) {
    return 'Yesterday';
  } else if (days < 7) {
    return `${days}d ago`;
  }
  return date.toLocaleDateString();
}

export function NotificationDrawer() {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useClickOutside(drawerRef, () => setIsOpen(false));

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          ref={drawerRef}
          className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border bg-background shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllAsRead()}
                  className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex cursor-pointer items-start gap-3 border-b border-border p-4 transition-colors hover:bg-accent ${
                    !notification.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    NOTIFICATION_COLORS[notification.type] || 'bg-gray-100 text-gray-600'
                  }`}>
                    {notification.type === 'payment' && <span className="text-sm">$</span>}
                    {notification.type === 'vote' && <span className="text-sm">👍</span>}
                    {notification.type === 'message' && <span className="text-sm">💬</span>}
                    {notification.type === 'reminder' && <span className="text-sm">📅</span>}
                    {notification.type === 'milestone' && <span className="text-sm">🚩</span>}
                    {notification.type === 'invite' && <span className="text-sm">🔔</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {notification.body}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
