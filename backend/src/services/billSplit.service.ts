import { getPrisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification.service';
import { NotificationCategory, NotificationReferenceType } from '@prisma/client';
import { checkAndUpdateSettlementMilestones } from '@/services/settlement.service';

export class BillSplitService {
  private prisma = getPrisma();

  async createBillSplit(data: {
    tripId: string;
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    splitType: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
    paidBy: string;
    createdBy: string;
    activityId?: string;
    dueDate?: Date;
    members?: { userId: string; dollarAmount?: number; shares?: number; percentage?: number }[];
  }) {
    const tripMembers = await this.prisma.tripMember.findMany({
      where: { tripId: data.tripId, status: 'CONFIRMED' },
      select: { userId: true },
    });

    const memberIds = tripMembers.map((m) => m.userId);
    const memberCount = memberIds.length;

    if (memberCount === 0) {
      throw new Error('No members in trip');
    }

    // Calculate amounts based on split type
    let memberAmounts: { userId: string; dollarAmount: number; type: string; percentage?: number; shares?: number }[] = [];

    if (data.members && data.members.length > 0) {
      memberAmounts = data.members.map((m) => ({
        userId: m.userId,
        dollarAmount: m.dollarAmount || 0,
        type: data.splitType,
        percentage: m.percentage,
        shares: m.shares,
      }));
    } else if (data.splitType === 'EQUAL') {
      const amountPerMember = data.amount / memberCount;
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
        amount: data.amount,
        currency: data.currency || 'USD',
        splitType: data.splitType,
        paidBy: data.paidBy,
        createdBy: data.createdBy,
        activityId: data.activityId,
        dueDate: data.dueDate,
        members: {
          create: memberAmounts.map((m) => ({
            userId: m.userId,
            dollarAmount: m.dollarAmount,
            type: m.type as any,
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

    // Create timeline event
    await this.prisma.timelineEvent.create({
      data: {
        tripId: data.tripId,
        eventType: 'payment_added',
        description: `Bill split "${data.title}" was added`,
        createdBy: data.createdBy,
      },
    });

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
        await notificationService.createNotification({
          userId: member.userId,
          category: NotificationCategory.PAYMENT,
          title: 'Payment Requested',
          body: `You owe $${member.dollarAmount.toFixed(2)} for "${data.title}" (${trip?.name || 'trip'})`,
          referenceId: billSplit.id,
          referenceType: NotificationReferenceType.BILL_SPLIT,
          link: `/trip/${data.tripId}/payments`,
        });
      }
    }

    return billSplit;
  }

  async getBillSplit(id: string) {
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

  async getTripBillSplits(tripId: string) {
    return this.prisma.billSplit.findMany({
      where: { tripId },
      include: {
        members: { include: { user: { select: { id: true, name: true } } } },
        payer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBillSplit(id: string, data: {
    title?: string; description?: string; amount?: number; currency?: string;
    splitType?: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
    status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CONFIRMED' | 'CANCELLED';
    dueDate?: Date; paidBy?: string;
    members?: { userId: string; dollarAmount?: number; shares?: number; percentage?: number }[];
  }) {
    const existingBill = await this.prisma.billSplit.findUnique({
      where: { id },
      include: { members: { select: { userId: true } }, trip: { select: { name: true } } },
    });
    if (!existingBill) { throw new Error('Bill split not found'); }

    const membersChanged = !!data.members;
    const amountChanged = data.amount !== undefined;
    const affectedUserIds = data.members
      ? data.members.map((m) => m.userId)
      : existingBill.members.map((m) => m.userId);

    const updateData: any = { ...data };
    if (data.members) {
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

  async deleteBillSplit(id: string) {
    return this.prisma.billSplit.delete({
      where: { id },
    });
  }

  async markMemberAsPaid(billSplitId: string, userId: string, paymentMethod: 'VENMO' | 'PAYPAL' | 'ZELLE' | 'CASHAPP' | 'CASH' | 'OTHER', transactionId?: string) {
    const billSplitMember = await this.prisma.billSplitMember.findUnique({
      where: { billSplitId_userId: { billSplitId, userId } },
    });
    if (!billSplitMember) { throw new Error('Member not found in this bill split'); }

    const updated = await this.prisma.billSplitMember.update({
      where: { billSplitId_userId: { billSplitId, userId } },
      data: { status: 'PAID', paidAt: new Date(), paymentMethod: paymentMethod as any, transactionId },
    });

    const allMembers = await this.prisma.billSplitMember.findMany({ where: { billSplitId }, select: { status: true } });
    const allPaid = allMembers.every((m) => m.status === 'PAID' || m.status === 'CONFIRMED');
    const somePaid = allMembers.some((m) => m.status === 'PAID' || m.status === 'CONFIRMED');
    let newStatus: any = 'PENDING';
    if (allPaid) newStatus = 'CONFIRMED';
    else if (somePaid) newStatus = 'PARTIAL';

    await this.prisma.billSplit.update({ where: { id: billSplitId }, data: { status: newStatus } });

    // Get bill split info for notification
    const billSplit = await this.prisma.billSplit.findUnique({
      where: { id: billSplitId },
      include: { trip: { select: { name: true } }, payer: { select: { id: true, name: true } } },
    });

    if (billSplit) {
      // Notify payer that member marked as paid
      await notificationService.createNotification({
        userId: billSplit.paidBy,
        category: NotificationCategory.PAYMENT,
        title: 'Payment Received',
        body: `${billSplitMember.dollarAmount.toFixed(2)} payment marked as paid for "${billSplit.title}"`,
        referenceId: billSplitId,
        referenceType: NotificationReferenceType.BILL_SPLIT,
        link: `/trip/${billSplit.tripId}/payments`,
      });
    }

    return updated;
  }

  async removeMemberFromBillSplit(billSplitId: string, userId: string) {
    return this.prisma.billSplitMember.delete({
      where: {
        billSplitId_userId: {
          billSplitId,
          userId,
        },
      },
    });
  }

  async confirmPayment(billSplitId: string) {
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
      await notificationService.createNotification({
        userId: member.userId,
        category: NotificationCategory.PAYMENT,
        title: 'Payment Confirmed',
        body: `Payment for "${billSplit.title}" has been confirmed`,
        referenceId: billSplitId,
        referenceType: NotificationReferenceType.BILL_SPLIT,
        link: `/trip/${billSplit.tripId}/payments`,
      });
    }

    // Update settlement milestones and fire SETTLED notifications
    await checkAndUpdateSettlementMilestones(billSplit.tripId);

    return billSplit;
  }
}

export const billSplitService = new BillSplitService();
