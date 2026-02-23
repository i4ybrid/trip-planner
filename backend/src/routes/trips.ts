import { Router } from 'express';
import { TripService } from '../services/trip.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { createTripSchema, updateTripSchema } from '../lib/validation-schemas';

import activitiesRouter from './activities';
import messagesRouter from './messages';
import invitesRouter from './invites';
import paymentsRouter from './payments';
import mediaRouter from './media';

const router = Router();
const prisma = new PrismaClient();
const tripService = new TripService(prisma);

// Sub-routers
router.use('/:tripId/activities', activitiesRouter);
router.use('/:tripId/messages', messagesRouter);
router.use('/:tripId/invites', invitesRouter);
router.use('/:tripId/payments', paymentsRouter);
router.use('/:tripId/media', mediaRouter);

// Get all trips for current user
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('[Trips Route] GET /trips for userId:', userId);
  const trips = await tripService.getUserTrips(userId);
  console.log('[Trips Route] getUserTrips returned:', JSON.stringify(trips, null, 2));
  res.json(trips);
}));

// Create new trip
router.post('/', validate(createTripSchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tripData = {
    ...req.body,
    startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
    endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
  };

  const trip = await tripService.createTrip(userId, tripData);
  res.status(201).json(trip);
}));

// Get trip by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  res.json(trip);
}));

// Update trip
router.patch('/:id', validate(updateTripSchema), asyncHandler(async (req, res) => {
  const tripData = {
    ...req.body,
    startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
    endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
  };

  const trip = await tripService.updateTrip(req.params.id, tripData);
  res.json(trip);
}));

// Delete trip
router.delete('/:id', asyncHandler(async (req, res) => {
  await tripService.deleteTrip(req.params.id);
  res.status(204).send();
}));

// Change trip status
router.post('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body;
  const trip = await tripService.changeStatus(req.params.id, status);
  res.json(trip);
}));

// Add member to trip
router.post('/:id/members', asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  const member = await tripService.addMember(req.params.id, userId, role);
  res.status(201).json(member);
}));

// Remove member from trip
router.delete('/:id/members/:userId', asyncHandler(async (req, res) => {
  await tripService.removeMember(req.params.id, req.params.userId);
  res.status(204).send();
}));

// Get trip members
router.get('/:id/members', asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.params.id);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }
  // @ts-ignore - members is included in getTripById
  res.json(trip.members);
}));

export default router;


