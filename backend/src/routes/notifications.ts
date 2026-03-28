import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notification.service';
import { NotificationCategory } from '@prisma/client';

const router = Router();
router.use(authMiddleware);

// GET /api/notifications — List notifications
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const category = req.query.category as NotificationCategory | undefined;

    const { notifications, unreadCount } = await notificationService.getNotifications(userId, {
      limit,
      offset,
      category,
    });

    res.json({ data: { notifications, unreadCount } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/unread-count — Get unread count
router.get('/notifications/unread-count', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.getUnreadCount(userId);
    res.json({ data: { count } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/:id/read — Mark single as read
router.patch('/notifications/:id/read', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    await notificationService.markAsRead(notificationId, userId);
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/read-all — Mark all as read
router.patch('/notifications/read-all', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    await notificationService.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id — Delete a notification
router.delete('/notifications/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;

    await notificationService.deleteNotification(notificationId, userId);
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/preferences — Get user preferences
router.get('/notifications/preferences', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const preferences = await notificationService.getPreferences(userId);
    res.json({ data: preferences });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/preferences — Update preferences
router.patch('/notifications/preferences', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
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

    const preference = await notificationService.upsertPreference(userId, category as NotificationCategory, {
      inApp,
      email,
      push,
    });

    res.json({ data: preference });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
