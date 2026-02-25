import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { friendService } from '@/services/friend.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/friends - List friends
router.get('/friends', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const friends = await friendService.getFriends(userId);
    res.json({ data: friends });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/friends - Add friend (send friend request)
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

// DELETE /api/friends/:id - Remove friend
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
