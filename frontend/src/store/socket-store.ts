import { create } from 'zustand';
import { Socket } from 'socket.io-client';
import { connect, disconnect, getSocket } from '@/lib/socket';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connectionError: string | null;
  
  // Actions
  initSocket: (token: string) => Socket | null;
  destroySocket: () => void;
  setConnected: (connected: boolean) => void;
  setError: (error: string | null) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  connectionError: null,

  initSocket: (token: string) => {
    // Don't reconnect if already connected
    const existing = getSocket();
    if (existing?.connected) {
      set({ socket: existing, isConnected: true, connectionError: null });
      return existing;
    }

    try {
      const socket = connect(token);
      
      socket.on('connect', () => {
        set({ isConnected: true, connectionError: null });
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        set({ isConnected: false });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        set({ connectionError: error.message, isConnected: false });
      });

      set({ socket, isConnected: false, connectionError: null });
      return socket;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect socket';
      set({ connectionError: message, isConnected: false, socket: null });
      return null;
    }
  },

  destroySocket: () => {
    disconnect();
    set({ socket: null, isConnected: false, connectionError: null });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setError: (error: string | null) => {
    set({ connectionError: error });
  },
}));
