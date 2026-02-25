import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { messageService } from '@/services/message.service';
import { createMessageSchema } from '@/lib/validations';
import { tripService } from '@/services/trip.service';
import prisma from '@/lib/prisma';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/trips/:tripId/messages - Get trip messages
router.get('/trips/:tripId/messages', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const messages = await messageService.getTripMessages(tripId, limit, before);
    res.json({ data: messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:tripId/messages - Send trip message
router.post('/trips/:tripId/messages', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const validatedData = createMessageSchema.parse(req.body);
    
    const message = await messageService.createTripMessage(
      tripId,
      userId,
      validatedData.content,
      validatedData.messageType,
      validatedData.mentions,
      validatedData.replyToId
    );
    
    res.status(201).json({ data: message });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dm/conversations - List DM conversations
router.get('/dm/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.dmConversation.findMany({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dm/conversations - Start DM conversation
router.post('/dm/conversations', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
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
    
    let conversation = await prisma.dmConversation.findUnique({
      where: {
        participant1_participant2: {
          participant1,
          participant2,
        },
      },
    });
    
    if (!conversation) {
      conversation = await prisma.dmConversation.create({
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/dm/conversations/:id - Get DM messages
router.get('/dm/conversations/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const before = req.query.before ? new Date(req.query.before as string) : undefined;
    
    // Verify user is participant
    const conversation = await prisma.dmConversation.findUnique({
      where: { id: conversationId },
    });
    
    if (!conversation || 
        (conversation.participant1 !== userId && conversation.participant2 !== userId)) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const messages = await messageService.getDmMessages(conversationId, limit, before);
    res.json({ data: messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/dm/conversations/:id/messages - Send DM message
router.post('/dm/conversations/:id/messages', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const conversationId = req.params.id;
    
    // Verify user is participant
    const conversation = await prisma.dmConversation.findUnique({
      where: { id: conversationId },
    });
    
    if (!conversation || 
        (conversation.participant1 !== userId && conversation.participant2 !== userId)) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const validatedData = createMessageSchema.parse(req.body);
    
    const message = await messageService.createDmMessage(
      conversationId,
      userId,
      validatedData.content,
      validatedData.messageType,
      validatedData.mentions,
      validatedData.replyToId
    );
    
    res.status(201).json({ data: message });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/messages/:id - Edit message
router.patch('/messages/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const messageId = req.params.id;
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    
    if (!message || message.senderId !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const validatedData = createMessageSchema.partial().parse(req.body);
    
    const updated = await messageService.updateMessage(messageId, validatedData);
    res.json({ data: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/messages/:id - Delete message
router.delete('/messages/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const messageId = req.params.id;
    
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });
    
    if (!message || message.senderId !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await messageService.deleteMessage(messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/:id/reactions - Add/remove reaction
router.post('/messages/:id/reactions', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const messageId = req.params.id;
    const { emoji, action } = req.body;
    
    if (!emoji) {
      res.status(400).json({ error: 'emoji is required' });
      return;
    }
    
    if (action === 'remove') {
      await messageService.removeReaction(messageId, userId, emoji);
    } else {
      await messageService.addReaction(messageId, userId, emoji);
    }
    
    res.json({ message: 'Reaction updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/messages/:id/read - Mark message as read
router.post('/messages/:id/read', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const messageId = req.params.id;
    
    await messageService.markAsRead(messageId, userId);
    res.json({ message: 'Message marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
