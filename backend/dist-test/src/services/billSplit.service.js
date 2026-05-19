"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.billSplitService = exports.BillSplitService = void 0;
const prisma_1 = require("@/lib/prisma");
const notification_service_1 = require("@/services/notification.service");
const client_1 = require("@prisma/client");
const timeline_service_1 = require("@/services/timeline.service");
const settlement_service_1 = require("@/services/settlement.service");
class BillSplitService {
    prisma = (0, prisma_1.getPrisma)();
    async createBillSplit(data) {
        // Auto-calculate amount from members if not provided
        if (data.amount === undefined) {
            if (data.members && data.members.length > 0) {
                data.amount = data.members.reduce((sum, m) => sum + (m.dollarAmount || 0) * (m.shares || 1), 0);
            }
            else {
                data.amount = 0;
            }
        }
        const tripMembers = await this.prisma.tripMember.findMany({
            where: { tripId: data.tripId, status: 'CONFIRMED' },
            select: { userId: true },
        });
        const memberIds = tripMembers.map((m) => m.userId);
        const memberCount = memberIds.length;
        if (memberCount === 0) {
            throw new Error('No members in trip');
        }
        // Calculate amounts based on split type and cost type
        let memberAmounts = [];
        if (data.costType === 'FIXED') {
            // Fixed cost: only the payer owes the full amount, everyone else owes $0
            memberAmounts = memberIds.map((userId) => ({
                userId,
                dollarAmount: userId === data.paidBy ? (data.amount || 0) : 0,
                type: data.splitType,
            }));
        }
        else if (data.members && data.members.length > 0) {
            memberAmounts = data.members.map((m) => ({
                userId: m.userId,
                dollarAmount: m.dollarAmount || 0,
                type: data.splitType,
                percentage: m.percentage,
                shares: m.shares,
            }));
        }
        else if (data.splitType === 'EQUAL') {
            const amountPerMember = (data.amount || 0) / memberCount;
            memberAmounts = memberIds.map((userId) => ({
                userId,
                dollarAmount: amountPerMember,
                type: 'EQUAL',
            }));
        }
        // Get trip name for notifications
        const trip = await this.prisma.trip.findUnique({
            where: { id: data.tripId },
            select: { name: true },
        });
        // Create the bill split
        const billSplit = await this.prisma.billSplit.create({
            data: {
                tripId: data.tripId,
                title: data.title,
                description: data.description,
                amount: data.amount || 0,
                currency: data.currency || 'USD',
                splitType: data.splitType,
                costType: data.costType || 'PER_PERSON',
                paidBy: data.paidBy,
                createdBy: data.createdBy,
                activityId: data.activityId,
                dueDate: data.dueDate,
                members: {
                    create: memberAmounts.map((m) => ({
                        userId: m.userId,
                        dollarAmount: m.dollarAmount,
                        type: m.type,
                        percentage: m.percentage,
                        shares: m.shares,
                    })),
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, avatarUrl: true } },
                    },
                },
                payer: { select: { id: true, name: true } },
            },
        });
        // Build rich description using already-available payer name
        const payerName = billSplit.payer?.name || data.paidBy;
        const formattedAmount = `$${Number(data.amount).toFixed(2)}`;
        const description = `${payerName} added an expense: ${data.title} (${formattedAmount})`;
        // Emit payment_added timeline event
        await timeline_service_1.timelineService.emitTimelineEvent({
            tripId: data.tripId,
            eventType: 'payment_added',
            actorId: data.paidBy, // person who paid
            description,
            metadata: {
                billSplitId: billSplit.id,
                amount: data.amount || 0,
                currency: data.currency || 'USD',
                paidByUserId: data.paidBy,
                activityId: data.activityId || undefined,
            },
            effectiveDate: new Date(),
        });
        // Signal UI refresh
        await timeline_service_1.timelineService.upsertNeedsRefresh(data.tripId);
        // Reset settlement milestone completions for all members
        const newMemberUserIds = memberAmounts.map((m) => m.userId);
        const settlementDueMilestone = await this.prisma.milestone.findFirst({
            where: { tripId: data.tripId, type: 'SETTLEMENT_DUE' },
        });
        const settlementCompleteMilestone = await this.prisma.milestone.findFirst({
            where: { tripId: data.tripId, type: 'SETTLEMENT_COMPLETE' },
        });
        if (settlementDueMilestone) {
            await this.prisma.milestoneCompletion.deleteMany({
                where: { milestoneId: settlementDueMilestone.id, userId: { in: newMemberUserIds } },
            });
        }
        if (settlementCompleteMilestone) {
            await this.prisma.milestoneCompletion.deleteMany({
                where: { milestoneId: settlementCompleteMilestone.id, userId: { in: newMemberUserIds } },
            });
        }
        // Notify members about payment request (exclude the payer)
        for (const member of billSplit.members) {
            if (member.userId !== data.paidBy) {
                await notification_service_1.notificationService.createNotification({
                    userId: member.userId,
                    category: client_1.NotificationCategory.PAYMENT,
                    title: 'Payment Requested',
                    body: `You owe $${member.dollarAmount.toFixed(2)} for "${data.title}" (${trip?.name || 'trip'})`,
                    referenceId: billSplit.id,
                    referenceType: client_1.NotificationReferenceType.BILL_SPLIT,
                    link: `/trip/${data.tripId}/payments`,
                });
            }
        }
        return billSplit;
    }
    async getBillSplit(id) {
        return this.prisma.billSplit.findUnique({
            where: { id },
            include: {
                members: { include: { user: { select: { id: true, name: true, avatarUrl: true, venmo: true, paypal: true, zelle: true, cashapp: true } } } },
                payer: { select: { id: true, name: true, venmo: true, paypal: true, zelle: true, cashapp: true } },
                trip: { select: { id: true, name: true } },
                activity: { select: { id: true, title: true } },
            },
        });
    }
    async getTripBillSplits(tripId) {
        return this.prisma.billSplit.findMany({
            where: { tripId },
            include: {
                members: { include: { user: { select: { id: true, name: true } } } },
                payer: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateBillSplit(id, data) {
        const existingBill = await this.prisma.billSplit.findUnique({
            where: { id },
            include: { members: { select: { userId: true } }, trip: { select: { name: true } } },
        });
        if (!existingBill) {
            throw new Error('Bill split not found');
        }
        const membersChanged = !!data.members;
        const amountChanged = data.amount !== undefined;
        const affectedUserIds = data.members
            ? data.members.map((m) => m.userId)
            : existingBill.members.map((m) => m.userId);
        const updateData = { ...data };
        // Handle FIXED cost type: recalculate member amounts so only the payer owes the full amount
        if (data.costType === 'FIXED' && data.paidBy) {
            const amount = data.amount !== undefined ? data.amount : existingBill.amount.toNumber();
            if (data.members) {
                // Override member amounts based on FIXED cost type
                updateData.members = {
                    create: data.members.map((m) => ({
                        userId: m.userId,
                        dollarAmount: m.userId === data.paidBy ? amount : 0,
                        type: data.splitType || 'EQUAL',
                        percentage: m.percentage,
                        shares: m.shares,
                    })),
                };
            }
            else {
                // Recalculate existing members for FIXED cost type
                const existingMemberIds = existingBill.members.map((m) => m.userId);
                await this.prisma.billSplitMember.deleteMany({ where: { billSplitId: id } });
                updateData.members = {
                    create: existingMemberIds.map((userId) => ({
                        userId,
                        dollarAmount: userId === data.paidBy ? amount : 0,
                        type: data.splitType || 'EQUAL',
                    })),
                };
            }
        }
        else if (data.members) {
            await this.prisma.billSplitMember.deleteMany({ where: { billSplitId: id } });
            updateData.members = {
                create: data.members.map((m) => ({
                    userId: m.userId,
                    dollarAmount: m.dollarAmount || 0,
                    type: data.splitType || 'EQUAL',
                    percentage: m.percentage, shares: m.shares,
                })),
            };
        }
        const updatedBill = await this.prisma.billSplit.update({
            where: { id },
            data: updateData,
            include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } }, payer: { select: { id: true, name: true } } },
        });
        if (membersChanged || amountChanged) {
            const settlementDueMilestone = await this.prisma.milestone.findFirst({ where: { tripId: existingBill.tripId, type: 'SETTLEMENT_DUE' } });
            const settlementCompleteMilestone = await this.prisma.milestone.findFirst({ where: { tripId: existingBill.tripId, type: 'SETTLEMENT_COMPLETE' } });
            if (settlementDueMilestone) {
                await this.prisma.milestoneCompletion.deleteMany({ where: { milestoneId: settlementDueMilestone.id, userId: { in: affectedUserIds } } });
            }
            if (settlementCompleteMilestone) {
                await this.prisma.milestoneCompletion.deleteMany({ where: { milestoneId: settlementCompleteMilestone.id, userId: { in: affectedUserIds } } });
            }
        }
        return updatedBill;
    }
    async deleteBillSplit(id) {
        return this.prisma.billSplit.delete({
            where: { id },
        });
    }
    async markMemberAsPaid(billSplitId, userId, paymentMethod, transactionId) {
        const billSplitMember = await this.prisma.billSplitMember.findUnique({
            where: { billSplitId_userId: { billSplitId, userId } },
            include: { user: { select: { name: true } }, billSplit: { select: { title: true, tripId: true } } },
        });
        if (!billSplitMember) {
            throw new Error('Member not found in this bill split');
        }
        const updated = await this.prisma.billSplitMember.update({
            where: { billSplitId_userId: { billSplitId, userId } },
            data: { status: 'PAID', paidAt: new Date(), paymentMethod: paymentMethod, transactionId },
        });
        const allMembers = await this.prisma.billSplitMember.findMany({ where: { billSplitId }, select: { status: true } });
        const allPaid = allMembers.every((m) => m.status === 'PAID' || m.status === 'CONFIRMED');
        const somePaid = allMembers.some((m) => m.status === 'PAID' || m.status === 'CONFIRMED');
        let newStatus = 'PENDING';
        if (allPaid)
            newStatus = 'CONFIRMED';
        else if (somePaid)
            newStatus = 'PARTIAL';
        await this.prisma.billSplit.update({ where: { id: billSplitId }, data: { status: newStatus } });
        // Get bill split info for notification
        const billSplit = await this.prisma.billSplit.findUnique({
            where: { id: billSplitId },
            include: { trip: { select: { name: true } }, payer: { select: { id: true, name: true } } },
        });
        if (billSplit) {
            // Notify payer that member marked as paid
            await notification_service_1.notificationService.createNotification({
                userId: billSplit.paidBy,
                category: client_1.NotificationCategory.PAYMENT,
                title: 'Payment Received',
                body: `${billSplitMember.dollarAmount.toFixed(2)} payment marked as paid for "${billSplit.title}"`,
                referenceId: billSplitId,
                referenceType: client_1.NotificationReferenceType.BILL_SPLIT,
                link: `/trip/${billSplit.tripId}/payments`,
            });
        }
        // Emit member_paid timeline event
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId: billSplitMember.billSplit.tripId,
                eventType: 'member_paid',
                description: `${billSplitMember.user.name} paid their share for "${billSplitMember.billSplit.title}"`,
                actorId: userId,
            });
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        return updated;
    }
    async removeMemberFromBillSplit(billSplitId, userId) {
        return this.prisma.billSplitMember.delete({
            where: {
                billSplitId_userId: {
                    billSplitId,
                    userId,
                },
            },
        });
    }
    async confirmPayment(billSplitId) {
        await this.prisma.billSplitMember.updateMany({
            where: { billSplitId, status: 'PAID' },
            data: { status: 'CONFIRMED' },
        });
        const billSplit = await this.prisma.billSplit.update({
            where: { id: billSplitId },
            data: { status: 'CONFIRMED' },
            include: { trip: true, members: true },
        });
        // Notify all members that payment is confirmed
        for (const member of billSplit.members) {
            await notification_service_1.notificationService.createNotification({
                userId: member.userId,
                category: client_1.NotificationCategory.PAYMENT,
                title: 'Payment Confirmed',
                body: `Payment for "${billSplit.title}" has been confirmed`,
                referenceId: billSplitId,
                referenceType: client_1.NotificationReferenceType.BILL_SPLIT,
                link: `/trip/${billSplit.tripId}/payments`,
            });
        }
        // Update settlement milestones and fire SETTLED notifications
        await (0, settlement_service_1.checkAndUpdateSettlementMilestones)(billSplit.tripId);
        return billSplit;
    }
}
exports.BillSplitService = BillSplitService;
exports.billSplitService = new BillSplitService();
//# sourceMappingURL=billSplit.service.js.map