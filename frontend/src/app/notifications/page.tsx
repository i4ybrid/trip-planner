'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trash2, Filter, Loader2 } from 'lucide-react';
import { api } from '@/services/api';
import { Notification, NotificationCategory } from '@/types';
import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/ui/button';
import styles from './notifications.module.css';

const CATEGORIES = [
  { label: 'All', value: 'ALL' },
  { label: 'Milestones', value: 'MILESTONE' },
  { label: 'Invites', value: 'INVITE' },
  { label: 'Payments', value: 'PAYMENT' },
  { label: 'Settlements', value: 'SETTLEMENT' },
  { label: 'Chat', value: 'CHAT' },
  { label: 'Friends', value: 'FRIEND' },
  { label: 'Members', value: 'MEMBER' },
];

const categoryColors: Record<NotificationCategory, string> = {
  MILESTONE: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  INVITE: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  FRIEND: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  PAYMENT: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  SETTLEMENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  CHAT: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  MEMBER: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const categoryIcons: Record<NotificationCategory, string> = {
  MILESTONE: 'M',
  INVITE: 'I',
  FRIEND: 'F',
  PAYMENT: '$',
  SETTLEMENT: 'S',
  CHAT: 'C',
  MEMBER: 'M',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const diffMins = Math.floor(diff / (1000 * 60));
  const diffHours = Math.floor(diff / (1000 * 60 * 60));
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return diffMins + 'm ago';
  if (diffHours < 24) return diffHours + 'h ago';
  if (diffDays < 7) return diffDays + 'd ago';
  return date.toLocaleDateString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationCategory | 'ALL'>('ALL');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const MAX_TOTAL = 50;

  useEffect(() => { loadNotifications(); }, [activeFilter]);

  const loadNotifications = async () => {
    setIsLoading(true);
    setHasMore(true);
    setCursor(null);
    try {
      const result = await api.getNotifications();
      if (result.data) {
        setNotifications(result.data);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore && result.data.length < MAX_TOTAL);
        setUnreadCount(0); // Will be fetched separately if needed
      }
    } catch (error) { console.error('Failed to load notifications:', error); }
    setIsLoading(false);
  };

  const loadMore = async () => {
    if (!cursor || isLoadingMore || notifications.length >= MAX_TOTAL) return;
    setIsLoadingMore(true);
    try {
      const result = await api.getNotifications(cursor);
      if (result.data) {
        const newNotifications = result.data;
        const totalNow = notifications.length + newNotifications.length;
        const capped = totalNow >= MAX_TOTAL ? newNotifications.slice(0, MAX_TOTAL - notifications.length) : newNotifications;
        setNotifications(prev => [...prev, ...capped]);
        setCursor(result.nextCursor);
        setHasMore(result.hasMore && totalNow < MAX_TOTAL);
      }
    } catch (error) { console.error('Failed to load more notifications:', error); }
    setIsLoadingMore(false);
  };

  const handleMarkAsRead = async (id: string) => {
    setProcessingId(id);
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } finally { setProcessingId(null); }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) { console.error('Failed to mark all as read:', error); }
  };

  const handleDismiss = async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    try {
      await api.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.isRead) { setUnreadCount(prev => Math.max(0, prev - 1)); }
    } catch (error) { console.error('Failed to delete notification:', error); }
  };

  const handleAccept = async (notification: Notification) => {
    const token = notification.referenceId;
    if (!token) return;
    setProcessingId(notification.id);
    try {
      const result = await api.acceptInvite(token);
      if (result.data?.tripId) {
        // Remove the notification and redirect
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        if (!notification.isRead) { setUnreadCount(prev => Math.max(0, prev - 1)); }
        window.location.href = `/trip/${result.data.tripId}`;
      }
    } catch (error) {
      console.error('Failed to accept invite:', error);
      alert('Failed to accept invite. It may have expired or already been processed.');
    } finally { setProcessingId(null); }
  };

  const handleDecline = async (notification: Notification) => {
    const token = notification.referenceId;
    if (!token) return;
    setProcessingId(notification.id);
    try {
      await api.declineInvite(token);
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.isRead) { setUnreadCount(prev => Math.max(0, prev - 1)); }
    } catch (error) {
      console.error('Failed to decline invite:', error);
      alert('Failed to decline invite. It may have expired or already been processed.');
    } finally { setProcessingId(null); }
  };

  const grouped = notifications.reduce((groups, notification) => {
    const dateKey = formatDate(notification.createdAt);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <div>
      <AppHeader title="Notifications"
        actions={<div className="flex items-center gap-2">{unreadCount > 0 && <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead}><CheckCheck size={16} className="mr-1" />Mark all read</Button>}</div>}
      />
      <main className={styles.main}>
        <div className={styles.filterBar}>
          <Filter size={16} className="text-muted-foreground" />
          {CATEGORIES.map(cat => (
            <button key={cat.value} className={`${styles.filterTab} ${activeFilter === cat.value ? styles.filterTabActive : ''}`} onClick={() => { setActiveFilter(cat.value as NotificationCategory | 'ALL'); }}>
              {cat.label}
            </button>
          ))}
        </div>
        {isLoading ? (
          <div className={styles.loading}><Loader2 className="h-8 w-8 animate-spin" /><span>Loading notifications...</span></div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}><Bell size={48} strokeWidth={1} /><h2>No notifications yet</h2><p>We'll notify you when something happens</p></div>
        ) : (
          <>
            <div className={styles.list}>
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <div className={styles.dateHeader}>{date}</div>
                  {items.map(notification => (
                    <div key={notification.id} className={`${styles.item} ${!notification.isRead ? styles.unread : ''}`}>
                      <div className={`${styles.icon} ${categoryColors[notification.category] || 'bg-gray-100 text-gray-600'}`}>
                        <span className="text-base font-bold">{categoryIcons[notification.category] || 'N'}</span>
                      </div>
                      <Link href={notification.link || '/dashboard'} className={styles.content} onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}>
                        <div className={styles.contentHeader}>
                          <span className={styles.title}>{notification.title}</span>
                          <span className={styles.time}>{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                        <p className={styles.body}>{notification.body}</p>
                      </Link>
                      <div className={styles.actions}>
                        {notification.category === 'INVITE' && (
                          <>
                            <button className={styles.actionButton} onClick={() => handleAccept(notification)} title="Accept invite" disabled={processingId === notification.id} style={{ color: 'green' }}>
                              {processingId === notification.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                            </button>
                            <button className={styles.actionButton} onClick={() => handleDecline(notification)} title="Decline invite" disabled={processingId === notification.id} style={{ color: 'red' }}>
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        {notification.category !== 'INVITE' && (
                          <>
                            {!notification.isRead && (
                              <button className={styles.actionButton} onClick={() => handleMarkAsRead(notification.id)} title="Mark as read" disabled={processingId === notification.id}>
                                {processingId === notification.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                              </button>
                            )}
                            <button className={styles.actionButton} onClick={() => handleDismiss(notification.id)} title="Delete"><Trash2 size={16} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {hasMore && notifications.length < MAX_TOTAL && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                <Button variant="outline" onClick={loadMore} disabled={isLoadingMore}>
                  {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
