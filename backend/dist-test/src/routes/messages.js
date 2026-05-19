"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const message_service_1 = require("@/services/message.service");
const validations_1 = require("@/lib/validations");
const trip_service_1 = require("@/services/trip.service");
const prisma_1 = __importDefault(require("@/lib/prisma"));
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /api/trips/:tripId/messages - Get trip messages
router.get('/trips/:tripId/messages', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const limit = req.query.limit ? Number(req.query.limit) : 30;
        const before = req.query.before ? new Date(req.query.before) : undefined;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const messages = await message_service_1.messageService.getTripMessages(tripId, limit, before);
        res.json({ data: messages });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:tripId/messages - Send trip message
router.post('/trips/:tripId/messages', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.createMessageSchema.parse(req.body);
        const message = await message_service_1.messageService.createTripMessage(tripId, userId, validatedData.content, validatedData.messageType, validatedData.mentions, validatedData.replyToId);
        res.status(201).json({ data: message });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// GET /api/dm/conversations - List DM conversations
router.get('/dm/conversations', async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversations = await prisma_1.default.dmConversation.findMany({
            where: {
                OR: [
                    { participant1: userId },
                    { participant2: userId },
                ],
            },
            include: {
                participants: true,
                messages: {
                    take: 1,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { lastMessageAt: 'desc' },
        });
        res.json({ data: conversations });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/dm/conversations - Start DM conversation
router.post('/dm/conversations', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { participantId } = req.body;
        if (!participantId) {
            res.status(400).json({ error: 'participantId is required' });
            return;
        }
        if (participantId === userId) {
            res.status(400).json({ error: 'Cannot start conversation with yourself' });
            return;
        }
        // Find or create conversation (ensure consistent ordering)
        const [participant1, participant2] = [userId, participantId].sort();
        let conversation = await prisma_1.default.dmConversation.findUnique({
            where: {
                participant1_participant2: {
                    participant1,
                    participant2,
                },
            },
        });
        if (!conversation) {
            conversation = await prisma_1.default.dmConversation.create({
                data: {
                    participant1,
                    participant2,
                    participants: {
                        connect: [
                            { id: participant1 },
                            { id: participant2 },
                        ],
                    },
                },
                include: {
                    participants: {
                        select: {
                            id: true,
                            name: true,
                            avatarUrl: true,
                        },
                    },
                },
            });
        }
        res.json({ data: conversation });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/dm/conversations/:id - Get DM messages
router.get('/dm/conversations/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;
        const limit = req.query.limit ? Number(req.query.limit) : 30;
        const before = req.query.before ? new Date(req.query.before) : undefined;
        // Verify user is participant
        const conversation = await prisma_1.default.dmConversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation ||
            (conversation.participant1 !== userId && conversation.participant2 !== userId)) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const messages = await message_service_1.messageService.getDmMessages(conversationId, limit, before);
        res.json({ data: messages });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/dm/conversations/:id/messages - Send DM message
router.post('/dm/conversations/:id/messages', async (req, res) => {
    try {
        const userId = req.user.userId;
        const conversationId = req.params.id;
        // Verify user is participant
        const conversation = await prisma_1.default.dmConversation.findUnique({
            where: { id: conversationId },
        });
        if (!conversation ||
            (conversation.participant1 !== userId && conversation.participant2 !== userId)) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.createMessageSchema.parse(req.body);
        const message = await message_service_1.messageService.createDmMessage(conversationId, userId, validatedData.content, validatedData.messageType, validatedData.mentions, validatedData.replyToId);
        res.status(201).json({ data: message });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/messages/:id - Edit message
router.patch('/messages/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.senderId !== userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.createMessageSchema.partial().parse(req.body);
        const updated = await message_service_1.messageService.updateMessage(messageId, validatedData);
        res.json({ data: updated });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/messages/:id - Delete message
router.delete('/messages/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        const message = await prisma_1.default.message.findUnique({
            where: { id: messageId },
        });
        if (!message || message.senderId !== userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await message_service_1.messageService.deleteMessage(messageId);
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/messages/:id/reactions - Add/remove reaction
router.post('/messages/:id/reactions', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        const { emoji, action } = req.body;
        if (!emoji) {
            res.status(400).json({ error: 'emoji is required' });
            return;
        }
        if (action === 'remove') {
            await message_service_1.messageService.removeReaction(messageId, userId, emoji);
        }
        else {
            await message_service_1.messageService.addReaction(messageId, userId, emoji);
        }
        res.json({ message: 'Reaction updated successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/messages/:id/read - Mark message as read
router.post('/messages/:id/read', async (req, res) => {
    try {
        const userId = req.user.userId;
        const messageId = req.params.id;
        await message_service_1.messageService.markAsRead(messageId, userId);
        res.json({ message: 'Message marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=messages.js.map