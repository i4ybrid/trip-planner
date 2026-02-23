import { Router } from 'express';
import { PaymentService } from '../services/payment.service';
import { PrismaClient } from '@prisma/client';
import { validate, asyncHandler } from '../middleware/error-handler';
import { createExpenseSchema } from '../lib/validation-schemas';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const paymentService = new PaymentService(prisma);

// Get all expenses for a trip
router.get('/', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const expenses = await paymentService.getTripExpenses(tripId);
  res.json(expenses);
}));

// Create expense
router.post('/', validate(createExpenseSchema), asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await paymentService.createExpense({
    ...req.body,
    tripId,
    paidById: userId,
  });

  // Notify trip members
  const user = await prisma.user.findUnique({ where: { id: userId } });
  await prisma.notification.create({
    data: {
      userId,
      tripId,
      type: 'payment',
      title: 'Expense added',
      body: `${user?.name} added an expense: ${req.body.description}`,
      actionUrl: `/trip/${tripId}/payments`,
    },
  });

  res.status(201).json(result);
}));

// Calculate splits for an expense (preview)
router.post('/splits', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const splits = await paymentService.calculateSplits({
    ...req.body,
    tripId,
  });
  res.json(splits);
}));

// Get settlements for a trip
router.get('/settlements', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const settlements = await paymentService.calculateSettlements(tripId);
  res.json(settlements);
}));

// Delete expense
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await paymentService.deleteExpense(req.params.id, userId);
  res.status(204).send();
}));

// Generate payment link (not necessarily nested but okay to keep)
router.post('/payment-link', asyncHandler(async (req, res) => {
  const { userId, amount, method } = req.body;
  
  if (!['venmo', 'paypal', 'zelle'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  const link = paymentService.generatePaymentLink(userId, Number(amount), method);
  res.json({ url: link });
}));

export default router;


