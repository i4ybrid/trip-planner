import prisma from '@/lib/prisma';

export class BillSplitService {
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
    const tripMembers = await prisma.tripMember.findMany({
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
      // Use provided member amounts from frontend (for all split types)
      memberAmounts = data.members.map((m) => ({
        userId: m.userId,
        dollarAmount: m.dollarAmount || 0,
        type: data.splitType,
        percentage: m.percentage,
        shares: m.shares,
      }));
    } else if (data.splitType === 'EQUAL') {
      // Default: split equally among all trip members
      const amountPerMember = data.amount / memberCount;
      memberAmounts = memberIds.map((userId) => ({
        userId,
        dollarAmount: amountPerMember,
        type: 'EQUAL',
      }));
    }

    // Create the bill split
    const billSplit = await prisma.billSplit.create({
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
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        payer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        tripId: data.tripId,
        eventType: 'payment_added',
        description: `Bill split "${data.title}" was added`,
        createdBy: data.createdBy,
      },
    });

    return billSplit;
  }

  async getBillSplit(id: string) {
    return prisma.billSplit.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                venmo: true,
                paypal: true,
                zelle: true,
                cashapp: true,
              },
            },
          },
        },
        payer: {
          select: {
            id: true,
            name: true,
            venmo: true,
            paypal: true,
            zelle: true,
            cashapp: true,
          },
        },
        trip: {
          select: {
            id: true,
            name: true,
          },
        },
        activity: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async getTripBillSplits(tripId: string) {
    return prisma.billSplit.findMany({
      where: { tripId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        payer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateBillSplit(id: string, data: {
    title?: string;
    description?: string;
    amount?: number;
    currency?: string;
    splitType?: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
    status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CONFIRMED' | 'CANCELLED';
    dueDate?: Date;
    paidBy?: string;
    members?: { userId: string; dollarAmount?: number; shares?: number; percentage?: number }[];
  }) {
    const existingBill = await prisma.billSplit.findUnique({
      where: { id },
      select: { tripId: true },
    });

    if (!existingBill) {
      throw new Error('Bill split not found');
    }

    // Build update data
    const updateData: any = { ...data };

    // Handle members update - delete existing and create new ones
    if (data.members) {
      // Delete existing members
      await prisma.billSplitMember.deleteMany({
        where: { billSplitId: id },
      });

      // Create new members
      updateData.members = {
        create: data.members.map((m) => ({
          userId: m.userId,
          dollarAmount: m.dollarAmount || 0,
          type: data.splitType || 'EQUAL',
          percentage: m.percentage,
          shares: m.shares,
        })),
      };
    }

    return prisma.billSplit.update({
      where: { id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        payer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async deleteBillSplit(id: string) {
    return prisma.billSplit.delete({
      where: { id },
    });
  }

  async markMemberAsPaid(billSplitId: string, userId: string, paymentMethod: 'VENMO' | 'PAYPAL' | 'ZELLE' | 'CASHAPP' | 'CASH' | 'OTHER', transactionId?: string) {
    const billSplitMember = await prisma.billSplitMember.findUnique({
      where: {
        billSplitId_userId: {
          billSplitId,
          userId,
        },
      },
    });

    if (!billSplitMember) {
      throw new Error('Member not found in this bill split');
    }

    const updated = await prisma.billSplitMember.update({
      where: {
        billSplitId_userId: {
          billSplitId,
          userId,
        },
      },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        paymentMethod: paymentMethod as any,
        transactionId,
      },
    });

    // Update bill split status
    const allMembers = await prisma.billSplitMember.findMany({
      where: { billSplitId },
      select: { status: true },
    });

    const allPaid = allMembers.every((m) => m.status === 'PAID' || m.status === 'CONFIRMED');
    const somePaid = allMembers.some((m) => m.status === 'PAID' || m.status === 'CONFIRMED');

    let newStatus = 'PENDING';
    if (allPaid) {
      newStatus = 'CONFIRMED';
    } else if (somePaid) {
      newStatus = 'PARTIAL';
    }

    await prisma.billSplit.update({
      where: { id: billSplitId },
      data: { status: newStatus as any },
    });

    return updated;
  }

  async removeMemberFromBillSplit(billSplitId: string, userId: string) {
    return prisma.billSplitMember.delete({
      where: {
        billSplitId_userId: {
          billSplitId,
          userId,
        },
      },
    });
  }

  async confirmPayment(billSplitId: string) {
    return prisma.billSplit.update({
      where: { id: billSplitId },
      data: { status: 'CONFIRMED' },
    });
  }
}

export const billSplitService = new BillSplitService();
