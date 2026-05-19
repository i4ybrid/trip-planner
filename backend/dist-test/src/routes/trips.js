"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const client_1 = require("@prisma/client");
const trip_service_1 = require("@/services/trip.service");
const timeline_service_1 = require("@/services/timeline.service");
const validations_1 = require("@/lib/validations");
const router = (0, express_1.Router)();
function normalizeDate(dateStr, isEndDate) {
    const date = new Date(dateStr);
    const hours = isEndDate ? 23 : 0;
    const minutes = isEndDate ? 59 : 0;
    date.setHours(hours, minutes, 0, 0);
    return date;
}
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /api/trips - List user's trips
router.get('/trips', async (req, res) => {
    try {
        const userId = req.user.userId;
        const trips = await trip_service_1.tripService.getUserTrips(userId);
        res.json({ data: trips });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips - Create new trip
router.post('/trips', async (req, res) => {
    try {
        const userId = req.user.userId;
        const validatedData = validations_1.createTripSchema.parse(req.body);
        const trip = await trip_service_1.tripService.createTrip(userId, {
            name: validatedData.name,
            description: validatedData.description,
            destination: validatedData.destination,
            startDate: validatedData.startDate ? normalizeDate(validatedData.startDate, false) : undefined,
            endDate: validatedData.endDate ? normalizeDate(validatedData.endDate, true) : undefined,
            coverImage: validatedData.coverImage,
        });
        // Initialize TripTimelineUIState for the new trip
        await timeline_service_1.timelineService.upsertNeedsRefresh(trip.id);
        res.status(201).json({ data: trip });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:id - Get trip details
router.get('/trips/:id', async (req, res) => {
    try {
        const trip = await trip_service_1.tripService.getTripById(req.params.id);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        res.json({ data: trip });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/trips/:id - Update trip
router.patch('/trips/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.updateTripSchema.parse(req.body);
        const trip = await trip_service_1.tripService.updateTrip(tripId, {
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
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/trips/:id - Delete trip
router.delete('/trips/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        // Check permission (only OWNER can delete)
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await trip_service_1.tripService.deleteTrip(tripId);
        res.json({ message: 'Trip deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:id/status - Change trip status
router.post('/trips/:id/status', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        const { status } = req.body;
        if (!status) {
            res.status(400).json({ error: 'Status is required' });
            return;
        }
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const trip = await trip_service_1.tripService.changeTripStatus(tripId, status);
        res.json({ data: trip });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// GET /api/trips/:id/timeline - Get trip timeline
router.get('/trips/:id/timeline', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        const limit = req.query.limit ? Number(req.query.limit) : 50;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const timeline = await trip_service_1.tripService.getTripTimeline(tripId, limit);
        // getTripTimeline returns TimelineEvent[] — never null. Return [] if undefined for safety.
        res.json({ data: timeline ?? [] });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:id/timeline-summary - Get UI-optimized cached timeline subset
router.get('/trips/:id/timeline-summary', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        // Auth: user must be a trip member
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const prisma = await Promise.resolve().then(() => __importStar(require('@/lib/prisma'))).then(m => m.getPrisma());
        // Attempt atomic claim: set REFRESHING where needsRefresh = TRUE
        const claimed = await prisma.tripTimelineUIState.updateMany({
            where: { tripId, needsRefresh: client_1.RefreshState.TRUE },
            data: { needsRefresh: client_1.RefreshState.REFRESHING },
        });
        if (claimed.count === 1) {
            // We claimed the refresh — recalculate, fetch, and return
            await timeline_service_1.timelineService.recalculateUISubset(tripId);
            const uiState = await prisma.tripTimelineUIState.findUnique({
                where: { tripId },
            });
            let events = [];
            if (uiState?.cachedEventIds) {
                const cachedIds = JSON.parse(uiState.cachedEventIds);
                events = await prisma.timelineEvent.findMany({
                    where: { id: { in: cachedIds } },
                });
            }
            res.json({ data: events, needsRefresh: 'false' });
            return;
        }
        // No row to claim — either doesn't exist yet OR already being refreshed
        const existing = await prisma.tripTimelineUIState.findUnique({
            where: { tripId },
        });
        if (!existing) {
            // Row doesn't exist: upsert with TRUE, recalculate, return fresh
            await prisma.tripTimelineUIState.upsert({
                where: { tripId },
                update: { needsRefresh: client_1.RefreshState.TRUE },
                create: { tripId, cachedEventIds: '[]', needsRefresh: client_1.RefreshState.TRUE },
            });
            await timeline_service_1.timelineService.recalculateUISubset(tripId);
            const uiState = await prisma.tripTimelineUIState.findUnique({
                where: { tripId },
            });
            let events = [];
            if (uiState?.cachedEventIds) {
                const cachedIds = JSON.parse(uiState.cachedEventIds);
                events = await prisma.timelineEvent.findMany({
                    where: { id: { in: cachedIds } },
                });
            }
            res.json({ data: events, needsRefresh: 'false' });
            return;
        }
        // Row exists but is REFRESHING (another request claimed it) — return cached data
        let events = [];
        if (existing.cachedEventIds) {
            const cachedIds = JSON.parse(existing.cachedEventIds);
            events = await prisma.timelineEvent.findMany({
                where: { id: { in: cachedIds } },
            });
        }
        res.json({ data: events, needsRefresh: 'false' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:id/members - Get trip members
router.get('/trips/:id/members', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const members = await trip_service_1.tripService.getTripMembers(tripId);
        res.json({ data: members });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:id/members - Add member to trip (invite existing user)
router.post('/trips/:id/members', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        const { userId: newMemberId } = req.body;
        if (!newMemberId) {
            res.status(400).json({ error: 'userId is required' });
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
        const member = await trip_service_1.tripService.addTripMember(tripId, newMemberId, userId);
        res.status(201).json({ data: member });
    }
    catch (error) {
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
router.patch('/trips/:id/members/:userId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        const targetUserId = req.params.userId;
        const { role, status } = req.body;
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        if (role === 'EDITOR') {
            const canPromote = await trip_service_1.tripService.canPromoteToOrganizer(userId, tripId);
            if (!canPromote.canPromote) {
                res.status(403).json({ error: canPromote.reason });
                return;
            }
        }
        const canManage = await trip_service_1.tripService.canManageMember(userId, targetUserId, tripId);
        if (!canManage.canManage) {
            res.status(403).json({ error: canManage.reason });
            return;
        }
        const member = await trip_service_1.tripService.updateTripMember(tripId, targetUserId, {
            role: role,
            status: status,
        });
        res.json({ data: member });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/trips/:id/members/:userId - Remove member from trip
router.delete('/trips/:id/members/:userId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.id;
        const targetUserId = req.params.userId;
        if (userId === targetUserId) {
            res.status(400).json({ error: 'Cannot remove yourself from the trip' });
            return;
        }
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        const canManage = await trip_service_1.tripService.canManageMember(userId, targetUserId, tripId);
        if (!canManage.canManage) {
            res.status(403).json({ error: canManage.reason });
            return;
        }
        await trip_service_1.tripService.removeTripMember(tripId, targetUserId);
        res.json({ message: 'Member removed successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=trips.js.map