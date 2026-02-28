import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/middleware/auth';
import { logger } from './logger';

interface SocketData {
  userId: string;
  email: string;
}

export function setupSocketIO(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

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
      logger.trace(`User disconnected: ${userId}`);
    });
  });

  return io;
}

export type { SocketData };
