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
const milestone_service_1 = require("@/services/milestone.service");
const trip_service_1 = require("@/services/trip.service");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /api/trips/:id/milestones - List milestones for trip
router.get('/trips/:id/milestones', async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.userId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const milestones = await milestone_service_1.milestoneService.getMilestonesWithProgress(tripId);
        res.json({ data: milestones });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:id/milestones - Create custom milestone
router.post('/trips/:id/milestones', async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.userId;
        // Check permission (only OWNER and EDITOR can create milestones)
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const { name, type, dueDate, isHard, priority } = req.body;
        if (!name || !type || !dueDate) {
            res.status(400).json({ error: 'Name, type, and dueDate are required' });
            return;
        }
        const milestone = await milestone_service_1.milestoneService.createCustomMilestone(tripId, {
            name,
            type,
            dueDate: new Date(dueDate),
            isHard,
            priority,
        });
        res.status(201).json({ data: milestone });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/milestones/:id - Update milestone (date, lock, skip)
router.patch('/milestones/:id', async (req, res) => {
    try {
        const milestoneId = req.params.id;
        const userId = req.user.userId;
        // Get milestone to find tripId
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('@/lib/prisma')));
        const existingMilestone = await prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: { trip: true },
        });
        if (!existingMilestone) {
            res.status(404).json({ error: 'Milestone not found' });
            return;
        }
        const tripId = existingMilestone.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const { dueDate, isLocked, isSkipped, isHard, name } = req.body;
        const updated = await milestone_service_1.milestoneService.updateMilestone(milestoneId, {
            dueDate: dueDate ? new Date(dueDate) : undefined,
            isLocked,
            isSkipped,
            isHard,
            name,
        });
        res.json({ data: updated });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/milestones/:id - Delete a milestone
router.delete('/milestones/:id', async (req, res) => {
    try {
        const milestoneId = req.params.id;
        const userId = req.user.userId;
        // Get milestone to find tripId
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('@/lib/prisma')));
        const existingMilestone = await prisma.milestone.findUnique({
            where: { id: milestoneId },
            include: { trip: true },
        });
        if (!existingMilestone) {
            res.status(404).json({ error: 'Milestone not found' });
            return;
        }
        const tripId = existingMilestone.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await milestone_service_1.milestoneService.deleteMilestone(milestoneId);
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:id/milestones/actions - Trigger on-demand action
router.post('/trips/:id/milestones/actions', async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.userId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const { actionType, recipientIds } = req.body;
        if (!actionType || !recipientIds || !Array.isArray(recipientIds)) {
            res.status(400).json({ error: 'actionType and recipientIds array are required' });
            return;
        }
        // PAYMENT_REQUEST and SETTLEMENT_REMINDER action types are no longer supported
        res.status(400).json({ error: 'Invalid actionType. Settlement reminders are now sent via the Payments tab.' });
        return;
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:id/milestones/progress - Get completion progress per member
router.get('/trips/:id/milestones/progress', async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.userId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const progress = await milestone_service_1.milestoneService.getMilestoneProgress(tripId);
        res.json({ data: progress });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/milestones/:id/completions/:userId - Mark milestone complete/skipped
router.patch('/milestones/:id/completions/:userId', async (req, res) => {
    try {
        const milestoneId = req.params.id;
        const targetUserId = req.params.userId;
        const userId = req.user.userId;
        // Get milestone to find tripId
        const { default: prisma } = await Promise.resolve().then(() => __importStar(require('@/lib/prisma')));
        const existingMilestone = await prisma.milestone.findUnique({
            where: { id: milestoneId },
        });
        if (!existingMilestone) {
            res.status(404).json({ error: 'Milestone not found' });
            return;
        }
        const tripId = existingMilestone.tripId;
        // Check permission (either the user themselves or organizer/master)
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        const isSelf = userId === targetUserId;
        if (!permission.hasPermission && !isSelf) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const { status, note } = req.body;
        if (!status || !['PENDING', 'COMPLETED', 'SKIPPED', 'OVERDUE'].includes(status)) {
            res.status(400).json({ error: 'Valid status is required' });
            return;
        }
        const completion = await milestone_service_1.milestoneService.updateMilestoneCompletion(milestoneId, targetUserId, status, note);
        res.json({ data: completion });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:id/milestones/generate-default - Generate default milestones from TODAY baseline
router.post('/trips/:id/milestones/generate-default', async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.userId;
        // Check permission (only OWNER and EDITOR)
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        if (!trip.startDate) {
            res.status(400).json({ error: 'Trip must have a start date to generate milestones' });
            return;
        }
        const milestones = await milestone_service_1.milestoneService.generateDefaultMilestonesFromToday(tripId, trip.startDate, trip.endDate || trip.startDate);
        res.status(201).json({ data: milestones });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:id/milestones/regenerate - Manually regenerate milestones
router.post('/trips/:id/milestones/regenerate', async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.userId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const trip = await trip_service_1.tripService.getTripById(tripId);
        if (!trip) {
            res.status(404).json({ error: 'Trip not found' });
            return;
        }
        if (!trip.startDate) {
            res.status(400).json({ error: 'Trip must have a start date to generate milestones' });
            return;
        }
        await milestone_service_1.milestoneService.generateIdeaMilestones(tripId, trip.startDate);
        const milestones = await milestone_service_1.milestoneService.getMilestonesWithProgress(tripId);
        res.json({ data: milestones });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=milestones.js.map