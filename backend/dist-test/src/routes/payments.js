"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("@/middleware/auth");
const billSplit_service_1 = require("@/services/billSplit.service");
const debtSimplifier_service_1 = require("@/services/debtSimplifier.service");
const validations_1 = require("@/lib/validations");
const trip_service_1 = require("@/services/trip.service");
const settlement_service_1 = require("@/services/settlement.service");
const payment_service_1 = require("@/services/payment.service");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authMiddleware);
// GET /api/trips/:tripId/payments - Get trip bill splits
router.get('/trips/:tripId/payments', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const billSplits = await billSplit_service_1.billSplitService.getTripBillSplits(tripId);
        res.json({ data: billSplits });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/trips/:tripId/payments - Create bill split
router.post('/trips/:tripId/payments', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.createBillSplitSchema.parse(req.body);
        const billSplit = await billSplit_service_1.billSplitService.createBillSplit({
            tripId,
            createdBy: userId,
            title: validatedData.title,
            description: validatedData.description,
            amount: validatedData.amount,
            currency: validatedData.currency,
            splitType: validatedData.splitType,
            paidBy: validatedData.paidBy,
            activityId: validatedData.activityId,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            members: validatedData.members,
        });
        // Auto-check settlement milestones after creating a bill split
        await (0, settlement_service_1.checkAndUpdateSettlementMilestones)(tripId);
        res.status(201).json({ data: billSplit });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// GET /api/payments/:id - Get bill split details
router.get('/payments/:id', async (req, res) => {
    try {
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(req.params.id);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        // Check permission via trip
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, req.user.userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        res.json({ data: billSplit });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/payments/:id - Update bill split
router.patch('/payments/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const billSplitId = req.params.id;
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        // Check permission - OWNER or EDITOR can update (not VIEWER)
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const validatedData = validations_1.updateBillSplitSchema.parse(req.body);
        const updated = await billSplit_service_1.billSplitService.updateBillSplit(billSplitId, {
            title: validatedData.title,
            description: validatedData.description,
            amount: validatedData.amount,
            currency: validatedData.currency,
            splitType: validatedData.splitType,
            status: validatedData.status,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            paidBy: validatedData.paidBy,
            members: validatedData.members,
        });
        // Auto-check settlement milestones after updating a bill split
        await (0, settlement_service_1.checkAndUpdateSettlementMilestones)(billSplit.tripId);
        res.json({ data: updated });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/payments/:id - Delete bill split
router.delete('/payments/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const billSplitId = req.params.id;
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission && billSplit.createdBy !== userId) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await billSplit_service_1.billSplitService.deleteBillSplit(billSplitId);
        res.json({ message: 'Bill split deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/payments/:id/members - Get members & their split amounts
router.get('/payments/:id/members', async (req, res) => {
    try {
        const userId = req.user.userId;
        const billSplitId = req.params.id;
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        res.json({ data: billSplit.members });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/payments/:id/members/:userId/paid - Mark member as paid
router.post('/payments/:id/members/:userId/paid', async (req, res) => {
    try {
        const userId = req.user.userId;
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
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        const updated = await billSplit_service_1.billSplitService.markMemberAsPaid(billSplitId, userId, paymentMethod, transactionId);
        // Auto-check settlement milestones after member marks themselves as paid
        await (0, settlement_service_1.checkAndUpdateSettlementMilestones)(billSplit.tripId);
        res.json({ data: updated });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// DELETE /api/payments/:id/members/:userId - Remove member from bill split
router.delete('/payments/:id/members/:userId', async (req, res) => {
    try {
        const userId = req.user.userId;
        const billSplitId = req.params.id;
        const targetUserId = req.params.userId;
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, userId, ['OWNER', 'EDITOR']);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        await billSplit_service_1.billSplitService.removeMemberFromBillSplit(billSplitId, targetUserId);
        // Auto-check settlement milestones after removing a member
        await (0, settlement_service_1.checkAndUpdateSettlementMilestones)(billSplit.tripId);
        res.json({ message: 'Member removed from bill split' });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/payments/:id/confirm - Confirm payment received
router.post('/payments/:id/confirm', async (req, res) => {
    try {
        const userId = req.user.userId;
        const billSplitId = req.params.id;
        const billSplit = await billSplit_service_1.billSplitService.getBillSplit(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'Bill split not found' });
            return;
        }
        // Only payer can confirm
        if (billSplit.paidBy !== userId) {
            res.status(403).json({ error: 'Only the payer can confirm payment' });
            return;
        }
        const updated = await billSplit_service_1.billSplitService.confirmPayment(billSplitId);
        // Auto-check settlement milestones after payer confirms payment
        await (0, settlement_service_1.checkAndUpdateSettlementMilestones)(billSplit.tripId);
        res.json({ data: updated });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:tripId/settlement-status - Get per-member settlement status
router.get('/trips/:tripId/settlement-status', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const status = await (0, settlement_service_1.getSettlementStatus)(tripId);
        res.json({ data: status });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// GET /api/trips/:tripId/debt-simplify - Get simplified debt settlement
router.get('/trips/:tripId/debt-simplify', async (req, res) => {
    try {
        const userId = req.user.userId;
        const tripId = req.params.tripId;
        // Check permission
        const permission = await trip_service_1.tripService.checkMemberPermission(tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const result = await debtSimplifier_service_1.debtSimplifierService.getSimplifiedDebts(tripId);
        res.json({ data: result });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Multer: store uploaded receipt in memory
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    },
});
/**
 * POST /api/payments/receipt-upload
 * Upload a receipt image/PDF for a BillSplit.
 *
 * Body (multipart/form-data):
 *   - billSplitId: string — ID of the BillSplit
 *   - receipt: File — image/PDF (jpg, png, webp, pdf), max 10MB
 */
router.post('/receipt-upload', upload.single('receipt'), async (req, res) => {
    try {
        const userId = req.user.userId;
        const { billSplitId } = req.body;
        if (!billSplitId) {
            res.status(400).json({ error: 'billSplitId is required' });
            return;
        }
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded. Send a file with key "receipt".' });
            return;
        }
        const billSplit = await payment_service_1.paymentService.getBillSplitById(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'BillSplit not found' });
            return;
        }
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        const result = await payment_service_1.paymentService.uploadReceipt(billSplitId, {
            mimetype: req.file.mimetype,
            buffer: req.file.buffer,
        });
        res.json({ success: true, receiptUrl: result.receiptUrl, filename: result.filename });
    }
    catch (err) {
        console.error('[/api/payments/receipt-upload] Error:', err);
        const status = err.message.includes('not found') ? 404 : 400;
        res.status(status).json({ error: err.message });
    }
});
/**
 * GET /api/payments/:billSplitId/receipt
 * Retrieve the receipt file for a BillSplit.
 * Returns the raw image/PDF with appropriate Content-Type header.
 */
router.get('/:billSplitId/receipt', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { billSplitId } = req.params;
        const billSplit = await payment_service_1.paymentService.getBillSplitById(billSplitId);
        if (!billSplit) {
            res.status(404).json({ error: 'BillSplit not found' });
            return;
        }
        const permission = await trip_service_1.tripService.checkMemberPermission(billSplit.tripId, userId);
        if (!permission.hasPermission) {
            res.status(403).json({ error: 'Unauthorized' });
            return;
        }
        if (!billSplit.receiptUrl) {
            res.status(404).json({ error: 'No receipt uploaded for this BillSplit' });
            return;
        }
        const { buffer, mimeType } = await payment_service_1.paymentService.getReceiptBuffer(billSplit.receiptUrl);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${path_1.default.basename(billSplit.receiptUrl)}"`);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.send(buffer);
    }
    catch (err) {
        console.error('[/api/payments/:billSplitId/receipt] Error:', err);
        res.status(404).json({ error: err.message || 'Receipt not found' });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map