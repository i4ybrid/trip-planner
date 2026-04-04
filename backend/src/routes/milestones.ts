import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { milestoneService } from '@/services/milestone.service';
import { tripService } from '@/services/trip.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/trips/:id/milestones - List milestones for trip
router.get('/trips/:id/milestones', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.userId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const milestones = await milestoneService.getMilestonesWithProgress(tripId);
    res.json({ data: milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/milestones - Create custom milestone
router.post('/trips/:id/milestones', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.userId;

    // Check permission (only MASTER and ORGANIZER can create milestones)
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { name, type, dueDate, isHard, priority } = req.body;

    if (!name || !type || !dueDate) {
      res.status(400).json({ error: 'Name, type, and dueDate are required' });
      return;
    }

    const milestone = await milestoneService.createCustomMilestone(tripId, {
      name,
      type,
      dueDate: new Date(dueDate),
      isHard,
      priority,
    });

    res.status(201).json({ data: milestone });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/milestones/:id - Update milestone (date, lock, skip)
router.patch('/milestones/:id', async (req: AuthRequest, res) => {
  try {
    const milestoneId = req.params.id;
    const userId = req.user!.userId;

    // Get milestone to find tripId
    const { default: prisma } = await import('@/lib/prisma');
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { trip: true },
    });

    if (!existingMilestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const tripId = existingMilestone.tripId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { dueDate, isLocked, isSkipped, isHard, name } = req.body;

    const updated = await milestoneService.updateMilestone(milestoneId, {
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isLocked,
      isSkipped,
      isHard,
      name,
    });

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/milestones/:id - Delete a milestone
router.delete('/milestones/:id', async (req: AuthRequest, res) => {
  try {
    const milestoneId = req.params.id;
    const userId = req.user!.userId;

    // Get milestone to find tripId
    const { default: prisma } = await import('@/lib/prisma');
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: { trip: true },
    });

    if (!existingMilestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const tripId = existingMilestone.tripId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await milestoneService.deleteMilestone(milestoneId);

    res.status(204).send();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/milestones/actions - Trigger on-demand action
router.post('/trips/:id/milestones/actions', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.userId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { actionType, recipientIds } = req.body;

    if (!actionType || !recipientIds || !Array.isArray(recipientIds)) {
      res.status(400).json({ error: 'actionType and recipientIds array are required' });
      return;
    }

    // PAYMENT_REQUEST and SETTLEMENT_REMINDER action types are no longer supported
    res.status(400).json({ error: 'Invalid actionType. Settlement reminders are now sent via the Payments tab.' });
    return;
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id/milestones/progress - Get completion progress per member
router.get('/trips/:id/milestones/progress', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.userId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const progress = await milestoneService.getMilestoneProgress(tripId);
    res.json({ data: progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/milestones/:id/completions/:userId - Mark milestone complete/skipped
router.patch('/milestones/:id/completions/:userId', async (req: AuthRequest, res) => {
  try {
    const milestoneId = req.params.id;
    const targetUserId = req.params.userId;
    const userId = req.user!.userId;

    // Get milestone to find tripId
    const { default: prisma } = await import('@/lib/prisma');
    const existingMilestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
    });

    if (!existingMilestone) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    const tripId = existingMilestone.tripId;

    // Check permission (either the user themselves or organizer/master)
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    const isSelf = userId === targetUserId;

    if (!permission.hasPermission && !isSelf) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { status, note } = req.body;

    if (!status || !['PENDING', 'COMPLETED', 'SKIPPED', 'OVERDUE'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const completion = await milestoneService.updateMilestoneCompletion(
      milestoneId,
      targetUserId,
      status,
      note
    );

    res.json({ data: completion });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/milestones/generate-default - Generate default milestones from TODAY baseline
router.post('/trips/:id/milestones/generate-default', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.userId;

    // Check permission (only MASTER and ORGANIZER)
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const trip = await tripService.getTripById(tripId);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    if (!trip.startDate) {
      res.status(400).json({ error: 'Trip must have a start date to generate milestones' });
      return;
    }

    const milestones = await milestoneService.generateDefaultMilestonesFromToday(
      tripId,
      trip.startDate,
      trip.endDate || trip.startDate,
    );

    res.status(201).json({ data: milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/milestones/regenerate - Manually regenerate milestones
router.post('/trips/:id/milestones/regenerate', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user!.userId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const trip = await tripService.getTripById(tripId);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    if (!trip.startDate) {
      res.status(400).json({ error: 'Trip must have a start date to generate milestones' });
      return;
    }

    await milestoneService.generateIdeaMilestones(tripId, trip.startDate);

    const milestones = await milestoneService.getMilestonesWithProgress(tripId);
    res.json({ data: milestones });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
