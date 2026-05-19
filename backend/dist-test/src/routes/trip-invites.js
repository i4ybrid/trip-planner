"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const trip_service_1 = require("@/services/trip.service");
const prisma_1 = __importDefault(require("@/lib/prisma"));
const uuid_1 = require("uuid");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
function generateInviteCode() {
    return (0, uuid_1.v4)().replace(/-/g, '').substring(0, 8).toUpperCase();
}
router.post('/trips/:tripId/invites', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        const canInvite = await trip_service_1.tripService.canInvite(tripId, userId);
        if (!canInvite.canInvite) {
            res.status(403).json({ error: canInvite.reason });
            return;
        }
        const code = generateInviteCode();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        const invite = await prisma_1.default.invite.create({
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
                inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${code}`,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/invites/code/use', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { code } = req.body;
        if (!code) {
            res.status(400).json({ error: 'Code is required' });
            return;
        }
        const invite = await prisma_1.default.invite.findFirst({
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
        const existingMember = await prisma_1.default.tripMember.findUnique({
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
        // Create as VIEWER first, then upgrade to EDITOR on acceptance
        await prisma_1.default.tripMember.upsert({
            where: {
                tripId_userId: {
                    tripId: invite.tripId,
                    userId,
                },
            },
            update: {
                role: 'EDITOR',
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
        // Promote VIEWER → EDITOR on acceptance
        await prisma_1.default.tripMember.update({
            where: {
                tripId_userId: {
                    tripId: invite.tripId,
                    userId,
                },
            },
            data: { role: 'EDITOR' },
        });
        await prisma_1.default.invite.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED' },
        });
        await prisma_1.default.timelineEvent.create({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/trips/:tripId/invites', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        const canInvite = await trip_service_1.tripService.canInvite(tripId, userId);
        if (!canInvite.canInvite) {
            res.status(403).json({ error: canInvite.reason });
            return;
        }
        const invites = await prisma_1.default.invite.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/trips/:tripId/invites/:inviteId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { tripId, inviteId } = req.params;
        const canInvite = await trip_service_1.tripService.canInvite(tripId, userId);
        if (!canInvite.canInvite) {
            res.status(403).json({ error: canInvite.reason });
            return;
        }
        const invite = await prisma_1.default.invite.findFirst({
            where: {
                id: inviteId,
                tripId,
            },
        });
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }
        await prisma_1.default.invite.update({
            where: { id: inviteId },
            data: { status: 'REVOKED' },
        });
        res.json({ message: 'Invite revoked successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/trips/:tripId/invites/email', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        const canInvite = await trip_service_1.tripService.canInvite(tripId, userId);
        if (!canInvite.canInvite) {
            res.status(403).json({ error: canInvite.reason });
            return;
        }
        // Get sender info for notification
        const sender = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        const existingUser = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            // Check if user is already a member
            const existingMember = await prisma_1.default.tripMember.findUnique({
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
            const existingInvite = await prisma_1.default.invite.findFirst({
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
            const token = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            const invite = await prisma_1.default.invite.create({
                data: {
                    tripId,
                    token,
                    email: email.toLowerCase(),
                    sentById: userId,
                    expiresAt,
                },
            });
            // Create notification with invite token for accept/decline
            await prisma_1.default.notification.create({
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
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await prisma_1.default.invite.create({
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
                inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=trip-invites.js.map