import { Router } from 'express';
import { ActivityService } from '../services/activity.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { createActivitySchema, updateActivitySchema } from '../lib/validation-schemas';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const activityService = new ActivityService(prisma);

// Get all activities for a trip
router.get('/', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const activities = await activityService.getTripActivities(tripId);
  res.json(activities);
}));

// Create activity
router.post('/', validate(createActivitySchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const activityData = {
    ...req.body,
    tripId,
    proposedBy: userId,
    startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
    endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
  };

  const activity = await activityService.createActivity(activityData);
  res.status(201).json(activity);
}));

// Get activity by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const activity = await activityService.getActivityById(req.params.id);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  res.json(activity);
}));

// Update activity
router.patch('/:id', validate(updateActivitySchema), asyncHandler(async (req, res) => {
  const activityData = {
    ...req.body,
    startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
    endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
  };

  const activity = await activityService.updateActivity(req.params.id, activityData);
  res.json(activity);
}));

// Delete activity
router.delete('/:id', asyncHandler(async (req, res) => {
  await activityService.deleteActivity(req.params.id);
  res.status(204).send();
}));

// Vote on activity
router.post('/:id/votes', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { option } = req.body;
  const vote = await activityService.vote(req.params.id, userId, option);
  res.status(201).json(vote);
}));

// Remove vote
router.delete('/:id/votes', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await activityService.removeVote(req.params.id, userId);
  res.status(204).send();
}));

// Get vote counts
router.get('/:id/votes', asyncHandler(async (req, res) => {
  const counts = await activityService.getVoteCounts(req.params.id);
  const winning = await activityService.getWinningOption(req.params.id);
  res.json({ counts, winning });
}));

// Check if user has voted
router.get('/:id/votes/:userId', asyncHandler(async (req, res) => {
  const hasVoted = await activityService.hasVoted(req.params.id, req.params.userId);
  const vote = await activityService.getUserVote(req.params.id, req.params.userId);
  res.json({ hasVoted, vote });
}));

// Set voting deadline
router.post('/:id/deadline', asyncHandler(async (req, res) => {
  const { votingEndsAt } = req.body;
  if (!votingEndsAt) {
    return res.status(400).json({ error: 'votingEndsAt is required' });
  }
  const activity = await activityService.setVotingDeadline(
    req.params.id,
    new Date(votingEndsAt)
  );
  res.json(activity);
}));

// Check if voting is open
router.get('/:id/status', asyncHandler(async (req, res) => {
  const isOpen = await activityService.isVotingOpen(req.params.id);
  const activity = await activityService.getActivityById(req.params.id);
  res.json({ isOpen, status: activity?.status });
}));

// Create booking from winning activity
router.post('/:id/book', asyncHandler(async (req, res) => {
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
}));

export default router;

