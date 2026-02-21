import { Router } from 'express';
import { MessageService } from '../services/message.service';
import { NotificationService } from '../services/notification.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const messageService = new MessageService(prisma);
const notificationService = new NotificationService(prisma);

// Get messages for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const beforeId = req.query.beforeId as string;
    
    const messages = await messageService.getTripMessages(req.params.tripId, limit, beforeId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// Send message
router.post('/trip/:tripId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content, messageType } = req.body;
    const result = await messageService.createMessage({
      tripId: req.params.tripId,
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
          req.params.tripId,
          content,
          user?.name || 'Someone',
          mentionedUserIds
        );
      }

      const hasEveryone = result.mentions.some(m => m.type === 'everyone');
      if (hasEveryone) {
        await notificationService.notifyEveryone(
          req.params.tripId,
          `${user?.name} mentioned everyone`,
          content,
          userId
        );
      }
    }

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Edit message
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await messageService.editMessage(req.params.id, userId, content);
    res.json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete message
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await messageService.deleteMessage(req.params.id, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add reaction to message
router.post('/:id/reactions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const reaction = await messageService.addReaction(req.params.id, userId, emoji);
    res.status(201).json(reaction);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remove reaction from message
router.delete('/:id/reactions', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { emoji } = req.query;
    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    await messageService.removeReaction(req.params.id, userId, emoji as string);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get reactions for a message
router.get('/:id/reactions', async (req, res) => {
  try {
    const reactions = await messageService.getReactions(req.params.id);
    res.json(reactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get reactions' });
  }
});

// Mark message as read
router.post('/:id/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const receipt = await messageService.markAsRead(req.params.id, userId);
    res.json(receipt);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Mark all messages in trip as read
router.post('/trip/:tripId/read-all', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await messageService.markAllAsRead(req.params.tripId, userId);
    res.json({ markedAsRead: count });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get read receipts for a message
router.get('/:id/read-receipts', async (req, res) => {
  try {
    const receipts = await messageService.getReadReceipts(req.params.id);
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get read receipts' });
  }
});

// Get unread count for a trip
router.get('/trip/:tripId/unread', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await messageService.getUnreadCount(req.params.tripId, userId);
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Get mentionable users for a trip
router.get('/trip/:tripId/mentions', async (req, res) => {
  try {
    const users = await messageService.getMentionedUsers(req.params.tripId);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get mentions' });
  }
});

export default router;
