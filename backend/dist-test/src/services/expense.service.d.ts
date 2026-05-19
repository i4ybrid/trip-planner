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
    include: {
        payer: {
            select: {
                id: true;
                name: true;
                email: true;
                avatarUrl: true;
            };
        };
    };
}> {
}
declare class ExpenseService {
    getExpensesByTripId(tripId: string): Promise<ExpenseWithPayer[]>;
    createExpense(tripId: string, input: CreateExpenseInput): Promise<ExpenseWithPayer>;
    deleteExpense(expenseId: string, tripId: string): Promise<void>;
    getTotalSpent(tripId: string): Promise<number>;
}
export declare const expenseService: ExpenseService;
export {};
//# sourceMappingURL=expense.service.d.ts.map