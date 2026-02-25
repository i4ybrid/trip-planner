import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { setupSocketIO } from '@/lib/socket';
import usersRouter from '@/routes/users';
import tripsRouter from '@/routes/trips';
import activitiesRouter from '@/routes/activities';
import invitesRouter from '@/routes/invites';
import messagesRouter from '@/routes/messages';
import paymentsRouter from '@/routes/payments';
import friendsRouter from '@/routes/friends';
import notificationsRouter from '@/routes/notifications';

// Load environment variables
dotenv.config();

const app = express();
app.set('strict routing', true); // Treat /trips and /trips/ as different routes
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes - auth routes must be first (public)
app.use('/api', usersRouter); // Contains /auth/login, /auth/register (public) and /users/*, /settings (protected)
app.use('/api', tripsRouter);
app.use('/api', activitiesRouter);
app.use('/api', invitesRouter);
app.use('/api', messagesRouter);
app.use('/api', paymentsRouter);
app.use('/api', friendsRouter);
app.use('/api', notificationsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = setupSocketIO(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export { app, server, io };
