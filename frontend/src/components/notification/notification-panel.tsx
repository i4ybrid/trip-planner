'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { Bell, Check, X, Settings, Calendar, DollarSign, Users, MessageCircle, ThumbsUp, Mail, Smartphone } from 'lucide-react';
import { Notification, NotificationType } from '@/types';
import styles from './notification-panel.module.css';

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onRefresh: () => void;
}

const notificationIcons: Record<NotificationType, typeof Bell> = {
  INVITE: Users,
  VOTE: ThumbsUp,
  ACTIVITY: Calendar,
  PAYMENT: DollarSign,
  PAYMENT_DUE: DollarSign,
  PAYMENT_RECEIVED: DollarSign,
  MESSAGE: MessageCircle,
  DM_MESSAGE: MessageCircle,
  FRIEND_REQUEST: Users,
  TRIP_STARTING: Calendar,
  VOTE_DEADLINE: ThumbsUp,
  MILESTONE: Bell,
  REMINDER: Bell,
};

const notificationColors: Record<NotificationType, string> = {
  INVITE: '#22c55e',
  VOTE: '#3b82f6',
  ACTIVITY: '#8b5cf6',
  PAYMENT: '#22c55e',
  PAYMENT_DUE: '#f59e0b',
  PAYMENT_RECEIVED: '#22c55e',
  MESSAGE: '#3b82f6',
  DM_MESSAGE: '#3b82f6',
  FRIEND_REQUEST: '#22c55e',
  TRIP_STARTING: '#22c55e',
  VOTE_DEADLINE: '#f59e0b',
  MILESTONE: '#8b5cf6',
  REMINDER: '#6b7280',
};

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotificationLink(notification: Notification): string {
  if (notification.actionUrl) {
    return notification.actionUrl;
  }
  
  switch (notification.actionType) {
    case 'trip':
      return `/trip/${notification.actionId}`;
    case 'payment':
      return `/trip/${notification.tripId}/payments`;
    case 'vote':
    case 'activity':
      return `/trip/${notification.tripId}/activities`;
    case 'message':
      return `/trip/${notification.tripId}/chat`;
    case 'friend_request':
      return '/friends';
    case 'dm':
      return `/messages/${notification.actionId}`;
    default:
      return notification.tripId ? `/trip/${notification.tripId}` : '/dashboard';
  }
}

export const NotificationPanel = forwardRef<HTMLDivElement, NotificationPanelProps>(
  function NotificationPanel(
    { notifications, isLoading, onMarkAsRead, onDismiss, onMarkAllAsRead, onClose, onRefresh },
    ref
  ) {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
      <div ref={ref} className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Bell size={18} />
            <h3>Notifications</h3>
          </div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button
                className={styles.headerButton}
                onClick={onMarkAllAsRead}
                title="Mark all as read"
              >
                <Check size={16} />
                <span>Mark all read</span>
              </button>
            )}
            <Link
              href="/settings/notifications"
              className={styles.headerButton}
              onClick={onClose}
              title="Notification settings"
            >
              <Settings size={16} />
            </Link>
          </div>
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}>
              <Bell size={40} strokeWidth={1} />
              <p>No notifications yet</p>
              <span>We&apos;ll notify you when something happens</span>
            </div>
          ) : (
            <div className={styles.list}>
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.type] || Bell;
                const color = notificationColors[notification.type] || '#6b7280';
                const link = getNotificationLink(notification);

                return (
                  <div
                    key={notification.id}
                    className={`${styles.item} ${!notification.read ? styles.unread : ''}`}
                  >
                    <div
                      className={styles.icon}
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <Icon size={18} />
                    </div>
                    <Link
                      href={link}
                      className={styles.itemContent}
                      onClick={() => {
                        if (!notification.read) {
                          onMarkAsRead(notification.id);
                        }
                        onClose();
                      }}
                    >
                      <div className={styles.itemTitle}>
                        {notification.title}
                      </div>
                      <div className={styles.itemBody}>
                        {notification.body}
                      </div>
                      <div className={styles.itemTime}>
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </Link>
                    <div className={styles.itemActions}>
                      {!notification.read && (
                        <button
                          className={styles.actionButton}
                          onClick={() => onMarkAsRead(notification.id)}
                          title="Mark as read"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        className={styles.actionButton}
                        onClick={() => onDismiss(notification.id)}
                        title="Dismiss"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className={styles.footer}>
            <Link href="/notifications" onClick={onClose}>
              View all notifications
            </Link>
          </div>
        )}
      </div>
    );
  }
);
