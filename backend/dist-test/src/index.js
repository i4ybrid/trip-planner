"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./lib/socket");
const storage_1 = require("./lib/storage");
const logger_1 = require("./lib/logger");
const users_1 = __importDefault(require("./routes/users"));
const trips_1 = __importDefault(require("./routes/trips"));
const trip_invites_1 = __importDefault(require("./routes/trip-invites"));
const activities_1 = __importDefault(require("./routes/activities"));
const invites_1 = __importDefault(require("./routes/invites"));
const messages_1 = __importDefault(require("./routes/messages"));
const payments_1 = __importDefault(require("./routes/payments"));
const friends_1 = __importDefault(require("./routes/friends"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const blocked_1 = __importDefault(require("./routes/blocked"));
const invite_codes_1 = __importDefault(require("./routes/invite-codes"));
const email_invite_1 = __importDefault(require("./routes/email-invite"));
const milestones_1 = __importDefault(require("./routes/milestones"));
const settlement_1 = __importDefault(require("./routes/settlement"));
const push_routes_1 = __importDefault(require("./routes/push.routes"));
const public_events_1 = __importDefault(require("./routes/public-events"));
const expenses_1 = __importDefault(require("./routes/expenses"));
const heroImages_1 = __importDefault(require("./routes/heroImages"));
// Load environment variables
dotenv_1.default.config();
// Register global crash handlers first — before anything else can go wrong
(0, logger_1.registerGlobalErrorHandlers)();
const app = (0, express_1.default)();
exports.app = app;
app.set('strict routing', true); // Treat /trips and /trips/ as different routes
const PORT = process.env.PORT || 4000;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "http://localhost:3000", "https://localhost:3000"],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);
// Body parsing middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files (only for local storage)
if (!storage_1.storageConfig.isRemote) {
    logger_1.logger.debug('[server] Serving static files from:', storage_1.storageConfig.uploadDir);
    logger_1.logger.debug('[server] Static files available at: http://localhost:' + PORT + '/uploads');
    // Add CORS headers for uploaded files and disable restrictive headers
    app.use('/uploads', (_req, res, next) => {
        res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    });
    app.use('/uploads', express_1.default.static(storage_1.storageConfig.uploadDir));
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
app.use('/api', users_1.default); // Contains /auth/login, /auth/register (public) and /users/*, /settings (protected)
app.use('/api', trips_1.default);
app.use('/api', trip_invites_1.default);
app.use('/api', activities_1.default);
app.use('/api', invites_1.default);
app.use('/api', messages_1.default);
app.use('/api', payments_1.default);
app.use('/api', friends_1.default);
app.use('/api', notifications_1.default);
app.use('/api', blocked_1.default);
app.use('/api', invite_codes_1.default);
app.use('/api', email_invite_1.default);
app.use('/api', milestones_1.default);
app.use('/api', settlement_1.default);
app.use('/api', push_routes_1.default);
app.use('/api', public_events_1.default);
app.use('/api', expenses_1.default);
app.use('/api', heroImages_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
});
// Error handler
app.use((err, _req, res, _next) => {
    logger_1.logger.error('Error:', err);
    (0, logger_1.writeCrashLog)('ERROR', `Express handler error: ${err.message}`, err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// Create HTTP server
const server = (0, http_1.createServer)(app);
exports.server = server;
// Setup Socket.IO
const io = (0, socket_1.setupSocketIO)(server);
exports.io = io;
// Start notification scheduler cron jobs
const notificationScheduler_1 = require("./jobs/notificationScheduler");
(0, notificationScheduler_1.startNotificationScheduler)();
// Start server
server.listen(PORT, () => {
    logger_1.logger.info(`🚀 Server running on port ${PORT}`);
    logger_1.logger.info(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger_1.logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});
//# sourceMappingURL=index.js.map