import { Router } from 'express';
import { PaymentService } from '../services/payment.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const paymentService = new PaymentService(prisma);

// Get all expenses for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const expenses = await paymentService.getTripExpenses(req.params.tripId);
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// Create expense
router.post('/trip/:tripId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await paymentService.createExpense({
      ...req.body,
      tripId: req.params.tripId,
      paidById: userId,
    });

    // Notify trip members
    const user = await prisma.user.findUnique({ where: { id: userId } });
    await prisma.notification.createMany({
      data: [
        {
          userId,
          tripId: req.params.tripId,
          type: 'payment',
          title: 'Expense added',
          body: `${user?.name} added an expense: ${req.body.description}`,
          actionUrl: `/trip/${req.params.tripId}/payments`,
        },
      ],
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// Calculate splits for an expense (preview)
router.post('/trip/:tripId/splits', async (req, res) => {
  try {
    const splits = await paymentService.calculateSplits({
      ...req.body,
      tripId: req.params.tripId,
    });
    res.json(splits);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate splits' });
  }
});

// Get settlements for a trip
router.get('/trip/:tripId/settlements', async (req, res) => {
  try {
    const settlements = await paymentService.calculateSettlements(req.params.tripId);
    res.json(settlements);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settlements' });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await paymentService.deleteExpense(req.params.id, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Generate payment link
router.post('/payment-link', async (req, res) => {
  try {
    const { userId, amount, method } = req.body;
    
    if (!['venmo', 'paypal', 'zelle'].includes(method)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    const link = paymentService.generatePaymentLink(userId, amount, method);
    res.json({ url: link });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

export default router;
