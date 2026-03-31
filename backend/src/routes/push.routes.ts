import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { pushService } from '../services/push.service';

const router = Router();
router.use(authMiddleware);

router.post('/push/subscribe', async (req: AuthRequest, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription shape' });
      return;
    }
    await pushService.subscribe(req.user!.userId, subscription);
    res.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

router.delete('/push/unsubscribe', async (req: AuthRequest, res) => {
  try {
    await pushService.unsubscribe(req.user!.userId);
    res.json({ ok: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: message });
  }
});

export default router;
