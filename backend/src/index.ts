import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';

import usersRouter from './routes/users';
import tripsRouter from './routes/trips';
import activitiesRouter from './routes/activities';
import messagesRouter from './routes/messages';
import paymentsRouter from './routes/payments';
import mediaRouter from './routes/media';
import notificationsRouter from './routes/notifications';
import invitesRouter from './routes/invites';

const logDir = process.env.LOG_DIR || '/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(logDir, `backend-${new Date().toISOString().split('T')[0]}.log`), { flags: 'a' });

function log(...args: unknown[]) {
  const msg = `[${new Date().toISOString()}] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`;
  logStream.write(msg + '\n');
  console.log(...args);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/invites', invitesRouter);

// Socket.io for real-time features
interface ConnectedUser {
  userId: string;
  socketId: string;
}

const connectedUsers = new Map<string, ConnectedUser>();

io.on('connection', (socket) => {
  log('Client connected:', socket.id);

  socket.on('authenticate', (userId: string) => {
    connectedUsers.set(userId, { userId, socketId: socket.id });
    log(`User ${userId} authenticated`);
  });

  socket.on('join-trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
    log(`Socket ${socket.id} joined trip:${tripId}`);
  });

  socket.on('leave-trip', (tripId: string) => {
    socket.leave(`trip:${tripId}`);
  });

  socket.on('send-message', (data: { tripId: string; content: string; userId: string }) => {
    const message = {
      id: crypto.randomUUID(),
      ...data,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    };
    io.to(`trip:${data.tripId}`).emit('new-message', message);
  });

  socket.on('typing', (data: { tripId: string; userId: string; isTyping: boolean }) => {
    socket.to(`trip:${data.tripId}`).emit('user-typing', data);
  });

  socket.on('mark-read', (data: { tripId: string; userId: string; messageId: string }) => {
    socket.to(`trip:${data.tripId}`).emit('message-read', {
      userId: data.userId,
      messageId: data.messageId,
    });
  });

  socket.on('disconnect', () => {
    // Remove user from connected users
    for (const [userId, user] of connectedUsers.entries()) {
      if (user.socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
    log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  log(`🚀 Server running on http://${HOST}:${PORT}`);
});

export { app, io };
