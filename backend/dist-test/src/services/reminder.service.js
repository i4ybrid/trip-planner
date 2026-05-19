"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reminderService = exports.ReminderService = void 0;
const prisma_1 = require("@/lib/prisma");
const notification_service_1 = require("./notification.service");
const client_1 = require("@prisma/client");
class ReminderService {
    prisma = (0, prisma_1.getPrisma)();
    async sendBulkSettlementReminders(tripId, _senderId) {
        // 1. Get all BillSplits for the trip with members
        const billSplits = await this.prisma.billSplit.findMany({
            where: { tripId },
            include: { members: true },
        });
        // 2. Find members with outstanding balances (status !== 'CONFIRMED')
        const outstandingUserIds = new Set();
        for (const bs of billSplits) {
            for (const m of bs.members) {
                if (m.status !== 'CONFIRMED') {
                    outstandingUserIds.add(m.userId);
                }
            }
        }
        // 3. Fetch trip name
        const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { name: true } });
        // 4. Create notifications
        const notified = [];
        for (const userId of outstandingUserIds) {
            await notification_service_1.notificationService.createNotification({
                userId,
                category: client_1.NotificationCategory.SETTLEMENT,
                title: 'Settlement Reminder',
                body: `You have outstanding payments for ${trip?.name || 'this trip'}. Please settle up.`,
                referenceId: tripId,
                referenceType: client_1.NotificationReferenceType.TRIP,
                link: `/trip/${tripId}/payments`,
            });
            notified.push(userId);
        }
        return { notified, skipped: [] };
    }
    async sendSettlementReminder(tripId, _senderId, targetUserId) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { name: true, tripMasterId: true },
        });
        await notification_service_1.notificationService.createNotification({
            userId: targetUserId,
            category: client_1.NotificationCategory.SETTLEMENT,
            title: 'Settlement Reminder',
            body: `You have outstanding payments for ${trip?.name || 'this trip'}. Please settle up.`,
            referenceId: tripId,
            referenceType: client_1.NotificationReferenceType.TRIP,
            link: `/trip/${tripId}/payments`,
        });
    }
}
exports.ReminderService = ReminderService;
exports.reminderService = new ReminderService();
//# sourceMappingURL=reminder.service.js.map