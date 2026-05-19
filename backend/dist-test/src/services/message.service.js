"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageService = exports.MessageService = void 0;
const prisma_1 = require("@/lib/prisma");
const notification_service_1 = require("@/services/notification.service");
const client_1 = require("@prisma/client");
const socket_1 = require("@/lib/socket");
class MessageService {
    prisma = (0, prisma_1.getPrisma)();
    async createTripMessage(tripId, senderId, content, messageType = 'TEXT', mentions = [], replyToId) {
        const message = await this.prisma.message.create({
            data: { tripId, senderId, content, messageType: messageType, mentions, replyToId },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true } },
                replyTo: { select: { id: true, content: true, sender: { select: { id: true, name: true } } } },
            },
        });
        // Get trip members for notifications
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                members: {
                    where: { status: 'CONFIRMED', userId: { not: senderId } },
                    select: { userId: true },
                },
            },
        });
        // Notify mentioned users
        if (mentions && mentions.length > 0) {
            const sender = message.sender;
            for (const mentionedUserId of mentions) {
                if (mentionedUserId !== senderId) {
                    await notification_service_1.notificationService.createNotification({
                        userId: mentionedUserId,
                        category: client_1.NotificationCategory.CHAT,
                        title: 'You were mentioned',
                        body: '@' + sender.name + ' mentioned you in "' + (trip?.name || 'a trip') + '"',
                        referenceId: tripId,
                        referenceType: client_1.NotificationReferenceType.MESSAGE,
                        link: '/trip/' + tripId + '/chat',
                    });
                }
            }
        }
        // Send trip chat notification (non-mention) to all other members
        // The notificationService batches these internally if multiple messages come in
        if (trip) {
            const otherMemberIds = trip.members.map(m => m.userId);
            for (const memberId of otherMemberIds) {
                if (!mentions?.includes(memberId)) {
                    await notification_service_1.notificationService.createTripChatNotification(tripId, memberId, message.id);
                }
            }
        }
        // WebSocket Phase 2: push new message to trip room
        const msgManager = (0, socket_1.getConnectionManager)();
        const senderSocket = msgManager.get(senderId);
        if (senderSocket) {
            senderSocket.to(`trip:${tripId}`).emit('message:new', message);
        }
        return message;
    }
    async createDmMessage(conversationId, senderId, content, messageType = 'TEXT', mentions = [], replyToId) {
        const message = await this.prisma.message.create({
            data: { conversationId, senderId, content, messageType: messageType, mentions, replyToId },
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        });
        await this.prisma.dmConversation.update({
            where: { id: conversationId },
            data: { lastMessageAt: new Date() },
        });
        // Get conversation participants
        const conversation = await this.prisma.dmConversation.findUnique({
            where: { id: conversationId },
            include: { participants: { select: { id: true, name: true } } },
        });
        // Notify other participant about new DM
        if (conversation) {
            for (const participant of conversation.participants) {
                if (participant.id !== senderId && !mentions?.includes(participant.id)) {
                    await notification_service_1.notificationService.createNotification({
                        userId: participant.id,
                        category: client_1.NotificationCategory.CHAT,
                        title: 'New Direct Message',
                        body: '@' + message.sender.name + ': ' + content.substring(0, 50) + (content.length > 50 ? '...' : ''),
                        referenceId: conversationId,
                        referenceType: client_1.NotificationReferenceType.MESSAGE,
                        link: '/messages/' + conversationId,
                    });
                }
            }
        }
        // Notify mentioned users
        if (mentions && mentions.length > 0) {
            const sender = message.sender;
            if (conversation) {
                for (const participant of conversation.participants) {
                    if (mentions.includes(participant.id) && participant.id !== senderId) {
                        await notification_service_1.notificationService.createNotification({
                            userId: participant.id,
                            category: client_1.NotificationCategory.CHAT,
                            title: 'You were mentioned',
                            body: '@' + sender.name + ' mentioned you in a DM',
                            referenceId: conversationId,
                            referenceType: client_1.NotificationReferenceType.MESSAGE,
                            link: '/messages/' + conversationId,
                        });
                    }
                }
            }
        }
        // WebSocket Phase 2: push new DM to recipient's user room
        if (conversation) {
            for (const participant of conversation.participants) {
                if (participant.id !== senderId) {
                    const dmManager = (0, socket_1.getConnectionManager)();
                    const participantSocket = dmManager.get(participant.id);
                    if (participantSocket) {
                        participantSocket.to(`user:${participant.id}`).emit('dm:new', message);
                    }
                }
            }
        }
        return message;
    }
    async getTripMessages(tripId, limit = 30, before) {
        return this.prisma.message.findMany({
            where: { tripId, deletedAt: null, createdAt: before ? { lt: before } : undefined },
            include: {
                sender: { select: { id: true, name: true, avatarUrl: true } },
                replies: { take: 3, include: { sender: { select: { id: true, name: true } } } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getDmMessages(conversationId, limit = 30, before) {
        return this.prisma.message.findMany({
            where: { conversationId, deletedAt: null, createdAt: before ? { lt: before } : undefined },
            include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async updateMessage(messageId, data) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { ...data, editedAt: data.content ? new Date() : undefined },
        });
    }
    async deleteMessage(messageId) {
        return this.prisma.message.update({
            where: { id: messageId },
            data: { deletedAt: new Date(), content: '[Message deleted]' },
        });
    }
    async addReaction(messageId, userId, emoji) {
        const message = await this.prisma.message.findUnique({
            where: { id: messageId },
            select: { reactions: true, senderId: true, tripId: true, conversationId: true },
        });
        if (!message) {
            throw new Error('Message not found');
        }
        const reactions = message.reactions || {};
        if (!reactions[emoji])
            reactions[emoji] = [];
        if (!reactions[emoji].includes(userId)) {
            reactions[emoji].push(userId);
            if (message.senderId !== userId) {
                const trip = message.tripId
                    ? await this.prisma.trip.findUnique({ where: { id: message.tripId }, select: { name: true } })
                    : null;
                await notification_service_1.notificationService.createNotification({
                    userId: message.senderId,
                    category: client_1.NotificationCategory.CHAT,
                    title: 'Reaction on your message',
                    body: emoji + ' reaction on your message in "' + (trip?.name || 'chat') + '"',
                    referenceId: message.tripId || message.conversationId || messageId,
                    referenceType: client_1.NotificationReferenceType.MESSAGE,
                    link: message.tripId ? '/trip/' + message.tripId + '/chat' : '/messages/' + message.conversationId,
                });
            }
        }
        return this.prisma.message.update({
            where: { id: messageId },
            data: { reactions: reactions },
        });
    }
    async removeReaction(messageId, userId, emoji) {
        const message = await this.prisma.message.findUnique({ where: { id: messageId }, select: { reactions: true } });
        if (!message) {
            throw new Error('Message not found');
        }
        const reactions = message.reactions || {};
        if (reactions[emoji]) {
            reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
            if (reactions[emoji].length === 0)
                delete reactions[emoji];
        }
        return this.prisma.message.update({ where: { id: messageId }, data: { reactions: reactions } });
    }
    async markAsRead(messageId, userId) {
        return this.prisma.messageReadReceipt.upsert({
            where: { messageId_userId: { messageId, userId } },
            update: { readAt: new Date() },
            create: { messageId, userId, readAt: new Date() },
        });
    }
}
exports.MessageService = MessageService;
exports.messageService = new MessageService();
//# sourceMappingURL=message.service.js.map