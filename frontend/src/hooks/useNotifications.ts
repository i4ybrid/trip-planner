'use client';

import { useEffect, useCallback } from 'react';
import { useNotificationStore } from '@/store';

const POLL_INTERVAL = 60000; // 60 seconds

export function useNotifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearError,
  } = useNotificationStore();

  // Poll for new notifications every 60 seconds
  useEffect(() => {
    // Initial fetch
    fetchNotifications();

    // Set up polling
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  const refresh = useCallback(() => {
    return fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    refresh,
    clearError,
  };
}
