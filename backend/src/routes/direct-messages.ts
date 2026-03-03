import { Router } from 'express';
import { MessageService } from '../services/message.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { createMessageSchema } from '../lib/validation-schemas';

const router = Router();
const prisma = new PrismaClient();
const messageService = new MessageService(prisma);

// Get direct messages with another user
router.get('/:userId', asyncHandler(async (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const otherUserId = req.params.userId;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!currentUserId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const messages = await messageService.getDirectMessages(currentUserId, otherUserId, limit);
  res.json(messages);
}));

// Send direct message
router.post('/:userId', validate(createMessageSchema), asyncHandler(async (req, res) => {
  const currentUserId = req.headers['x-user-id'] as string;
  const receiverId = req.params.userId;
  
  if (!currentUserId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, messageType } = req.body;
  const result = await messageService.sendDirectMessage({
    senderId: currentUserId,
    receiverId,
    content,
    messageType,
  });

  res.status(201).json(result);
}));

export default router;
