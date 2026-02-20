import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-trip', (tripId: string) => {
    socket.join(`trip:${tripId}`);
    console.log(`Socket ${socket.id} joined trip:${tripId}`);
  });

  socket.on('leave-trip', (tripId: string) => {
    socket.leave(`trip:${tripId}`);
  });

  socket.on('send-message', (data: { tripId: string; content: string; userId: string }) => {
    io.to(`trip:${data.tripId}`).emit('new-message', {
      id: crypto.randomUUID(),
      ...data,
      messageType: 'TEXT',
      createdAt: new Date().toISOString(),
    });
  });

  socket.on('typing', (data: { tripId: string; userId: string; isTyping: boolean }) => {
    socket.to(`trip:${data.tripId}`).emit('user-typing', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export { app, io };
