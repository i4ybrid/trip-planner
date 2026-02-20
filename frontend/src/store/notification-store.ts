import { create } from 'zustand';
import { Notification } from '@/types';
import { mockApi } from '@/services/mock-api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.getNotifications();
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }
      const notifications = response.data || [];
      set({ 
        notifications, 
        unreadCount: notifications.filter(n => !n.read).length,
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Failed to fetch notifications', isLoading: false });
    }
  },

  markAsRead: async (id: string) => {
    try {
      await mockApi.markNotificationRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      set({ error: 'Failed to mark notification as read' });
    }
  },

  markAllAsRead: async () => {
    try {
      await mockApi.markAllNotificationsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      set({ error: 'Failed to mark all notifications as read' });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
