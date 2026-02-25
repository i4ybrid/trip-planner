import { Router } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '@/middleware/auth';
import { inviteService } from '@/services/invite.service';
import { createInviteSchema } from '@/lib/validations';
import { tripService } from '@/services/trip.service';

const router = Router();

// GET /api/invites/:token - Get invite details (public)
router.get('/invites/:token', optionalAuthMiddleware, async (req: AuthRequest, res) => {
  try {
    const invite = await inviteService.getInviteByToken(req.params.token);
    
    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }
    
    res.json({ data: invite });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/invites/:token/accept - Accept invite
router.post('/invites/:token/accept', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const token = req.params.token;
    
    const trip = await inviteService.acceptInvite(token, userId);
    res.json({ data: trip, message: 'Successfully joined the trip' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// POST /api/invites/:token/decline - Decline invite
router.post('/invites/:token/decline', async (req, res) => {
  try {
    const token = req.params.token;
    await inviteService.declineInvite(token);
    res.json({ message: 'Invite declined' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE /api/invites/:id - Revoke invite (authenticated)
router.delete('/invites/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const inviteId = req.params.id;

    const result = await inviteService.revokeInvite(inviteId);
    res.json({ data: result, message: 'Invite revoked' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:tripId/invites - Get trip invites (authenticated)
router.get('/trips/:tripId/invites', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const invites = await inviteService.getTripInvites(tripId);
    res.json({ data: invites });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:tripId/invites - Create invite (authenticated)
router.post('/trips/:tripId/invites', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const validatedData = createInviteSchema.parse(req.body);
    
    const invite = await inviteService.createInvite({
      ...validatedData,
      tripId,
      sentById: userId,
      expiresAt: new Date(validatedData.expiresAt),
    });
    
    res.status(201).json({ data: invite });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
