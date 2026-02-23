import { Router } from 'express';
import { NotificationService } from '../services/notification.service';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();
const prisma = new PrismaClient();
const notificationService = new NotificationService(prisma);

// Get current user's notifications
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limit = parseInt(req.query.limit as string) || 20;
  const notifications = await notificationService.getUserNotifications(userId, limit);
  res.json(notifications);
}));

// Get unread count
router.get('/unread-count', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = await notificationService.getUnreadCount(userId);
  res.json({ count });
}));

// Mark notification as read
router.post('/:id/read', asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id);
  res.json(notification);
}));

// Mark all as read
router.post('/read-all', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await notificationService.markAllAsRead(userId);
  res.status(204).send();
}));

// Delete notification
router.delete('/:id', asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.params.id);
  res.status(204).send();
}));

export default router;

