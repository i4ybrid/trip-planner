"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMemberIsSettled = checkMemberIsSettled;
exports.checkAndUpdateSettlementMilestones = checkAndUpdateSettlementMilestones;
exports.getSettlementStatus = getSettlementStatus;
const prisma_1 = require("@/lib/prisma");
const notification_service_1 = require("@/services/notification.service");
const client_1 = require("@prisma/client");
/**
 * Check if a specific member is "settled" — meaning:
 * - For every BillSplit in the trip, this member's entry has status PAID or CONFIRMED
 * - AND every BillSplit itself has status CONFIRMED (payer confirmed receipt)
 */
function checkMemberIsSettled(userId, billSplits) {
    for (const bs of billSplits) {
        // If the bill split itself isn't confirmed yet, member can't be fully settled
        if (bs.status !== 'CONFIRMED') {
            return false;
        }
        const memberEntry = bs.members.find(m => m.userId === userId);
        if (!memberEntry) {
            // Member not part of this split — skip (they owe nothing here)
            continue;
        }
        if (memberEntry.status !== 'PAID' && memberEntry.status !== 'CONFIRMED') {
            return false;
        }
    }
    return true;
}
/**
 * Auto-complete settlement milestones based on current payment state:
 * - SETTLEMENT_DUE: auto-completes for each member who is fully settled
 * - SETTLEMENT_COMPLETE: auto-completes for ALL members when everyone is settled
 */
async function checkAndUpdateSettlementMilestones(tripId) {
    const prisma = (0, prisma_1.getPrisma)();
    // Get all confirmed trip members
    const tripMembers = await prisma.tripMember.findMany({
        where: { tripId, status: 'CONFIRMED' },
        include: { user: true },
    });
    if (tripMembers.length === 0)
        return;
    // Get all bill splits with members
    const billSplits = await prisma.billSplit.findMany({
        where: { tripId },
        include: { members: true },
    });
    // Find the SETTLEMENT_DUE and SETTLEMENT_COMPLETE milestones for this trip
    const settlementDueMilestone = await prisma.milestone.findFirst({
        where: { tripId, type: 'SETTLEMENT_DUE' },
    });
    const settlementCompleteMilestone = await prisma.milestone.findFirst({
        where: { tripId, type: 'SETTLEMENT_COMPLETE' },
    });
    // Process each member's settlement status
    for (const member of tripMembers) {
        const isSettled = checkMemberIsSettled(member.userId, billSplits);
        if (isSettled && settlementDueMilestone) {
            const existing = await prisma.milestoneCompletion.findUnique({
                where: { milestoneId_userId: { milestoneId: settlementDueMilestone.id, userId: member.userId } },
            });
            await prisma.milestoneCompletion.upsert({
                where: {
                    milestoneId_userId: {
                        milestoneId: settlementDueMilestone.id,
                        userId: member.userId,
                    },
                },
                create: {
                    milestoneId: settlementDueMilestone.id,
                    userId: member.userId,
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
                update: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
            // Fire SETTLED notification the first time this member becomes settled
            if (!existing || existing.status !== 'COMPLETED') {
                const trip = await prisma.trip.findUnique({
                    where: { id: tripId },
                    select: { name: true },
                });
                await notification_service_1.notificationService.createNotification({
                    userId: member.userId,
                    category: client_1.NotificationCategory.SETTLEMENT,
                    title: 'Settled',
                    body: `All your balances for "${trip?.name}" have been settled`,
                    referenceId: tripId,
                    referenceType: client_1.NotificationReferenceType.TRIP,
                    link: `/trip/${tripId}/payments`,
                });
            }
        }
    }
    // Check if ALL members are settled → activate SETTLEMENT_COMPLETE
    const allSettled = tripMembers.every(m => checkMemberIsSettled(m.userId, billSplits));
    if (allSettled && settlementCompleteMilestone) {
        for (const member of tripMembers) {
            await prisma.milestoneCompletion.upsert({
                where: {
                    milestoneId_userId: {
                        milestoneId: settlementCompleteMilestone.id,
                        userId: member.userId,
                    },
                },
                create: {
                    milestoneId: settlementCompleteMilestone.id,
                    userId: member.userId,
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
                update: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
        }
    }
}
/**
 * Get per-member settlement status for a trip (used by GET /api/trips/:id/settlement-status)
 */
async function getSettlementStatus(tripId) {
    const prisma = (0, prisma_1.getPrisma)();
    const tripMembers = await prisma.tripMember.findMany({
        where: { tripId, status: 'CONFIRMED' },
        include: { user: true },
    });
    const billSplits = await prisma.billSplit.findMany({
        where: { tripId },
        include: { members: true },
    });
    const memberStatuses = tripMembers.map(m => ({
        userId: m.userId,
        isSettled: checkMemberIsSettled(m.userId, billSplits),
    }));
    const allSettled = tripMembers.length > 0 && memberStatuses.every(s => s.isSettled);
    return { members: memberStatuses, allSettled };
}
//# sourceMappingURL=settlement.service.js.map