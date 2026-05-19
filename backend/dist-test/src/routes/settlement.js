"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reminder_service_1 = require("@/services/reminder.service");
const trip_service_1 = require("@/services/trip.service");
const router = (0, express_1.Router)();
// POST /trips/:tripId/settlements/remind-all
router.post('/trips/:tripId/settlements/remind-all', async (req, res) => {
    try {
        const { tripId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const perm = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!perm.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const result = await reminder_service_1.reminderService.sendBulkSettlementReminders(tripId, userId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /trips/:tripId/settlements/:userId/remind
router.post('/trips/:tripId/settlements/:userId/remind', async (req, res) => {
    try {
        const { tripId, userId: targetUserId } = req.params;
        const senderId = req.user?.userId;
        if (!senderId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const perm = await trip_service_1.tripService.checkMemberPermission(tripId, senderId, ['OWNER', 'EDITOR']);
        if (!perm.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await reminder_service_1.reminderService.sendSettlementReminder(tripId, senderId, targetUserId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=settlement.js.map