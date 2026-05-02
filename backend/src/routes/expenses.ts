import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { tripService } from '@/services/trip.service';
import { expenseService } from '@/services/expense.service';
import { z } from 'zod';

const router = Router();

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(255),
  category: z.enum(['FOOD', 'TRANSPORT', 'LODGING', 'ACTIVITIES', 'OTHER']),
  payerId: z.string(),
  date: z.string().datetime().optional(),
  splitType: z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']).default('EQUAL'),
});

const updateTripBudgetSchema = z.object({
  budget: z.number().min(0),
});

// All routes require authentication
router.use(authMiddleware);

// GET /api/trips/:tripId/expenses - List all expenses for a trip
router.get('/trips/:tripId/expenses', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const expenses = await expenseService.getExpensesByTripId(tripId);
    res.json({ data: expenses });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:tripId/expenses - Create a new expense
router.post('/trips/:tripId/expenses', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    const permission = await tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = createExpenseSchema.parse(req.body);
    const expense = await expenseService.createExpense(tripId, {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : new Date(),
    });

    res.status(201).json({ data: expense });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/trips/:tripId/expenses/:expenseId - Delete an expense
router.delete('/trips/:tripId/expenses/:expenseId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { tripId, expenseId } = req.params;

    const permission = await tripService.checkMemberPermission(tripId, userId, ['OWNER', 'EDITOR']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    await expenseService.deleteExpense(expenseId, tripId);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/trips/:tripId/budget - Update trip budget
router.patch('/trips/:tripId/budget', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    const permission = await tripService.checkMemberPermission(tripId, userId, ['OWNER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized. Only the OWNER can set the budget.' });
      return;
    }

    const validatedData = updateTripBudgetSchema.parse(req.body);
    const trip = await tripService.updateTripBudget(tripId, validatedData.budget);

    res.json({ data: trip });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;