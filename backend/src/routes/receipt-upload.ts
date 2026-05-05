import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { paymentService } from '@/services/payment.service';
import { tripService } from '@/services/trip.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Multer: store uploaded file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
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
 *   - receipt: File — the image/PDF file (jpg, png, webp, pdf)
 */
router.post('/receipt-upload', upload.single('receipt'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { billSplitId } = req.body;

    if (!billSplitId) {
      res.status(400).json({ error: 'billSplitId is required' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded. Send a file with key "receipt".' });
      return;
    }

    // Verify the BillSplit exists and user has access
    const billSplit = await paymentService.getBillSplitById(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'BillSplit not found' });
      return;
    }

    const permission = await tripService.checkMemberPermission(billSplit.tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const result = await paymentService.uploadReceipt(billSplitId, {
      mimetype: req.file.mimetype,
      buffer: req.file.buffer,
    });

    res.json({ success: true, receiptUrl: result.receiptUrl, filename: result.filename });
  } catch (err: any) {
    console.error('[/api/payments/receipt-upload] Error:', err);
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
});

/**
 * GET /api/payments/:billSplitId/receipt
 * Retrieve the receipt file for a BillSplit.
 * Returns the raw image/PDF with appropriate Content-Type.
 */
router.get('/:billSplitId/receipt', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { billSplitId } = req.params;

    const billSplit = await paymentService.getBillSplitById(billSplitId);
    if (!billSplit) {
      res.status(404).json({ error: 'BillSplit not found' });
      return;
    }

    const permission = await tripService.checkMemberPermission(billSplit.tripId, userId);
    if (!permission.hasPermission) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (!billSplit.receiptUrl) {
      res.status(404).json({ error: 'No receipt uploaded for this BillSplit' });
      return;
    }

    const { buffer, mimeType } = await paymentService.getReceiptBuffer(billSplit.receiptUrl);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(billSplit.receiptUrl)}"`);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(buffer);
  } catch (err: any) {
    console.error('[/api/payments/:billSplitId/receipt] Error:', err);
    res.status(404).json({ error: err.message || 'Receipt not found' });
  }
});

export default router;