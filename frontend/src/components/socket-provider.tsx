'use client';

import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSocketStore } from '@/store/socket-store';
import { useNotificationStore } from '@/store';
import { invalidateCacheByPrefix } from '@/services/api';
import { Message } from '@/types';
import { logger } from '@/lib/logger';

interface SocketProviderProps {
  children: React.ReactNode;
}

/**
 * SocketProvider - manages WebSocket lifecycle based on auth state.
 * 
 * Connects the socket when a user is authenticated (after receiving a valid session),
 * and disconnects when the user logs out.
 * 
 * Listens for real-time events:
 * - notification:new → refreshes notification store to update badge count
 * - message:new → invalidates trip message cache so next fetch gets latest
 * - dm:new → invalidates DM conversation cache
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session, status } = useSession();
  const { initSocket, destroySocket, isConnected } = useSocketStore();

  // Get token from session
  const token = session?.accessToken as string | undefined;

  useEffect(() => {
    // Only connect once session is loaded and user has a token
    if (status === 'loading') return;

    if (status === 'authenticated' && token) {
      // Connect socket with auth token
      const socket = initSocket(token);
      if (socket) {
        setupEventListeners(socket);
        logger.info('SocketProvider: connected socket for user');
      }
    } else {
      // Not authenticated → disconnect socket
      destroySocket();
    }

    return () => {
      // Cleanup on unmount
      destroySocket();
    };
  }, [status, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const setupEventListeners = useCallback((socket: ReturnType<typeof initSocket>) => {
    if (!socket) return;

    // Handle new notification
    socket.on('notification:new', (data: { notification: unknown }) => {
      logger.info('Socket: received notification:new', data);
      // Refresh notification store to update badge count
      useNotificationStore.getState().fetchNotifications();
    });

    // Handle new trip chat message
    socket.on('message:new', (data: { message: Message; tripId: string }) => {
      logger.info('Socket: received message:new', data);
      // Invalidate trip message cache so components re-fetch
      if (data.tripId) {
        invalidateCacheByPrefix(`trip:${data.tripId}:messages`);
      }
    });

    // Handle new direct message
    socket.on('dm:new', (data: { message: Message; conversationId: string }) => {
      logger.info('Socket: received dm:new', data);
      // Invalidate DM conversation cache
      if (data.conversationId) {
        invalidateCacheByPrefix(`dm:${data.conversationId}`);
        invalidateCacheByPrefix('dm:conversations');
      }
    });

    // Handle trip updates (e.g., member added, activity created)
    socket.on('trip:updated', (data: { tripId: string }) => {
      logger.info('Socket: received trip:updated', data);
      if (data.tripId) {
        invalidateCacheByPrefix(`trip:${data.tripId}`);
      }
    });
  }, []);

  return <>{children}</>;
}
