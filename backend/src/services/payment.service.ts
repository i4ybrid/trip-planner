import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';
import { storageConfig } from '@/lib/storage';
import prisma from '@/lib/prisma';

const UPLOADS_DIR = storageConfig.uploadDir;

// Allowed MIME types
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_MAP: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

const MIME_TO_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

/**
 * Upload a receipt file for a BillSplit.
 * Saves to local uploads dir with UUID filename, updates BillSplit.receiptUrl.
 */
export async function uploadReceipt(
  billSplitId: string,
  file: { mimetype: string; buffer: Buffer }
): Promise<{ receiptUrl: string; filename: string }> {
  if (!ALLOWED_TYPES.has(file.mimetype)) {
    throw new Error(
      `Unsupported file type: ${file.mimetype}. Allowed: ${[...ALLOWED_TYPES].join(', ')}`
    );
  }

  if (file.buffer.length > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
  }

  const billSplit = await prisma.billSplit.findUnique({ where: { id: billSplitId } });
  if (!billSplit) {
    throw new Error(`BillSplit not found: ${billSplitId}`);
  }

  const ext = MIME_MAP[file.mimetype] ?? '';
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOADS_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);

  // receiptUrl uses the baseUrl from storageConfig (e.g. "/uploads" or full remote URL)
  const receiptUrl = `${storageConfig.baseUrl}/${filename}`;

  await prisma.billSplit.update({
    where: { id: billSplitId },
    data: { receiptUrl },
  });

  return { receiptUrl, filename };
}

/**
 * Read a receipt file from disk (for serving via API).
 */
export async function getReceiptBuffer(receiptUrl: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const filename = path.basename(receiptUrl);
  const filePath = path.join(UPLOADS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error('Receipt file not found');
  }

  const buffer = await fs.promises.readFile(filePath);
  const ext = path.extname(filename).toLowerCase();
  const mimeType = MIME_TO_EXT[ext] ?? 'application/octet-stream';

  return { buffer, mimeType };
}

/**
 * Get BillSplit with trip for ownership verification.
 */
export async function getBillSplitById(billSplitId: string) {
  return prisma.billSplit.findUnique({
    where: { id: billSplitId },
    include: { trip: true },
  });
}

export const paymentService = {
  uploadReceipt,
  getReceiptBuffer,
  getBillSplitById,
};