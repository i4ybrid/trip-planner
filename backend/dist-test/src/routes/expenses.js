"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const trip_service_1 = require("@/services/trip.service");
const expense_service_1 = require("@/services/expense.service");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createExpenseSchema = zod_1.z.object({
    amount: zod_1.z.number().positive(),
    description: zod_1.z.string().min(1).max(255),
    category: zod_1.z.enum(['FOOD', 'TRANSPORT', 'LODGING', 'ACTIVITIES', 'OTHER']),
    payerId: zod_1.z.string(),
    date: zod_1.z.string().datetime().optional(),
    splitType: zod_1.z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']).default('EQUAL'),
});
const updateTripBudgetSchema = zod_1.z.object({
    budget: zod_1.z.number().min(0),
});
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /api/trips/:tripId/expenses - List all expenses for a trip
router.get('/trips/:tripId/expenses', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const expenses = await expense_service_1.expenseService.getExpensesByTripId(tripId);
        res.json({ data: expenses });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:tripId/expenses - Create a new expense
router.post('/trips/:tripId/expenses', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = createExpenseSchema.parse(req.body);
        const expense = await expense_service_1.expenseService.createExpense(tripId, {
            ...validatedData,
            date: validatedData.date ? new Date(validatedData.date) : new Date(),
        });
        res.status(201).json({ data: expense });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/trips/:tripId/expenses/:expenseId - Delete an expense
router.delete('/trips/:tripId/expenses/:expenseId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { tripId, expenseId } = req.params;
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await expense_service_1.expenseService.deleteExpense(expenseId, tripId);
        res.json({ message: 'Expense deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/trips/:tripId/budget - Update trip budget
router.patch('/trips/:tripId/budget', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId, ['OWNER']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized. Only the OWNER can set the budget.' });
            return;
        }
        const validatedData = updateTripBudgetSchema.parse(req.body);
        const trip = await trip_service_1.tripService.updateTripBudget(tripId, validatedData.budget);
        res.json({ data: trip });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=expenses.js.map