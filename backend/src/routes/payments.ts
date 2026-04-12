import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { billSplitService } from '@/services/billSplit.service';
import { debtSimplifierService } from '@/services/debtSimplifier.service';
import { createBillSplitSchema, updateBillSplitSchema } from '@/lib/validations';
import { tripService } from '@/services/trip.service';
import { checkAndUpdateSettlementMilestones, getSettlementStatus } from '@/services/settlement.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/trips/:tripId/payments - Get trip bill splits
router.get('/trips/:tripId/payments', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;
    
    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    const billSplits = await billSplitService.getTripBillSplits(tripId);
    res.json({ data: billSplits });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:tripId/payments - Create bill split
router.post('/trips/:tripId/payments', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = createBillSplitSchema.parse(req.body);

    const billSplit = await billSplitService.createBillSplit({
      tripId,
      createdBy: userId,
      title: validatedData.title,
      description: validatedData.description,
      amount: validatedData.amount ?? undefined,
      currency: validatedData.currency,
      splitType: validatedData.splitType,
      paidBy: validatedData.paidBy,
      activityId: validatedData.activityId,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      members: validatedData.members,
    });

    // Auto-check settlement milestones after creating a bill split
    await checkAndUpdateSettlementMilestones(tripId);

    res.status(201).json({ data: billSplit });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/:id - Get bill split details
router.get('/payments/:id', async (req: AuthRequest, res) => {
  try {
    const billSplit = await billSplitService.getBillSplit(req.params.id);
    
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }
    
    // Check permission via trip
    const permission = await tripService.checkMemberPermission(billSplit.tripId, req.user!.userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    res.json({ data: billSplit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/payments/:id - Update bill split
router.patch('/payments/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const billSplitId = req.params.id;

    const billSplit = await billSplitService.getBillSplit(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }

    // Check permission - MASTER, ORGANIZER, or MEMBER can update (not VIEWER)
    const permission = await tripService.checkMemberPermission(billSplit.tripId, userId, ['MASTER', 'ORGANIZER', 'MEMBER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const validatedData = updateBillSplitSchema.parse(req.body);
    const updated = await billSplitService.updateBillSplit(billSplitId, {
      title: validatedData.title,
      description: validatedData.description,
      amount: validatedData.amount ?? undefined,
      currency: validatedData.currency,
      splitType: validatedData.splitType,
      status: validatedData.status,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      paidBy: validatedData.paidBy,
      members: validatedData.members,
    });

    // Auto-check settlement milestones after updating a bill split
    await checkAndUpdateSettlementMilestones(billSplit.tripId);

    res.json({ data: updated });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/payments/:id - Delete bill split
router.delete('/payments/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const billSplitId = req.params.id;
    
    const billSplit = await billSplitService.getBillSplit(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }
    
    // Check permission
    const permission = await tripService.checkMemberPermission(billSplit.tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission && billSplit.createdBy !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await billSplitService.deleteBillSplit(billSplitId);
    res.json({ message: 'Bill split deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payments/:id/members - Get members & their split amounts
router.get('/payments/:id/members', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const billSplitId = req.params.id;
    
    const billSplit = await billSplitService.getBillSplit(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }
    
    // Check permission
    const permission = await tripService.checkMemberPermission(billSplit.tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    res.json({ data: billSplit.members });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/:id/members/:userId/paid - Mark member as paid
router.post('/payments/:id/members/:userId/paid', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const billSplitId = req.params.id;
    const targetUserId = req.params.userId;
    const { paymentMethod, transactionId } = req.body;
    
    if (!paymentMethod) {
      res.status(400).json({ error: 'paymentMethod is required' });
      return;
    }
    
    // User can only mark themselves as paid
    if (userId !== targetUserId) {
      res.status(403).json({ error: 'Can only mark yourself as paid' });
      return;
    }
    
    const billSplit = await billSplitService.getBillSplit(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }
    
    const updated = await billSplitService.markMemberAsPaid(
      billSplitId,
      userId,
      paymentMethod,
      transactionId
    );
    
    // Auto-check settlement milestones after member marks themselves as paid
    await checkAndUpdateSettlementMilestones(billSplit.tripId);

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/payments/:id/members/:userId - Remove member from bill split
router.delete('/payments/:id/members/:userId', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const billSplitId = req.params.id;
    const targetUserId = req.params.userId;
    
    const billSplit = await billSplitService.getBillSplit(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }
    
    // Check permission
    const permission = await tripService.checkMemberPermission(billSplit.tripId, userId, ['MASTER', 'ORGANIZER']);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await billSplitService.removeMemberFromBillSplit(billSplitId, targetUserId);

    // Auto-check settlement milestones after removing a member
    await checkAndUpdateSettlementMilestones(billSplit.tripId);

    res.json({ message: 'Member removed from bill split' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/payments/:id/confirm - Confirm payment received
router.post('/payments/:id/confirm', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const billSplitId = req.params.id;
    
    const billSplit = await billSplitService.getBillSplit(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'Bill split not found' });
      return;
    }
    
    // Only payer can confirm
    if (billSplit.paidBy !== userId) {
      res.status(403).json({ error: 'Only the payer can confirm payment' });
      return;
    }
    
    const updated = await billSplitService.confirmPayment(billSplitId);

    // Auto-check settlement milestones after payer confirms payment
    await checkAndUpdateSettlementMilestones(billSplit.tripId);

    res.json({ data: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:tripId/settlement-status - Get per-member settlement status
router.get('/trips/:tripId/settlement-status', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const status = await getSettlementStatus(tripId);
    res.json({ data: status });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:tripId/debt-simplify - Get simplified debt settlement
router.get('/trips/:tripId/debt-simplify', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    // Check permission
    const permission = await tripService.checkMemberPermission(tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await debtSimplifierService.getSimplifiedDebts(tripId);
    res.json({ data: result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
