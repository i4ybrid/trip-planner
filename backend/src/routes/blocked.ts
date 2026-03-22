import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { blockedUserService } from '@/services/blocked-user.service';

const router = Router();

router.use(authMiddleware);

router.get('/blocked', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const blocked = await blockedUserService.getBlockedUsers(userId);
    res.json({ data: blocked });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/blocked', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { blockedId } = req.body;

    if (!blockedId) {
      res.status(400).json({ error: 'blockedId is required' });
      return;
    }

    const result = await blockedUserService.blockUser(userId, blockedId);
    res.status(201).json({ data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/blocked/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const blockedId = req.params.id;

    await blockedUserService.unblockUser(userId, blockedId);
    res.json({ message: 'User unblocked successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
