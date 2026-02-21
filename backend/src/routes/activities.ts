import { Router } from 'express';
import { ActivityService } from '../services/activity.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const activityService = new ActivityService(prisma);

// Get all activities for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const activities = await activityService.getTripActivities(req.params.tripId);
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activities' });
  }
});

// Create activity
router.post('/trip/:tripId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const activity = await activityService.createActivity({
      ...req.body,
      tripId: req.params.tripId,
      proposedBy: userId,
    });
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

// Get activity by ID
router.get('/:id', async (req, res) => {
  try {
    const activity = await activityService.getActivityById(req.params.id);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity' });
  }
});

// Update activity
router.patch('/:id', async (req, res) => {
  try {
    const activity = await activityService.updateActivity(req.params.id, req.body);
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

// Delete activity
router.delete('/:id', async (req, res) => {
  try {
    await activityService.deleteActivity(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// Vote on activity
router.post('/:id/votes', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { option } = req.body;
    const vote = await activityService.vote(req.params.id, userId, option);
    res.status(201).json(vote);
  } catch (error) {
    res.status(500).json({ error: 'Failed to vote' });
  }
});

// Remove vote
router.delete('/:id/votes', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await activityService.removeVote(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

// Get vote counts
router.get('/:id/votes', async (req, res) => {
  try {
    const counts = await activityService.getVoteCounts(req.params.id);
    const winning = await activityService.getWinningOption(req.params.id);
    res.json({ counts, winning });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get votes' });
  }
});

// Check if user has voted
router.get('/:id/votes/:userId', async (req, res) => {
  try {
    const hasVoted = await activityService.hasVoted(req.params.id, req.params.userId);
    const vote = await activityService.getUserVote(req.params.id, req.params.userId);
    res.json({ hasVoted, vote });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check vote' });
  }
});

// Set voting deadline
router.post('/:id/deadline', async (req, res) => {
  try {
    const { votingEndsAt } = req.body;
    if (!votingEndsAt) {
      return res.status(400).json({ error: 'votingEndsAt is required' });
    }
    const activity = await activityService.setVotingDeadline(
      req.params.id,
      new Date(votingEndsAt)
    );
    res.json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to set deadline' });
  }
});

// Check if voting is open
router.get('/:id/status', async (req, res) => {
  try {
    const isOpen = await activityService.isVotingOpen(req.params.id);
    const activity = await activityService.getActivityById(req.params.id);
    res.json({ isOpen, status: activity?.status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get voting status' });
  }
});

// Create booking from winning activity
router.post('/:id/book', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { confirmationNum } = req.body;
    const booking = await activityService.createBookingFromWinner(
      req.params.id,
      userId,
      confirmationNum
    );
    res.status(201).json(booking);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Process all expired deadlines (for cron job)
router.post('/cron/deadlines', async (req, res) => {
  try {
    const count = await activityService.processAllDeadlines();
    res.json({ processed: count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process deadlines' });
  }
});

export default router;
