"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentService = void 0;
exports.uploadReceipt = uploadReceipt;
exports.getReceiptBuffer = getReceiptBuffer;
exports.getBillSplitById = getBillSplitById;
const crypto_1 = require("crypto");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storage_1 = require("@/lib/storage");
const prisma_1 = __importDefault(require("@/lib/prisma"));
const UPLOADS_DIR = storage_1.storageConfig.uploadDir;
// Allowed MIME types
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIME_MAP = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
};
const MIME_TO_EXT = {
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
async function uploadReceipt(billSplitId, file) {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
        throw new Error(`Unsupported file type: ${file.mimetype}. Allowed: ${[...ALLOWED_TYPES].join(', ')}`);
    }
    if (file.buffer.length > MAX_FILE_SIZE) {
        throw new Error(`File too large. Maximum is ${MAX_FILE_SIZE / 1024 / 1024}MB.`);
    }
    const billSplit = await prisma_1.default.billSplit.findUnique({ where: { id: billSplitId } });
    if (!billSplit) {
        throw new Error(`BillSplit not found: ${billSplitId}`);
    }
    const ext = MIME_MAP[file.mimetype] ?? '';
    const filename = `${(0, crypto_1.randomUUID)()}${ext}`;
    const filePath = path_1.default.join(UPLOADS_DIR, filename);
    await fs_1.default.promises.writeFile(filePath, file.buffer);
    // receiptUrl uses the baseUrl from storageConfig (e.g. "/uploads" or full remote URL)
    const receiptUrl = `${storage_1.storageConfig.baseUrl}/${filename}`;
    await prisma_1.default.billSplit.update({
        where: { id: billSplitId },
        data: { receiptUrl },
    });
    return { receiptUrl, filename };
}
/**
 * Read a receipt file from disk (for serving via API).
 */
async function getReceiptBuffer(receiptUrl) {
    const filename = path_1.default.basename(receiptUrl);
    const filePath = path_1.default.join(UPLOADS_DIR, filename);
    if (!fs_1.default.existsSync(filePath)) {
        throw new Error('Receipt file not found');
    }
    const buffer = await fs_1.default.promises.readFile(filePath);
    const ext = path_1.default.extname(filename).toLowerCase();
    const mimeType = MIME_TO_EXT[ext] ?? 'application/octet-stream';
    return { buffer, mimeType };
}
/**
 * Get BillSplit with trip for ownership verification.
 */
async function getBillSplitById(billSplitId) {
    return prisma_1.default.billSplit.findUnique({
        where: { id: billSplitId },
        include: { trip: true },
    });
}
exports.paymentService = {
    uploadReceipt,
    getReceiptBuffer,
    getBillSplitById,
};
//# sourceMappingURL=payment.service.js.map