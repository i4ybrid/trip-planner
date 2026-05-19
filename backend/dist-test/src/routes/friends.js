"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const friend_service_1 = require("@/services/friend.service");
const prisma_1 = __importDefault(require("@/lib/prisma"));
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get('/friends', async (req, res) => {
    try {
        const userId = req.user.userId;
        const friends = await friend_service_1.friendService.getFriends(userId);
        res.json({ data: friends });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/friends/search', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            res.status(400).json({ error: 'email query parameter is required' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase() },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
            },
        });
        if (!user) {
            res.json({ data: { found: false } });
            return;
        }
        if (user.id === userId) {
            res.json({ data: { found: true, user, relationship: 'self' } });
            return;
        }
        const relationship = await friend_service_1.friendService.getRelationship(userId, user.id);
        res.json({ data: { found: true, user, relationship } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/friends', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { receiverId } = req.body;
        if (!receiverId) {
            res.status(400).json({ error: 'receiverId is required' });
            return;
        }
        if (receiverId === userId) {
            res.status(400).json({ error: 'Cannot send friend request to yourself' });
            return;
        }
        const request = await friend_service_1.friendService.sendFriendRequest(userId, receiverId);
        res.status(201).json({ data: request });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.delete('/friends/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const friendId = req.params.id;
        await friend_service_1.friendService.removeFriend(userId, friendId);
        res.json({ message: 'Friend removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/friend-requests - List friend requests
router.get('/friend-requests', async (req, res) => {
    try {
        const userId = req.user.userId;
        const requests = await friend_service_1.friendService.getFriendRequests(userId);
        res.json({ data: requests });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/friend-requests - Send friend request
router.post('/friend-requests', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { receiverId } = req.body;
        if (!receiverId) {
            res.status(400).json({ error: 'receiverId is required' });
            return;
        }
        const request = await friend_service_1.friendService.sendFriendRequest(userId, receiverId);
        res.status(201).json({ data: request });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// PATCH /api/friend-requests/:id - Accept/decline friend request
router.patch('/friend-requests/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const requestId = req.params.id;
        const { action } = req.body;
        if (!action || !['accept', 'decline'].includes(action)) {
            res.status(400).json({ error: 'action must be "accept" or "decline"' });
            return;
        }
        // Verify user is the receiver
        const request = await friend_service_1.friendService.getFriendRequests(userId);
        const isReceiver = request.received.some((r) => r.id === requestId);
        if (!isReceiver) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        if (action === 'accept') {
            const result = await friend_service_1.friendService.acceptFriendRequest(requestId);
            res.json({ data: result });
        }
        else {
            const result = await friend_service_1.friendService.declineFriendRequest(requestId);
            res.json({ data: result });
        }
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// DELETE /api/friend-requests/:id - Cancel friend request
router.delete('/friend-requests/:id', async (req, res) => {
    try {
        const requestId = req.params.id;
        await friend_service_1.friendService.cancelFriendRequest(requestId);
        res.json({ message: 'Friend request cancelled' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=friends.js.map