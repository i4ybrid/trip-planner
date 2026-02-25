import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { activityService } from '@/services/activity.service';
import { voteService } from '@/services/vote.service';
import { createActivitySchema, updateActivitySchema, createVoteSchema } from '@/lib/validations';
import { tripService } from '@/services/trip.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/trips/:tripId/activities - Get trip activities
router.get('/trips/:tripId/activities', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const activities = await activityService.getTripActivities(tripId);
    res.json({ data: activities });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:tripId/activities - Create activity
router.post('/trips/:tripId/activities', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = createActivitySchema.parse(req.body);
    const activity = await activityService.createActivity({
      tripId,
      proposedBy: userId,
      title: validatedData.title,
      description: validatedData.description,
      location: validatedData.location,
      startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
      cost: validatedData.cost,
      currency: validatedData.currency,
      category: validatedData.category,
    });

    res.status(201).json({ data: activity });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/activities/:id - Get activity details
router.get('/activities/:id', async (req: AuthRequest, res) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    
    res.json({ data: activity });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/activities/:id - Update activity
router.patch('/activities/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const activityId = req.params.id;

    const activity = await activityService.getActivityById(activityId);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }

    // Check permission (only proposer or trip organizer can edit)
    const permission = await tripService.checkMemberPermission(activity.tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission && activity.proposedBy !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = updateActivitySchema.parse(req.body);
    const updated = await activityService.updateActivity(activityId, {
      title: validatedData.title,
      description: validatedData.description,
      location: validatedData.location,
      startTime: validatedData.startTime ? new Date(validatedData.startTime) : undefined,
      endTime: validatedData.endTime ? new Date(validatedData.endTime) : undefined,
      cost: validatedData.cost,
      currency: validatedData.currency,
      category: validatedData.category,
    });

    res.json({ data: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/activities/:id - Delete activity
router.delete('/activities/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const activityId = req.params.id;
    
    const activity = await activityService.getActivityById(activityId);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    
    // Check permission
    const permission = await tripService.checkMemberPermission(activity.tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission && activity.proposedBy !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await activityService.deleteActivity(activityId);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/activities/:id/votes - Get votes for activity
router.get('/activities/:id/votes', async (req: AuthRequest, res) => {
  try {
    const activityId = req.params.id;
    
    const activity = await activityService.getActivityById(activityId);
    if (!activity) {
      res.status(404).json({ error: 'Activity not found' });
      return;
    }
    
    const votes = await voteService.getVotes(activityId);
    const voteCounts = await activityService.getVoteCounts(activityId);
    
    res.json({ data: { votes, counts: voteCounts } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/activities/:id/votes - Cast vote
router.post('/activities/:id/votes', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const activityId = req.params.id;
    
    const validatedData = createVoteSchema.parse(req.body);
    const vote = await voteService.castVote(activityId, userId, validatedData.option);
    
    res.status(201).json({ data: vote });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/activities/:id/votes - Remove vote
router.delete('/activities/:id/votes', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const activityId = req.params.id;
    
    await voteService.removeVote(activityId, userId);
    res.json({ message: 'Vote removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
