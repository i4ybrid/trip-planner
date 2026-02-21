import { Router } from 'express';
import { TripService } from '../services/trip.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const tripService = new TripService(prisma);

// Get all trips for current user
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trips = await tripService.getUserTrips(userId);
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trips' });
  }
});

// Create new trip
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const trip = await tripService.createTrip(userId, req.body);
    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// Get trip by ID
router.get('/:id', async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get trip' });
  }
});

// Update trip
router.patch('/:id', async (req, res) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body);
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// Delete trip
router.delete('/:id', async (req, res) => {
  try {
    await tripService.deleteTrip(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// Change trip status
router.post('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const trip = await tripService.changeStatus(req.params.id, status);
    res.json(trip);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Add member to trip
router.post('/:id/members', async (req, res) => {
  try {
    const { userId, role } = req.body;
    const member = await tripService.addMember(req.params.id, userId, role);
    res.status(201).json(member);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Remove member from trip
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    await tripService.removeMember(req.params.id, req.params.userId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Get trip members
router.get('/:id/members', async (req, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    // @ts-ignore - members is included in getTripById
    res.json(trip.members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get members' });
  }
});

export default router;
