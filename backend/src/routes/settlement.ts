import { Router } from 'express';
import { reminderService } from '@/services/reminder.service';
import { tripService } from '@/services/trip.service';
import { AuthRequest } from '@/middleware/auth';

const router = Router();

// POST /trips/:tripId/settlements/remind-all
router.post('/trips/:tripId/settlements/remind-all', async (req: AuthRequest, res) => {
  try {
    const { tripId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const perm = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!perm.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await reminderService.sendBulkSettlementReminders(tripId, userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /trips/:tripId/settlements/:userId/remind
router.post('/trips/:tripId/settlements/:userId/remind', async (req: AuthRequest, res) => {
  try {
    const { tripId, userId: targetUserId } = req.params;
    const senderId = req.user?.userId;

    if (!senderId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const perm = await tripService.checkMemberPermission(tripId, senderId, ['MASTER', 'ORGANIZER']);
    if (!perm.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await reminderService.sendSettlementReminder(tripId, senderId, targetUserId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
