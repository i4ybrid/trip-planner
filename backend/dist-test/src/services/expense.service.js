"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseService = void 0;
const prisma_1 = require("@/lib/prisma");
const client_1 = require("@prisma/client");
class ExpenseService {
    async getExpensesByTripId(tripId) {
        const prisma = (0, prisma_1.getPrisma)();
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
    async createExpense(tripId, input) {
        const prisma = (0, prisma_1.getPrisma)();
        return prisma.expense.create({
            data: {
                tripId,
                amount: input.amount,
                description: input.description,
                category: input.category,
                payerId: input.payerId,
                date: input.date ?? new Date(),
                splitType: input.splitType ?? client_1.SplitType.EQUAL,
            },
            include: {
                payer: {
                    select: { id: true, name: true, email: true, avatarUrl: true },
                },
            },
        });
    }
    async deleteExpense(expenseId, tripId) {
        const prisma = (0, prisma_1.getPrisma)();
        await prisma.expense.deleteMany({
            where: { id: expenseId, tripId },
        });
    }
    async getTotalSpent(tripId) {
        const prisma = (0, prisma_1.getPrisma)();
        const result = await prisma.expense.aggregate({
            where: { tripId },
            _sum: { amount: true },
        });
        return result._sum.amount ? Number(result._sum.amount) : 0;
    }
}
exports.expenseService = new ExpenseService();
//# sourceMappingURL=expense.service.js.map