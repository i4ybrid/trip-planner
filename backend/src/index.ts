import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

import { setupSocketIO } from './lib/socket';
import { storageConfig } from './lib/storage';
import { logger, registerGlobalErrorHandlers, writeCrashLog } from './lib/logger';
import usersRouter from './routes/users';
import tripsRouter from './routes/trips';
import tripInvitesRouter from './routes/trip-invites';
import activitiesRouter from './routes/activities';
import invitesRouter from './routes/invites';
import messagesRouter from './routes/messages';
import paymentsRouter from './routes/payments';
import friendsRouter from './routes/friends';
import notificationsRouter from './routes/notifications';
import blockedRouter from './routes/blocked';
import inviteCodesRouter from './routes/invite-codes';
import emailInviteRouter from './routes/email-invite';
import milestonesRouter from './routes/milestones';
import settlementRouter from './routes/settlement';
import pushRoutes from './routes/push.routes';

// Load environment variables
dotenv.config();

// Register global crash handlers first — before anything else can go wrong
registerGlobalErrorHandlers();

const app = express();
app.set('trust proxy', 1); // Trust X-Forwarded-For from nginx/Cloudflare
app.set('strict routing', true); // Treat /trips and /trips/ as different routes
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.FRONTEND_URL || "http://localhost:16199"],
    },
  },
}));

// CORS configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:16199').split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const hostname = new URL(origin).hostname;
    const baseDomain = hostname.split('.').slice(-2).join('.');
    
    const isAllowed = allowedOrigins.some(allowed => {
      const allowedHostname = new URL(allowed).hostname;
      const allowedBaseDomain = allowedHostname.split('.').slice(-2).join('.');
      return hostname === allowedHostname || hostname.endsWith('.' + allowedBaseDomain);
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '', 10) || (process.env.NODE_ENV === 'development' ? 1000 : 100), // Allow env override
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (only for local storage)
if (!storageConfig.isRemote) {
  logger.debug('[server] Serving static files from:', storageConfig.uploadDir);
  logger.debug('[server] Static files available at: http://localhost:' + PORT + '/uploads');

  // Add CORS headers for uploaded files and disable restrictive headers
  app.use('/uploads', (_req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:16199');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  });

  app.use('/uploads', express.static(storageConfig.uploadDir));
}

// Health check endpoints
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// API routes - auth routes must be first (public)
app.use('/api', usersRouter); // Contains /auth/login, /auth/register (public) and /users/*, /settings (protected)
app.use('/api', tripsRouter);
app.use('/api', tripInvitesRouter);
app.use('/api', activitiesRouter);
app.use('/api', invitesRouter);
app.use('/api', messagesRouter);
app.use('/api', paymentsRouter);
app.use('/api', friendsRouter);
app.use('/api', notificationsRouter);
app.use('/api', blockedRouter);
app.use('/api', inviteCodesRouter);
app.use('/api', emailInviteRouter);
app.use('/api', milestonesRouter);
app.use('/api', settlementRouter);
app.use('/api', pushRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Error:', err);
  writeCrashLog('ERROR', `Express handler error: ${err.message}`, err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Create HTTP server
const server = createServer(app);

// Setup Socket.IO
const io = setupSocketIO(server);

// Start notification scheduler cron jobs
import { startNotificationScheduler } from './jobs/notificationScheduler';
startNotificationScheduler();

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

export { app, server, io };
;
