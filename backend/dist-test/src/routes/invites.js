"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const invite_service_1 = require("@/services/invite.service");
const validations_1 = require("@/lib/validations");
const trip_service_1 = require("@/services/trip.service");
const router = (0, express_1.Router)();
// GET /api/invites/pending - Get pending invites for current user
router.get('/invites/pending', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const invites = await invite_service_1.inviteService.getPendingInvitesByUserId(userId);
        res.json({ data: invites });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/invites/:token - Get invite details (public)
router.get('/invites/:token', auth_1.optionalAuthMiddleware, async (req, res) => {
    try {
        const invite = await invite_service_1.inviteService.getInviteByToken(req.params.token);
        if (!invite) {
            res.status(404).json({ error: 'Invite not found' });
            return;
        }
        res.json({ data: invite });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/invites/:token/accept - Accept invite
router.post('/invites/:token/accept', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const token = req.params.token;
        const trip = await invite_service_1.inviteService.acceptInvite(token, userId);
        res.json({ data: trip, message: 'Successfully joined the trip' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// POST /api/invites/:token/decline - Decline invite
router.post('/invites/:token/decline', auth_1.authMiddleware, async (req, res) => {
    try {
        const token = req.params.token;
        await invite_service_1.inviteService.declineInvite(token);
        res.json({ message: 'Invite declined' });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// DELETE /api/invites/:id - Revoke invite (authenticated)
router.delete('/invites/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const inviteId = req.params.id;
        const result = await invite_service_1.inviteService.revokeInvite(inviteId);
        res.json({ data: result, message: 'Invite revoked' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:tripId/invites - Get trip invites (authenticated)
router.get('/trips/:tripId/invites', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const invites = await invite_service_1.inviteService.getTripInvites(tripId);
        res.json({ data: invites });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:tripId/invites - Create invite (authenticated)
router.post('/trips/:tripId/invites', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.createInviteSchema.parse(req.body);
        const invite = await invite_service_1.inviteService.createInvite({
            ...validatedData,
            tripId,
            sentById: userId,
            expiresAt: new Date(validatedData.expiresAt),
        });
        res.status(201).json({ data: invite });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=invites.js.map