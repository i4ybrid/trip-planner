"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const notification_service_1 = require("../services/notification.service");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// GET /api/notifications — List notifications
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.userId;
        const cursor = req.query.cursor;
        const limit = req.query.limit ? Number(req.query.limit) : 10;
        const category = req.query.category;
        const { notifications, nextCursor, unreadCount } = await notification_service_1.notificationService.getNotifications(userId, {
            cursor,
            limit,
            category,
        });
        const hasMore = notifications.length === limit && nextCursor !== null;
        res.json({ data: { notifications, nextCursor, hasMore }, unreadCount });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/notifications/unread-count — Get unread count
router.get('/notifications/unread-count', async (req, res) => {
    try {
        const userId = req.user.userId;
        const count = await notification_service_1.notificationService.getUnreadCount(userId);
        res.json({ data: { count } });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/notifications/:id/read — Mark single as read
router.patch('/notifications/:id/read', async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;
        await notification_service_1.notificationService.markAsRead(notificationId, userId);
        res.json({ message: 'Notification marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/notifications/read-all — Mark all as read
router.patch('/notifications/read-all', async (req, res) => {
    try {
        const userId = req.user.userId;
        await notification_service_1.notificationService.markAllAsRead(userId);
        res.json({ message: 'All notifications marked as read' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/notifications/:id — Delete a notification
router.delete('/notifications/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const notificationId = req.params.id;
        await notification_service_1.notificationService.deleteNotification(notificationId, userId);
        res.json({ message: 'Notification deleted' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/notifications/preferences — Get user preferences
router.get('/notifications/preferences', async (req, res) => {
    try {
        const userId = req.user.userId;
        const preferences = await notification_service_1.notificationService.getPreferences(userId);
        res.json({ data: preferences });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/notifications/preferences — Update preferences
router.patch('/notifications/preferences', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { category, inApp, email, push } = req.body;
        if (!category) {
            res.status(400).json({ error: 'category is required' });
            return;
        }
        const validCategories = ['MILESTONE', 'INVITE', 'FRIEND', 'PAYMENT', 'SETTLEMENT', 'CHAT', 'MEMBER'];
        if (!validCategories.includes(category)) {
            res.status(400).json({ error: 'Invalid category' });
            return;
        }
        const preference = await notification_service_1.notificationService.upsertPreference(userId, category, {
            inApp,
            email,
            push,
        });
        res.json({ data: preference });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map