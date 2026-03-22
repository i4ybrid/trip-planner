import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { inviteCodeService } from '@/services/invite-code.service';

const router = Router();

router.use(authMiddleware);

router.get('/invite-codes', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const codes = await inviteCodeService.getInviteCodes(userId);
    res.json({ data: codes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/invite-codes', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { daysUntilExpiry } = req.body;

    const code = await inviteCodeService.generateInviteCode(
      userId,
      daysUntilExpiry ? parseInt(daysUntilExpiry) : 7
    );
    res.status(201).json({ data: code });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/invite-codes/:code/use', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const code = req.params.code;

    const result = await inviteCodeService.useInviteCode(code, userId);
    res.json({ data: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/invite-codes/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const codeId = req.params.id;

    await inviteCodeService.revokeInviteCode(codeId, userId);
    res.json({ message: 'Invite code revoked successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
