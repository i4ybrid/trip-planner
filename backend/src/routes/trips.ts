import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { tripService } from '@/services/trip.service';
import { createTripSchema, updateTripSchema } from '@/lib/validations';

const router = Router();

function normalizeDate(dateStr: string, isEndDate: boolean): Date {
  const date = new Date(dateStr);
  const hours = isEndDate ? 23 : 0;
  const minutes = isEndDate ? 59 : 0;
  date.setHours(hours, minutes, 0, 0);
  return date;
}

// All routes require authentication
router.use(authMiddleware);

// GET /api/trips - List user's trips
router.get('/trips', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const trips = await tripService.getUserTrips(userId);
    res.json({ data: trips });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips - Create new trip
router.post('/trips', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const validatedData = createTripSchema.parse(req.body);

    const trip = await tripService.createTrip(userId, {
      name: validatedData.name,
      description: validatedData.description,
      destination: validatedData.destination,
      startDate: validatedData.startDate ? normalizeDate(validatedData.startDate, false) : undefined,
      endDate: validatedData.endDate ? normalizeDate(validatedData.endDate, true) : undefined,
      coverImage: validatedData.coverImage,
    });
    res.status(201).json({ data: trip });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id - Get trip details
router.get('/trips/:id', async (req: AuthRequest, res) => {
  try {
    const trip = await tripService.getTripById(req.params.id);

    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    res.json({ data: trip });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/trips/:id - Update trip
router.patch('/trips/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = updateTripSchema.parse(req.body);
    const trip = await tripService.updateTrip(tripId, {
      name: validatedData.name,
      description: validatedData.description,
      destination: validatedData.destination,
      startDate: validatedData.startDate ? normalizeDate(validatedData.startDate, false) : undefined,
      endDate: validatedData.endDate ? normalizeDate(validatedData.endDate, true) : undefined,
      coverImage: validatedData.coverImage,
      status: validatedData.status,
      style: validatedData.style,
    });

    res.json({ data: trip });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/trips/:id - Delete trip
router.delete('/trips/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    
    // Check permission (only MASTER can delete)
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await tripService.deleteTrip(tripId);
    res.json({ message: 'Trip deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/status - Change trip status
router.post('/trips/:id/status', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const trip = await tripService.changeTripStatus(tripId, status);
    res.json({ data: trip });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// GET /api/trips/:id/timeline - Get trip timeline
router.get('/trips/:id/timeline', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const timeline = await tripService.getTripTimeline(tripId, limit);
    res.json({ data: timeline });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:id/members - Get trip members
router.get('/trips/:id/members', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const members = await tripService.getTripMembers(tripId);
    res.json({ data: members });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:id/members - Add member to trip (invite existing user)
router.post('/trips/:id/members', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    const { userId: newMemberId } = req.body;

    if (!newMemberId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const trip = await tripService.getTripById(tripId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const canInvite = await tripService.canInvite(tripId, userId);
    if (!canInvite.canInvite) {
      res.status(403).json({ error: canInvite.reason });
      return;
    }

    const member = await tripService.addTripMember(tripId, newMemberId, userId);
    res.status(201).json({ data: member });
  } catch (error: any) {
    // Handle Prisma unique constraint violation (user already a member)
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'User is already a member of this trip' });
      return;
    }
    if (error.message === 'User is already a member of this trip') {
      res.status(409).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/trips/:id/members/:userId - Update member role/status (promote/demote)
router.patch('/trips/:id/members/:userId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    const targetUserId = req.params.userId;
    const { role, status } = req.body;

    const trip = await tripService.getTripById(tripId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    if (role === 'ORGANIZER') {
      const canPromote = await tripService.canPromoteToOrganizer(userId, tripId);
      if (!canPromote.canPromote) {
        res.status(403).json({ error: canPromote.reason });
        return;
      }
    }

    const canManage = await tripService.canManageMember(userId, targetUserId, tripId);
    if (!canManage.canManage) {
      res.status(403).json({ error: canManage.reason });
      return;
    }

    const member = await tripService.updateTripMember(tripId, targetUserId, {
      role: role as string | undefined,
      status: status as string | undefined,
    });
    res.json({ data: member });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/trips/:id/members/:userId - Remove member from trip
router.delete('/trips/:id/members/:userId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.id;
    const targetUserId = req.params.userId;
    
    if (userId === targetUserId) {
      res.status(400).json({ error: 'Cannot remove yourself from the trip' });
      return;
    }

    const trip = await tripService.getTripById(tripId);
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const canManage = await tripService.canManageMember(userId, targetUserId, tripId);
    if (!canManage.canManage) {
      res.status(403).json({ error: canManage.reason });
      return;
    }
    
    await tripService.removeTripMember(tripId, targetUserId);
    res.json({ message: 'Member removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
