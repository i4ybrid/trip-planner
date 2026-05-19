"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
const prisma_1 = require("@/lib/prisma");
const client_1 = require("@prisma/client");
const socket_1 = require("@/lib/socket");
const push_service_1 = require("./push.service");
const pendingTripChat = new Map(); // key: `${userId}:${tripId}`
class NotificationService {
    prisma = (0, prisma_1.getPrisma)();
    async shouldNotify(userId, category) {
        try {
            const preference = await this.prisma.notificationPreference.findUnique({
                where: { userId_category: { userId, category } },
            });
            // If no preference set, default to true (notify)
            if (!preference)
                return true;
            return preference.inApp;
        }
        catch {
            // If table doesn't exist or query fails, default to true (fail open — better to notify than miss)
            return true;
        }
    }
    async createNotification(data) {
        if (!(await this.shouldNotify(data.userId, data.category))) {
            return null;
        }
        const notification = await this.prisma.notification.create({
            data: {
                userId: data.userId,
                category: data.category,
                title: data.title,
                body: data.body,
                referenceId: data.referenceId,
                referenceType: data.referenceType,
                link: data.link,
                isRead: false,
            },
        });
        // WebSocket Phase 2: push notification to connected user
        const manager = (0, socket_1.getConnectionManager)();
        const userSocket = manager.get(data.userId);
        if (userSocket) {
            userSocket.to(`user:${data.userId}`).emit('notification:new', notification);
        }
        // WebPush: send browser push notification if preference is enabled
        const pref = await this.prisma.notificationPreference.findUnique({
            where: { userId_category: { userId: data.userId, category: data.category } },
        });
        if (pref?.push) {
            await push_service_1.pushService.sendPush(data.userId, {
                title: notification.title,
                body: notification.body,
                data: { notificationId: notification.id, category: notification.category },
            });
        }
        return notification;
    }
    async createTripNotification(tripId, category, title, body, excludeUserId, referenceId, referenceType) {
        const members = await this.prisma.tripMember.findMany({
            where: { tripId },
            select: { userId: true },
        });
        const notifications = [];
        for (const member of members) {
            if (member.userId === excludeUserId)
                continue;
            if (!(await this.shouldNotify(member.userId, category)))
                continue;
            notifications.push({
                userId: member.userId,
                category,
                title,
                body,
                referenceId: referenceId || tripId,
                referenceType: referenceType || client_1.NotificationReferenceType.TRIP,
                link: `/trip/${tripId}`,
                isRead: false,
            });
        }
        if (notifications.length === 0)
            return 0;
        const result = await this.prisma.notification.createMany({ data: notifications });
        return result.count;
    }
    async createFriendNotification(userId, _friendId, category, referenceId) {
        return this.createNotification({
            userId,
            category,
            title: 'Friend Request',
            body: 'You have a new friend request',
            referenceId,
            referenceType: client_1.NotificationReferenceType.FRIEND_REQUEST,
            link: '/friends',
        });
    }
    async createChatMentionNotification(userId, messageId, tripId, referenceType = client_1.NotificationReferenceType.MESSAGE) {
        return this.createNotification({
            userId,
            category: client_1.NotificationCategory.CHAT,
            title: 'You were mentioned',
            body: 'Someone mentioned you in a chat',
            referenceId: messageId,
            referenceType,
            link: tripId ? `/trip/${tripId}/chat` : '/messages',
        });
    }
    // Batch trip chat notification: adds to pending batch, flushes after 5 min or >5 messages
    async createTripChatNotification(tripId, excludeUserId, messageId) {
        const members = await this.prisma.tripMember.findMany({
            where: { tripId, status: 'CONFIRMED' },
            select: { userId: true },
        });
        for (const member of members) {
            if (member.userId === excludeUserId)
                continue;
            if (!(await this.shouldNotify(member.userId, client_1.NotificationCategory.CHAT)))
                continue;
            const key = member.userId + ':' + tripId;
            const existing = pendingTripChat.get(key);
            if (existing) {
                existing.messageIds.push(messageId);
                existing.messageCount++;
                if (existing.timer)
                    clearTimeout(existing.timer);
                existing.timer = setTimeout(() => this.flushTripChatBatch(key), 5 * 60 * 1000);
                if (existing.messageCount > 5) {
                    await this.flushTripChatBatch(key);
                }
            }
            else {
                const timer = setTimeout(() => this.flushTripChatBatch(key), 5 * 60 * 1000);
                pendingTripChat.set(key, {
                    tripId,
                    messageIds: [messageId],
                    messageCount: 1,
                    firstMessageAt: new Date(),
                    timer,
                });
            }
        }
    }
    async flushTripChatBatch(key) {
        const batch = pendingTripChat.get(key);
        if (!batch)
            return;
        pendingTripChat.delete(key);
        if (batch.timer)
            clearTimeout(batch.timer);
        if (batch.messageCount === 0)
            return;
        const userId = key.split(':')[0];
        const trip = await this.prisma.trip.findUnique({
            where: { id: batch.tripId },
            select: { name: true },
        });
        if (batch.messageCount === 1) {
            const message = await this.prisma.message.findUnique({
                where: { id: batch.messageIds[0] },
                select: { sender: { select: { name: true } }, content: true },
            });
            await this.createNotification({
                userId,
                category: client_1.NotificationCategory.CHAT,
                title: 'New message in ' + (trip?.name || 'trip'),
                body: (message?.sender?.name || 'Someone') + ': ' + (message?.content || '').substring(0, 50),
                referenceId: batch.tripId,
                referenceType: client_1.NotificationReferenceType.MESSAGE,
                link: '/trip/' + batch.tripId + '/chat',
            });
        }
        else {
            await this.createNotification({
                userId,
                category: client_1.NotificationCategory.CHAT,
                title: batch.messageCount + ' new messages in ' + (trip?.name || 'trip'),
                body: 'You have ' + batch.messageCount + ' unread messages in the trip chat',
                referenceId: batch.tripId,
                referenceType: client_1.NotificationReferenceType.MESSAGE,
                link: '/trip/' + batch.tripId + '/chat',
            });
        }
    }
    async getNotifications(userId, options) {
        const { cursor, limit = 10, category } = options || {};
        const where = { userId };
        if (category)
            where.category = category;
        const [notifications, unreadCount] = await Promise.all([
            this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: cursor ? 1 : 0,
                cursor: cursor ? { id: cursor } : undefined,
            }),
            this.prisma.notification.count({ where: { userId, isRead: false } }),
        ]);
        const nextCursor = notifications.length > 0 ? notifications[notifications.length - 1].id : null;
        return { notifications, nextCursor, unreadCount };
    }
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: { userId, isRead: false },
        });
    }
    async getNotification(id, userId) {
        return this.prisma.notification.findFirst({
            where: { id, userId },
        });
    }
    async markAsRead(id, userId) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { isRead: true },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
    async markAsReadByReference(referenceType, referenceId, userId) {
        return this.prisma.notification.updateMany({
            where: { userId, referenceType, referenceId, isRead: false },
            data: { isRead: true },
        });
    }
    async deleteNotification(id, userId) {
        return this.prisma.notification.deleteMany({
            where: { id, userId },
        });
    }
    async deleteOldNotifications(userId, beforeDate) {
        return this.prisma.notification.deleteMany({
            where: { userId, createdAt: { lt: beforeDate } },
        });
    }
    // --- Preferences ---
    async getPreferences(userId) {
        return this.prisma.notificationPreference.findMany({
            where: { userId },
        });
    }
    async upsertPreference(userId, category, data) {
        return this.prisma.notificationPreference.upsert({
            where: { userId_category: { userId, category } },
            update: data,
            create: {
                userId,
                category,
                inApp: data.inApp ?? true,
                email: data.email ?? false,
                push: data.push ?? false,
            },
        });
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
//# sourceMappingURL=notification.service.js.map