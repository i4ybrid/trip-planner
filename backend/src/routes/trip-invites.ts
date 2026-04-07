import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { tripService } from '@/services/trip.service';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.use(authMiddleware);

function generateInviteCode(): string {
  return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
}

router.post('/trips/:tripId/invites', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

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

    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = await prisma.invite.create({
      data: {
        tripId,
        code,
        sentById: userId,
        expiresAt,
      },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      data: {
        ...invite,
        inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:16199'}/invite/${code}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/invites/code/use', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Code is required' });
      return;
    }

    const invite = await prisma.invite.findFirst({
      where: {
        code: code.toUpperCase(),
        status: 'PENDING',
      },
      include: {
        trip: true,
      },
    });

    if (!invite) {
      res.status(404).json({ error: 'Invalid or expired invite code' });
      return;
    }

    if (invite.expiresAt < new Date()) {
      res.status(400).json({ error: 'This invite code has expired' });
      return;
    }

    const existingMember = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId: invite.tripId,
          userId,
        },
      },
    });

    if (existingMember && existingMember.status === 'CONFIRMED') {
      res.status(400).json({ error: 'You are already a member of this trip' });
      return;
    }

    // Determine status based on trip style
    // OPEN trips auto-confirm members, MANAGED trips require approval
    const newMemberStatus = invite.trip.style === 'OPEN' ? 'CONFIRMED' : 'INVITED';

    // Create as VIEWER first, then upgrade to MEMBER on acceptance
    await prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: invite.tripId,
          userId,
        },
      },
      update: {
        role: 'MEMBER',
        status: newMemberStatus,
        invitedById: invite.sentById,
      },
      create: {
        tripId: invite.tripId,
        userId,
        role: 'VIEWER',
        status: newMemberStatus,
        invitedById: invite.sentById,
      },
    });

    // Promote VIEWER → MEMBER on acceptance
    await prisma.tripMember.update({
      where: {
        tripId_userId: {
          tripId: invite.tripId,
          userId,
        },
      },
      data: { role: 'MEMBER' },
    });

    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    await prisma.timelineEvent.create({
      data: {
        tripId: invite.tripId,
        eventType: 'member_joined',
        description: newMemberStatus === 'CONFIRMED' 
          ? 'A new member joined via invite code'
          : 'A new member request is pending approval',
        createdBy: userId,
        effectiveDate: new Date(),
      },
    });

    res.json({
      data: {
        tripId: invite.tripId,
        tripName: invite.trip.name,
        status: newMemberStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trips/:tripId/invites', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

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

    const invites = await prisma.invite.findMany({
      where: { tripId },
      include: {
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: invites });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/trips/:tripId/invites/:inviteId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { tripId, inviteId } = req.params;

    const canInvite = await tripService.canInvite(tripId, userId);
    if (!canInvite.canInvite) {
      res.status(403).json({ error: canInvite.reason });
      return;
    }

    const invite = await prisma.invite.findFirst({
      where: {
        id: inviteId,
        tripId,
      },
    });

    if (!invite) {
      res.status(404).json({ error: 'Invite not found' });
      return;
    }

    await prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });

    res.json({ message: 'Invite revoked successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trips/:tripId/invites/email', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
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

    // Get sender info for notification
    const sender = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Check if user is already a member
      const existingMember = await prisma.tripMember.findUnique({
        where: {
          tripId_userId: {
            tripId,
            userId: existingUser.id,
          },
        },
      });

      if (existingMember && existingMember.status === 'CONFIRMED') {
        res.status(400).json({ error: 'User is already a member of this trip' });
        return;
      }

      // Check if there's already a pending invite for this user
      const existingInvite = await prisma.invite.findFirst({
        where: {
          tripId,
          email: email.toLowerCase(),
          status: 'PENDING',
          expiresAt: { gte: new Date() },
        },
      });

      if (existingInvite) {
        res.status(400).json({ error: 'An invitation has already been sent to this email' });
        return;
      }

      // Create an invite with token for the existing user
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const invite = await prisma.invite.create({
        data: {
          tripId,
          token,
          email: email.toLowerCase(),
          sentById: userId,
          expiresAt,
        },
      });

      // Create notification with invite token for accept/decline
      await prisma.notification.create({
        data: {
          userId: existingUser.id,
          category: 'INVITE',
          title: 'Trip Invitation',
          body: `${sender?.name || 'Someone'} invited you to "${trip.name}"`,
          referenceId: invite.token,
          referenceType: 'INVITE',
          link: `/invites/pending`,
        },
      });

      res.json({
        data: {
          success: true,
          message: 'Invitation sent to existing user',
          existingUserNotified: true,
          inviteToken: token,
        },
      });
      return;
    }

    // For non-existing users, we still create an invite record
    // They can accept via the invite link sent via email
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.invite.create({
      data: {
        tripId,
        token,
        email: email.toLowerCase(),
        sentById: userId,
        expiresAt,
      },
    });

    res.json({
      data: {
        success: true,
        message: 'Invitation link created',
        existingUserNotified: false,
        inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:16199'}/invite/${token}`,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;