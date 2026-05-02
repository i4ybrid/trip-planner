import { getPrisma } from '@/lib/prisma';
import { ExpenseCategory, SplitType, Prisma } from '@prisma/client';

export interface CreateExpenseInput {
  amount: number;
  description: string;
  category: ExpenseCategory;
  payerId: string;
  date?: Date;
  splitType?: SplitType;
}

export interface ExpenseWithPayer extends Prisma.ExpenseGetPayload<{
  include: { payer: { select: { id: true; name: true; email: true; avatarUrl: true } } };
}> {}

class ExpenseService {
  async getExpensesByTripId(tripId: string): Promise<ExpenseWithPayer[]> {
    const prisma = getPrisma();
    return prisma.expense.findMany({
      where: { tripId },
      include: {
        payer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async createExpense(tripId: string, input: CreateExpenseInput): Promise<ExpenseWithPayer> {
    const prisma = getPrisma();
    return prisma.expense.create({
      data: {
        tripId,
        amount: input.amount,
        description: input.description,
        category: input.category,
        payerId: input.payerId,
        date: input.date ?? new Date(),
        splitType: input.splitType ?? SplitType.EQUAL,
      },
      include: {
        payer: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async deleteExpense(expenseId: string, tripId: string): Promise<void> {
    const prisma = getPrisma();
    await prisma.expense.deleteMany({
      where: { id: expenseId, tripId },
    });
  }

  async getTotalSpent(tripId: string): Promise<number> {
    const prisma = getPrisma();
    const result = await prisma.expense.aggregate({
      where: { tripId },
      _sum: { amount: true },
    });
    return result._sum.amount ? Number(result._sum.amount) : 0;
  }
}

export const expenseService = new ExpenseService();