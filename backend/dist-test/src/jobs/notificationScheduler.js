"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startNotificationScheduler = startNotificationScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const prisma_1 = require("@/lib/prisma");
const notification_service_1 = require("@/services/notification.service");
const client_1 = require("@prisma/client");
const prisma = (0, prisma_1.getPrisma)();
/**
 * Notification Scheduler - runs cron jobs for milestone/settlement notifications
 *
 * Schedule:
 * - Every 15 minutes: Milestone due/overdue check
 * - Every 15 minutes: Milestone reminder check
 * - Daily at 8 AM: Settlement due check
 */
function startNotificationScheduler() {
    // Every 15 minutes: check milestone due/overdue
    node_cron_1.default.schedule('*/15 * * * *', async () => {
        await checkMilestoneDue();
        await checkMilestoneOverdue();
    });
    // Every 15 minutes: check milestone reminders
    node_cron_1.default.schedule('*/15 * * * *', async () => {
        await checkMilestoneReminders();
    });
    // Daily at 8 AM UTC: check settlement due
    node_cron_1.default.schedule('0 8 * * *', async () => {
        await checkSettlementDue();
    });
    console.log('[NotificationScheduler] Started');
}
async function checkMilestoneDue() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    try {
        const milestones = await prisma.milestone.findMany({
            where: {
                dueDate: { gte: today, lt: tomorrow },
                isSkipped: false,
                isLocked: false,
            },
            include: {
                trip: {
                    include: {
                        members: {
                            where: { status: 'CONFIRMED' },
                            select: { userId: true },
                        },
                    },
                },
            },
        });
        for (const milestone of milestones) {
            // Notify ALL confirmed trip members, not just those with PENDING completions
            const memberIds = milestone.trip.members.map((m) => m.userId);
            for (const userId of memberIds) {
                await notification_service_1.notificationService.createNotification({
                    userId,
                    category: client_1.NotificationCategory.MILESTONE,
                    title: 'Milestone Due Today',
                    body: `"${milestone.name}" for ${milestone.trip.name} is due today`,
                    referenceId: milestone.id,
                    referenceType: client_1.NotificationReferenceType.MILESTONE,
                    link: `/trip/${milestone.trip.id}`,
                });
            }
        }
        console.log(`[NotificationScheduler] Milestone due check: ${milestones.length} milestones`);
    }
    catch (error) {
        console.error('[NotificationScheduler] Error in milestone due check:', error);
    }
}
async function checkMilestoneOverdue() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    try {
        const milestones = await prisma.milestone.findMany({
            where: {
                dueDate: { lt: yesterday },
                isSkipped: false,
                isLocked: false,
                OR: [
                    { firstOverdueNotifiedAt: null },
                    { firstOverdueNotifiedAt: { lt: yesterday } },
                ],
            },
            include: {
                trip: {
                    include: {
                        members: {
                            where: { status: 'CONFIRMED' },
                            select: { userId: true },
                        },
                    },
                },
            },
        });
        for (const milestone of milestones) {
            // Update firstOverdueNotifiedAt if not set yet
            if (!milestone.firstOverdueNotifiedAt) {
                await prisma.milestone.update({
                    where: { id: milestone.id },
                    data: { firstOverdueNotifiedAt: new Date() },
                }).catch(() => { });
            }
            // Notify ALL confirmed trip members
            const memberIds = milestone.trip.members.map((m) => m.userId);
            for (const userId of memberIds) {
                await notification_service_1.notificationService.createNotification({
                    userId,
                    category: client_1.NotificationCategory.MILESTONE,
                    title: 'Milestone Overdue',
                    body: `"${milestone.name}" for ${milestone.trip.name} is overdue`,
                    referenceId: milestone.id,
                    referenceType: client_1.NotificationReferenceType.MILESTONE,
                    link: `/trip/${milestone.trip.id}`,
                });
            }
        }
        console.log(`[NotificationScheduler] Milestone overdue check: ${milestones.length} milestones`);
    }
    catch (error) {
        console.error('[NotificationScheduler] Error in milestone overdue check:', error);
    }
}
async function checkMilestoneReminders() {
    const now = new Date();
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    try {
        const milestones = await prisma.milestone.findMany({
            where: {
                reminderAt: { gte: now, lte: inOneHour },
                isSkipped: false,
                isLocked: false,
            },
            include: {
                trip: {
                    include: {
                        members: {
                            where: { status: 'CONFIRMED' },
                            select: { userId: true },
                        },
                    },
                },
            },
        });
        for (const milestone of milestones) {
            // Notify ALL confirmed trip members
            const memberIds = milestone.trip.members.map((m) => m.userId);
            for (const userId of memberIds) {
                await notification_service_1.notificationService.createNotification({
                    userId,
                    category: client_1.NotificationCategory.MILESTONE,
                    title: 'Milestone Reminder',
                    body: `"${milestone.name}" for ${milestone.trip.name} is due soon`,
                    referenceId: milestone.id,
                    referenceType: client_1.NotificationReferenceType.MILESTONE,
                    link: `/trip/${milestone.trip.id}`,
                });
            }
        }
        console.log(`[NotificationScheduler] Milestone reminder check: ${milestones.length} milestones`);
    }
    catch (error) {
        console.error('[NotificationScheduler] Error in milestone reminder check:', error);
    }
}
async function checkSettlementDue() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    try {
        const settlements = await prisma.settlement.findMany({
            where: {
                dueDate: { lte: yesterday },
                status: { not: 'PAID' },
            },
            include: {
                trip: {
                    include: {
                        members: {
                            where: { status: 'CONFIRMED' },
                            select: { userId: true },
                        },
                    },
                },
            },
        });
        for (const settlement of settlements) {
            // Mark as overdue if not already
            if (settlement.status !== 'OVERDUE') {
                await prisma.settlement.update({
                    where: { id: settlement.id },
                    data: { status: 'OVERDUE' },
                }).catch(() => { });
            }
            // Notify ALL confirmed trip members
            const memberIds = settlement.trip.members.map((m) => m.userId);
            for (const userId of memberIds) {
                await notification_service_1.notificationService.createNotification({
                    userId,
                    category: client_1.NotificationCategory.SETTLEMENT,
                    title: 'Settlement Overdue',
                    body: `"${settlement.title}" for ${settlement.trip.name} is overdue`,
                    referenceId: settlement.id,
                    referenceType: client_1.NotificationReferenceType.SETTLEMENT,
                    link: `/trip/${settlement.tripId}/payments`,
                });
            }
        }
        console.log(`[NotificationScheduler] Settlement due check: ${settlements.length} settlements`);
    }
    catch (error) {
        console.error('[NotificationScheduler] Error in settlement due check:', error);
    }
}
//# sourceMappingURL=notificationScheduler.js.map