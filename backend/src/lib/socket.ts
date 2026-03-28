import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/middleware/auth';
import { logger } from './logger';

interface SocketData {
  userId: string;
  email: string;
}

// Connection manager: userId → socket
const connectionManager = new Map<string, Socket>();

// Module-level io instance for cross-service access
let ioInstance: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

function extractCookieToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
  return match ? match[1] : null;
}

export function getConnectionManager(): Map<string, Socket> {
  return connectionManager;
}

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware — checks multiple token sources
  io.use((socket, next) => {
    let token: string | null = null;

    // 1. socket.handshake.auth.token (existing)
    token = socket.handshake.auth.token as string | null;

    // 2. Authorization header → Bearer token
    if (!token) {
      token = extractBearerToken(socket.handshake.headers.authorization as string | undefined);
    }

    // 3. Cookie header → extract token
    if (!token) {
      token = extractCookieToken(socket.handshake.headers.cookie as string | undefined);
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;

    // Register connection in manager
    connectionManager.set(userId, socket);

    // Auto-join user-specific room for push notifications
    socket.join(`user:${userId}`);

    logger.trace(`User connected: ${userId}`);

    // Join trip room
    socket.on('join-trip', (tripId: string) => {
      socket.join(`trip:${tripId}`);
      logger.trace(`User ${userId} joined trip ${tripId}`);
    });

    // Leave trip room
    socket.on('leave-trip', (tripId: string) => {
      socket.leave(`trip:${tripId}`);
      logger.trace(`User ${userId} left trip ${tripId}`);
    });

    // Send message to trip
    socket.on('send-message', (data: { tripId: string; content: string; messageType?: string }) => {
      socket.to(`trip:${data.tripId}`).emit('new-message', {
        tripId: data.tripId,
        senderId: userId,
        content: data.content,
        messageType: data.messageType || 'TEXT',
        createdAt: new Date().toISOString(),
      });
    });

    // Typing indicator
    socket.on('typing', (data: { tripId: string }) => {
      socket.to(`trip:${data.tripId}`).emit('user-typing', {
        tripId: data.tripId,
        userId,
      });
    });

    socket.on('stop-typing', (data: { tripId: string }) => {
      socket.to(`trip:${data.tripId}`).emit('user-stop-typing', {
        tripId: data.tripId,
        userId,
      });
    });

    // Join DM conversation
    socket.on('join-dm', (conversationId: string) => {
      socket.join(`dm:${conversationId}`);
      logger.trace(`User ${userId} joined DM ${conversationId}`);
    });

    // Send DM
    socket.on('send-dm', (data: { conversationId: string; content: string }) => {
      socket.to(`dm:${data.conversationId}`).emit('new-dm', {
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content,
        createdAt: new Date().toISOString(),
      });
    });

    // Vote updates
    socket.on('vote-cast', (data: { activityId: string; tripId: string }) => {
      socket.to(`trip:${data.tripId}`).emit('vote-updated', {
        activityId: data.activityId,
      });
    });

    // Payment updates
    socket.on('payment-updated', (data: { billSplitId: string; tripId: string }) => {
      socket.to(`trip:${data.tripId}`).emit('payment-status-changed', {
        billSplitId: data.billSplitId,
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      connectionManager.delete(userId);
      logger.trace(`User disconnected: ${userId}`);
    });
  });

  ioInstance = io;
  return io;
}

export type { SocketData };
