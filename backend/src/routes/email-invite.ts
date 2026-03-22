import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';

const router = Router();

router.use(authMiddleware);

router.post('/invites/email', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { email, message } = req.body;

    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    res.json({
      data: {
        success: true,
        stubMessage: 'Email invite stub - not implemented',
        email,
        userId,
        customMessage: message || null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
