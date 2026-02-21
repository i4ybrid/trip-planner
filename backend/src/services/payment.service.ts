import { PrismaClient, TripMember } from '@prisma/client';

export type { TripMember };

export type SplitType = 'equal' | 'shares' | 'percentage' | 'custom';

export interface ExpenseInput {
  tripId: string;
  description: string;
  amount: number;
  currency?: string;
  paidById: string;
  splitType: SplitType;
  splits?: {
    userId: string;
    shares?: number;
    percentage?: number;
    amount?: number;
  }[];
  taxAmount?: number;
  tipAmount?: number;
  category?: string;
}

export interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async createExpense(input: ExpenseInput) {
    const splits = await this.calculateSplits(input);
    
    const expense = await this.prisma.booking.create({
      data: {
        tripId: input.tripId,
        bookedBy: input.paidById,
        status: 'CONFIRMED',
        notes: input.description,
      },
    });

    return { expense, splits };
  }

  async calculateSplits(input: ExpenseInput) {
    const { amount, splitType, splits, paidById, taxAmount = 0, tipAmount = 0 } = input;
    const totalAmount = Number(amount) + Number(taxAmount) + Number(tipAmount);
    
    const members = await this.prisma.tripMember.findMany({
      where: { tripId: input.tripId, status: 'CONFIRMED' },
    });

    const memberIds = members.map(m => m.userId);

    switch (splitType) {
      case 'equal': {
        const perPerson = totalAmount / memberIds.length;
        return memberIds.map(userId => ({
          userId,
          amount: Math.round(perPerson * 100) / 100,
          isPaid: userId === paidById,
        }));
      }

      case 'shares': {
        const totalShares = splits?.reduce((sum, s) => sum + (s.shares || 1), 0) || memberIds.length;
        return memberIds.map(userId => {
          const split = splits?.find(s => s.userId === userId);
          const shares = split?.shares || 1;
          const amount = (totalAmount * shares) / totalShares;
          return {
            userId,
            amount: Math.round(amount * 100) / 100,
            isPaid: userId === paidById,
          };
        });
      }

      case 'percentage': {
        return memberIds.map(userId => {
          const split = splits?.find(s => s.userId === userId);
          const percentage = split?.percentage || (100 / memberIds.length);
          const amount = (totalAmount * percentage) / 100;
          return {
            userId,
            amount: Math.round(amount * 100) / 100,
            isPaid: userId === paidById,
          };
        });
      }

      case 'custom': {
        return memberIds.map(userId => {
          const split = splits?.find(s => s.userId === userId);
          return {
            userId,
            amount: split?.amount || 0,
            isPaid: userId === paidById,
          };
        });
      }

      default:
        throw new Error('Invalid split type');
    }
  }

  async calculateSettlements(tripId: string): Promise<Settlement[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { tripId, status: 'CONFIRMED' },
    });

    const balances: Record<string, number> = {};

    for (const booking of bookings) {
      if (!balances[booking.bookedBy]) {
        balances[booking.bookedBy] = 0;
      }
      balances[booking.bookedBy] += Number(booking.notes ? parseFloat(booking.notes.replace(/[^0-9.-]/g, '')) || 0 : 0);
    }

    const members = await this.prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' },
    });

    const memberCount = members.length;
    const equalShare = Object.values(balances).reduce((a, b) => a + b, 0) / memberCount;

    for (const member of members) {
      if (!balances[member.userId]) {
        balances[member.userId] = 0;
      }
      balances[member.userId] -= equalShare;
    }

    const settlements: Settlement[] = [];
    const debtors = Object.entries(balances)
      .filter(([, balance]) => balance < 0)
      .sort((a, b) => a[1] - b[1]);
    const creditors = Object.entries(balances)
      .filter(([, balance]) => balance > 0)
      .sort((a, b) => b[1] - a[1]);

    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const [debtor, debt] = debtors[i];
      const [creditor, credit] = creditors[j];
      const amount = Math.min(-debt, credit);

      if (amount > 0.01) {
        settlements.push({
          fromUserId: debtor,
          toUserId: creditor,
          amount: Math.round(amount * 100) / 100,
        });
      }

      debtors[i][1] = Number(debtors[i][1]) + amount;
      creditors[j][1] = Number(creditors[j][1]) - amount;

      if (Math.abs(debtors[i][1]) < 0.01) i++;
      if (creditors[j][1] < 0.01) j++;
    }

    return settlements;
  }

  async getTripExpenses(tripId: string) {
    return this.prisma.booking.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
      include: {
        trip: true,
      },
    });
  }

  async deleteExpense(expenseId: string, userId: string) {
    const expense = await this.prisma.booking.findUnique({
      where: { id: expenseId },
    });

    if (!expense) {
      throw new Error('Expense not found');
    }

    if (expense.bookedBy !== userId) {
      throw new Error('Not authorized to delete this expense');
    }

    await this.prisma.booking.delete({
      where: { id: expenseId },
    });
  }

  generatePaymentLink(userId: string, amount: number, method: 'venmo' | 'paypal' | 'zelle'): string {
    const baseLinks: Record<string, string> = {
      venmo: `https://venmo.com/`,
      paypal: `https://paypal.me/`,
      zelle: `https://sendzelle.com/`,
    };

    return `${baseLinks[method]}${userId}?amount=${amount}`;
  }
}
