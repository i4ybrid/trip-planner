import { Router } from 'express';
import { MessageService } from '../services/message.service';
import { NotificationService } from '../services/notification.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { createMessageSchema, editMessageSchema } from '../lib/validation-schemas';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const messageService = new MessageService(prisma);
const notificationService = new NotificationService(prisma);

// Get messages for a trip
router.get('/', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const limit = parseInt(req.query.limit as string) || 50;
  const beforeId = req.query.beforeId as string;
  
  const messages = await messageService.getTripMessages(tripId, limit, beforeId);
  res.json(messages);
}));

// Send message
router.post('/', validate(createMessageSchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, messageType } = req.body;
  const result = await messageService.createMessage({
    tripId,
    userId,
    content,
    messageType,
  });

  // Send notifications for mentions
  if (result.mentions.length > 0) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    const mentionedUserIds = result.mentions
      .filter(m => m.type === 'user')
      .map(m => m.id);
    
    if (mentionedUserIds.length > 0) {
      await notificationService.notifyMessageMentioned(
        tripId,
        content,
        user?.name || 'Someone',
        mentionedUserIds
      );
    }

    const hasEveryone = result.mentions.some(m => m.type === 'everyone');
    if (hasEveryone) {
      await notificationService.notifyEveryone(
        tripId,
        `${user?.name} mentioned everyone`,
        content,
        userId
      );
    }
  }

  res.status(201).json(result);
}));

// Edit message
router.patch('/:id', validate(editMessageSchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content } = req.body;
  const message = await messageService.editMessage(req.params.id, userId, content);
  res.json(message);
}));

// Delete message
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await messageService.deleteMessage(req.params.id, userId);
  res.status(204).send();
}));

// Mark all messages in trip as read
router.post('/read-all', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = await messageService.markAllAsRead(tripId, userId);
  res.json({ markedAsRead: count });
}));

// Get unread count for a trip
router.get('/unread', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const count = await messageService.getUnreadCount(tripId, userId);
  res.json({ unreadCount: count });
}));

// Get mentionable users for a trip
router.get('/mentions', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const users = await messageService.getMentionedUsers(tripId);
  res.json(users);
}));

export default router;

