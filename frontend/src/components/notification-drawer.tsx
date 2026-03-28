'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCheck, UserPlus, Check, Loader2, DollarSign, MessageCircle, Flag, Users } from 'lucide-react';
import { useClickOutside } from '@/hooks/use-click-outside';
import { api } from '@/services/api';
import { Notification, NotificationCategory } from '@/types';

const categoryColors: Record<NotificationCategory, string> = {
  MILESTONE: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  INVITE: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  FRIEND: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  PAYMENT: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  SETTLEMENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  CHAT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) { const hours = Math.floor(diff / (1000 * 60 * 60)); if (hours === 0) { const minutes = Math.floor(diff / (1000 * 60)); return minutes + 'm ago'; } return hours + 'h ago'; }
  else if (days === 1) return 'Yesterday';
  else if (days < 7) return days + 'd ago';
  return date.toLocaleDateString();
}

function getCategoryIcon(category: NotificationCategory) {
  switch (category) {
    case 'MILESTONE': return <Flag className="h-4 w-4" />;
    case 'INVITE': return <Users className="h-4 w-4" />;
    case 'FRIEND': return <UserPlus className="h-4 w-4" />;
    case 'PAYMENT': return <DollarSign className="h-4 w-4" />;
    case 'SETTLEMENT': return <DollarSign className="h-4 w-4" />;
    case 'CHAT': return <MessageCircle className="h-4 w-4" />;
    case 'MEMBER': return <Users className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
}

export function NotificationDrawer() {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();

  useClickOutside(drawerRef, () => setIsOpen(false));

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleAcceptRequest = useCallback(async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.referenceId) return;
    setProcessingRequest(notification.id);
    try { await api.respondToFriendRequest(notification.referenceId, 'ACCEPTED'); markAsRead(notification.id); fetchNotifications(); }
    finally { setProcessingRequest(null); }
  }, [markAsRead, fetchNotifications]);

  const handleDeclineRequest = useCallback(async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.referenceId) return;
    setProcessingRequest(notification.id);
    try { await api.respondToFriendRequest(notification.referenceId, 'DECLINED'); markAsRead(notification.id); fetchNotifications(); }
    finally { setProcessingRequest(null); }
  }, [markAsRead, fetchNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) { markAsRead(notification.id); }
    if (notification.link) { router.push(notification.link); }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button variant="ghost" onClick={() => setIsOpen(!isOpen)} className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      {isOpen && (
        <div ref={drawerRef} className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllAsRead()} className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground">
                  <CheckCheck className="mr-1 h-3 w-3" />Mark all read
                </Button>
              )}
              <Button variant="ghost" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0"><X className="h-4 w-4 text-current" /></Button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((notification) => {
                const colorClass = categoryColors[notification.category] || 'bg-gray-100 text-gray-600';
                const isFriendRequest = notification.category === 'FRIEND' && notification.referenceType === 'FRIEND_REQUEST';
                return (
                  <div key={notification.id} onClick={() => handleNotificationClick(notification)}
                    className={`flex cursor-pointer items-start gap-3 border-b border-border p-4 transition-colors hover:bg-accent ${!notification.isRead ? 'bg-primary/5' : ''}`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>{getCategoryIcon(notification.category)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>{notification.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{notification.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatTimeAgo(notification.createdAt)}</p>
                      {isFriendRequest && (
                        <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="primary" className="h-7 text-xs" onClick={(e) => handleAcceptRequest(notification, e)} disabled={processingRequest === notification.id}>
                            {processingRequest === notification.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Check className="mr-1 h-3 w-3" />Accept</>}
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => handleDeclineRequest(notification, e)} disabled={processingRequest === notification.id}>Decline</Button>
                        </div>
                      )}
                    </div>
                    {!notification.isRead && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
