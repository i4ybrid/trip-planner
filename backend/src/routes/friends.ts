import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { friendService } from '@/services/friend.service';
import prisma from '@/lib/prisma';

const router = Router();

router.use(authMiddleware);

router.get('/friends', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const friends = await friendService.getFriends(userId);
    res.json({ data: friends });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/friends/search', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      res.status(400).json({ error: 'email query parameter is required' });
      return;
    }

    const user = await prisma.user.findUnique({
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

    const relationship = await friendService.getRelationship(userId, user.id);

    res.json({ data: { found: true, user, relationship } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/friends', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { receiverId } = req.body;
    
    if (!receiverId) {
      res.status(400).json({ error: 'receiverId is required' });
      return;
    }
    
    if (receiverId === userId) {
      res.status(400).json({ error: 'Cannot send friend request to yourself' });
      return;
    }
    
    const request = await friendService.sendFriendRequest(userId, receiverId);
    res.status(201).json({ data: request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/friends/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const friendId = req.params.id;
    
    await friendService.removeFriend(userId, friendId);
    res.json({ message: 'Friend removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/friend-requests - List friend requests
router.get('/friend-requests', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const requests = await friendService.getFriendRequests(userId);
    res.json({ data: requests });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/friend-requests - Send friend request
router.post('/friend-requests', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { receiverId } = req.body;
    
    if (!receiverId) {
      res.status(400).json({ error: 'receiverId is required' });
      return;
    }
    
    const request = await friendService.sendFriendRequest(userId, receiverId);
    res.status(201).json({ data: request });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// PATCH /api/friend-requests/:id - Accept/decline friend request
router.patch('/friend-requests/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const requestId = req.params.id;
    const { action } = req.body;
    
    if (!action || !['accept', 'decline'].includes(action)) {
      res.status(400).json({ error: 'action must be "accept" or "decline"' });
      return;
    }
    
    // Verify user is the receiver
    const request = await friendService.getFriendRequests(userId);
    const isReceiver = request.received.some((r) => r.id === requestId);
    
    if (!isReceiver) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    if (action === 'accept') {
      const result = await friendService.acceptFriendRequest(requestId);
      res.json({ data: result });
    } else {
      const result = await friendService.declineFriendRequest(requestId);
      res.json({ data: result });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/friend-requests/:id - Cancel friend request
router.delete('/friend-requests/:id', async (req: AuthRequest, res) => {
  try {
    const requestId = req.params.id;

    await friendService.cancelFriendRequest(requestId);
    res.json({ message: 'Friend request cancelled' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
