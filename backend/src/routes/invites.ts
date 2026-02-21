import { Router } from 'express';
import { InviteService } from '../services/invite.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const inviteService = new InviteService(prisma);

// Get invites for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const invites = await inviteService.getTripInvites(req.params.tripId);
    res.json(invites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invites' });
  }
});

// Create invite
router.post('/trip/:tripId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, phone, expiresInHours } = req.body;
    
    const invite = await inviteService.createInvite({
      tripId: req.params.tripId,
      email,
      phone,
      sentById: userId,
      expiresInHours,
    });

    // TODO: Send email/SMS via external service

    res.status(201).json(invite);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// Accept invite (public route)
router.post('/accept', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { token } = req.body;
    await inviteService.acceptInvite(token, userId);
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Decline invite
router.post('/decline', async (req, res) => {
  try {
    const { token } = req.body;
    await inviteService.declineInvite(token);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to decline invite' });
  }
});

// Revoke invite
router.delete('/:id', async (req, res) => {
  try {
    await inviteService.revokeInvite(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

// Validate invite (public)
router.get('/validate/:token', async (req, res) => {
  try {
    const isValid = await inviteService.isInviteValid(req.params.token);
    res.json({ valid: isValid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate invite' });
  }
});

// Get invite by token (public)
router.get('/token/:token', async (req, res) => {
  try {
    const invite = await inviteService.getInviteByToken(req.params.token);
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }
    res.json(invite);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invite' });
  }
});

export default router;
