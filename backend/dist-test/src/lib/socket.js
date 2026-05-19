"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocketIO = getSocketIO;
exports.getConnectionManager = getConnectionManager;
exports.setupSocketIO = setupSocketIO;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = require("@/middleware/auth");
const logger_1 = require("./logger");
// Connection manager: userId → socket
const connectionManager = new Map();
// Module-level io instance for cross-service access
let ioInstance = null;
function getSocketIO() {
    return ioInstance;
}
function extractBearerToken(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer '))
        return null;
    return authHeader.slice(7);
}
function extractCookieToken(cookieHeader) {
    if (!cookieHeader)
        return null;
    const match = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
    return match ? match[1] : null;
}
function getConnectionManager() {
    return connectionManager;
}
function setupSocketIO(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
    });
    // Authentication middleware — checks multiple token sources
    io.use((socket, next) => {
        let token = null;
        // 1. socket.handshake.auth.token (existing)
        token = socket.handshake.auth.token;
        // 2. Authorization header → Bearer token
        if (!token) {
            token = extractBearerToken(socket.handshake.headers.authorization);
        }
        // 3. Cookie header → extract token
        if (!token) {
            token = extractCookieToken(socket.handshake.headers.cookie);
        }
        if (!token) {
            return next(new Error('Authentication required'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, auth_1.JWT_SECRET);
            socket.data.userId = decoded.userId;
            socket.data.email = decoded.email;
            next();
        }
        catch (error) {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        // Register connection in manager
        connectionManager.set(userId, socket);
        // Auto-join user-specific room for push notifications
        socket.join(`user:${userId}`);
        logger_1.logger.trace(`User connected: ${userId}`);
        // Join trip room
        socket.on('join-trip', (tripId) => {
            socket.join(`trip:${tripId}`);
            logger_1.logger.trace(`User ${userId} joined trip ${tripId}`);
        });
        // Leave trip room
        socket.on('leave-trip', (tripId) => {
            socket.leave(`trip:${tripId}`);
            logger_1.logger.trace(`User ${userId} left trip ${tripId}`);
        });
        // Send message to trip
        socket.on('send-message', (data) => {
            socket.to(`trip:${data.tripId}`).emit('new-message', {
                tripId: data.tripId,
                senderId: userId,
                content: data.content,
                messageType: data.messageType || 'TEXT',
                createdAt: new Date().toISOString(),
            });
        });
        // Typing indicator
        socket.on('typing', (data) => {
            socket.to(`trip:${data.tripId}`).emit('user-typing', {
                tripId: data.tripId,
                userId,
            });
        });
        socket.on('stop-typing', (data) => {
            socket.to(`trip:${data.tripId}`).emit('user-stop-typing', {
                tripId: data.tripId,
                userId,
            });
        });
        // Join DM conversation
        socket.on('join-dm', (conversationId) => {
            socket.join(`dm:${conversationId}`);
            logger_1.logger.trace(`User ${userId} joined DM ${conversationId}`);
        });
        // Send DM
        socket.on('send-dm', (data) => {
            socket.to(`dm:${data.conversationId}`).emit('new-dm', {
                conversationId: data.conversationId,
                senderId: userId,
                content: data.content,
                createdAt: new Date().toISOString(),
            });
        });
        // Vote updates
        socket.on('vote-cast', (data) => {
            socket.to(`trip:${data.tripId}`).emit('vote-updated', {
                activityId: data.activityId,
            });
        });
        // Payment updates
        socket.on('payment-updated', (data) => {
            socket.to(`trip:${data.tripId}`).emit('payment-status-changed', {
                billSplitId: data.billSplitId,
            });
        });
        // Disconnect
        socket.on('disconnect', () => {
            connectionManager.delete(userId);
            logger_1.logger.trace(`User disconnected: ${userId}`);
        });
    });
    ioInstance = io;
    return io;
}
//# sourceMappingURL=socket.js.map