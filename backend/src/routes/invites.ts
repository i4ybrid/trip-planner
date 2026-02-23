import { Router } from 'express';
import { InviteService } from '../services/invite.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { inviteSchema } from '../lib/validation-schemas';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const inviteService = new InviteService(prisma);

// Get invites for a trip
router.get('/', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const invites = await inviteService.getTripInvites(tripId);
  res.json(invites);
}));

// Create invite
router.post('/', validate(inviteSchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { email, phone, expiresInHours } = req.body;
  
  const invite = await inviteService.createInvite({
    tripId,
    email,
    phone,
    sentById: userId,
    expiresInHours,
  });

  res.status(201).json(invite);
}));

// Accept invite (public route - not necessarily nested)
router.post('/accept', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { token } = req.body;
  await inviteService.acceptInvite(token, userId);
  res.status(200).json({ success: true });
}));

// Decline invite
router.post('/decline', asyncHandler(async (req, res) => {
  const { token } = req.body;
  await inviteService.declineInvite(token);
  res.status(200).json({ success: true });
}));

// Revoke invite
router.delete('/:id', asyncHandler(async (req, res) => {
  await inviteService.revokeInvite(req.params.id);
  res.status(204).send();
}));

// Validate invite (public)
router.get('/validate/:token', asyncHandler(async (req, res) => {
  const isValid = await inviteService.isInviteValid(req.params.token);
  res.json({ valid: isValid });
}));

// Get invite by token (public)
router.get('/token/:token', asyncHandler(async (req, res) => {
  const invite = await inviteService.getInviteByToken(req.params.token);
  if (!invite) {
    return res.status(404).json({ error: 'Invite not found' });
  }
  res.json(invite);
}));

export default router;

