'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, X, Settings, DollarSign, Users, MessageCircle, Loader2, Flag } from 'lucide-react';
import { Notification, NotificationCategory } from '@/types';
import { api } from '@/services/api';
import styles from './notification-panel.module.css';
import { logger } from '@/lib/logger';

interface NotificationPanelProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClose: () => void;
  onRefresh: () => void;
}

const notificationIcons: Record<NotificationCategory, typeof Bell> = {
  MILESTONE: Flag,
  INVITE: Users,
  FRIEND: Users,
  PAYMENT: DollarSign,
  SETTLEMENT: DollarSign,
  CHAT: MessageCircle,
  MEMBER: Users,
};

const notificationColors: Record<NotificationCategory, string> = {
  MILESTONE: '#8b5cf6',
  INVITE: '#22c55e',
  FRIEND: '#ec4899',
  PAYMENT: '#f59e0b',
  SETTLEMENT: '#ef4444',
  CHAT: '#3b82f6',
  MEMBER: '#6b7280',
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

function getNotificationLink(notification: Notification): string {
  if (notification.link) return notification.link;
  switch (notification.referenceType) {
    case 'TRIP': case 'MILESTONE': return '/trip/' + notification.referenceId;
    case 'BILL_SPLIT': return '/trip/' + notification.referenceId + '/payments';
    case 'INVITE': return '/invites/pending';
    case 'FRIEND_REQUEST': return '/friends';
    case 'MESSAGE': return '/trip/' + notification.referenceId + '/chat';
    case 'USER': return '/profile/' + notification.referenceId;
    default: return '/dashboard';
  }
}

export const NotificationPanel = forwardRef<HTMLDivElement, NotificationPanelProps>(
  function NotificationPanel({ notifications, isLoading, onMarkAsRead, onDismiss, onMarkAllAsRead, onClose, onRefresh }, ref) {
    const router = useRouter();
    const [processingInvite, setProcessingInvite] = React.useState<string | null>(null);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleInviteAction = async (notification: Notification, action: 'accept' | 'decline') => {
      if (!notification.referenceId || notification.referenceType !== 'INVITE') return;
      setProcessingInvite(notification.id);
      try {
        if (action === 'accept') { await api.acceptInvite(notification.referenceId); }
        else { await api.declineInvite(notification.referenceId); }
        onDismiss(notification.id);
        onRefresh();
        if (action === 'accept') { router.push('/invites/pending'); }
      } catch (error: any) {
        logger.error('Failed to ' + action + ' invite:', error);
        alert(error.message || 'Failed to ' + action + ' invite');
      }
      setProcessingInvite(null);
    };

    return (
      <div ref={ref} className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.headerTitle}><Bell size={18} /><h3>Notifications</h3></div>
          <div className={styles.headerActions}>
            {unreadCount > 0 && (
              <button className={styles.headerButton} onClick={onMarkAllAsRead} title="Mark all as read">
                <Check size={16} /><span>Mark all read</span>
              </button>
            )}
            <Link href="/settings?tab=notifications" className={styles.headerButton} onClick={onClose} title="Notification settings">
              <Settings size={16} />
            </Link>
          </div>
        </div>
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}><div className={styles.spinner} /><span>Loading notifications...</span></div>
          ) : notifications.length === 0 ? (
            <div className={styles.empty}><Bell size={40} strokeWidth={1} /><p>No notifications yet</p><span>We&apos;ll notify you when something happens</span></div>
          ) : (
            <div className={styles.list}>
              {notifications.map((notification) => {
                const Icon = notificationIcons[notification.category] || Bell;
                const color = notificationColors[notification.category] || '#6b7280';
                const link = getNotificationLink(notification);
                const isInvite = notification.category === 'INVITE' && !notification.title.includes('Invite Accepted') && !notification.title.includes('Invite Declined');
                const isProcessing = processingInvite === notification.id;
                return (
                  <div key={notification.id} className={`${styles.item} ${!notification.isRead ? styles.unread : ''} ${isInvite ? styles.inviteItem : ''}`}>
                    <div className={styles.icon} style={{ backgroundColor: color + '20', color }}><Icon size={18} /></div>
                    <div className={styles.itemContentWrapper}>
                      <Link href={link} className={styles.itemContent}
                        onClick={() => { if (!notification.isRead) { onMarkAsRead(notification.id); } onClose(); }}>
                        <div className={styles.itemTitle}>{notification.title}</div>
                        <div className={styles.itemBody}>{notification.body}</div>
                        <div className={styles.itemTime}>{formatTimeAgo(notification.createdAt)}</div>
                      </Link>
                      {isInvite && (
                        <div className={styles.inviteActions}>
                          <button className={styles.declineButton} onClick={() => handleInviteAction(notification, 'decline')} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X size={14} />}Decline
                          </button>
                          <button className={styles.acceptButton} onClick={() => handleInviteAction(notification, 'accept')} disabled={isProcessing}>
                            {isProcessing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check size={14} />}Accept
                          </button>
                        </div>
                      )}
                    </div>
                    <div className={styles.itemActions}>
                      {!notification.isRead && !isInvite && (
                        <button className={styles.actionButton} onClick={() => onMarkAsRead(notification.id)} title="Mark as read"><Check size={14} /></button>
                      )}
                      <button className={styles.actionButton} onClick={() => onDismiss(notification.id)} title="Dismiss"><X size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {notifications.length > 0 && (
          <div className={styles.footer}><Link href="/notifications" onClick={onClose}>View all notifications</Link></div>
        )}
      </div>
    );
  }
);
