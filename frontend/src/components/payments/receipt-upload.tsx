'use client';

import React, { useCallback, useState } from 'react';
import { Upload, X, Paperclip, Image as ImageIcon } from 'lucide-react';
import { api } from '@/services/api';

interface ReceiptUploadProps {
  /** The BillSplit ID to attach the receipt to */
  billSplitId: string;
  /** Pre-populated receipt URL (e.g. from server data) */
  currentReceiptUrl?: string | null;
  /** Called after successful upload with the new receiptUrl */
  onUploadComplete?: (receiptUrl: string) => void;
  className?: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ReceiptUpload({
  billSplitId,
  currentReceiptUrl,
  onUploadComplete,
  className = '',
}: ReceiptUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentReceiptUrl || null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Unsupported file type. Please upload a JPG, PNG, WebP, or PDF.');
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`File is too large. Maximum is ${MAX_SIZE / 1024 / 1024}MB.`);
        return;
      }

      setError(null);
      setUploading(true);

      try {
        const result = await api.uploadReceipt(billSplitId, file);

        if (!result.data) {
          throw new Error(result.error || 'Upload failed');
        }

        setPreviewUrl(result.data.receiptUrl);
        onUploadComplete?.(result.data.receiptUrl);
      } catch (err: any) {
        setError(err.message || 'Upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    [billSplitId, onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setPreviewUrl(null);
    setError(null);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {previewUrl ? (
        /* Receipt preview — link to the receipt API endpoint */
        <div className="relative card-base p-3 flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center rounded bg-[var(--color-surface-secondary)]">
            <ImageIcon size={20} className="text-[var(--color-text-muted)]" />
          </div>
          <div className="flex-1 min-w-0">
            <a
              href={api.getReceiptUrl(billSplitId)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--text-sm)] text-[var(--color-accent)] font-medium hover:underline truncate block"
            >
              View Receipt
            </a>
            <div className="text-[var(--text-xs)] text-[var(--color-text-muted)] mt-0.5">Receipt attached</div>
          </div>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)]"
            aria-label="Remove receipt"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        /* Drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`
            relative card-base p-6 flex flex-col items-center justify-center gap-3 cursor-pointer
            border-2 border-dashed transition-colors
            ${dragging ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'}
          `}
        >
          <input
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
            disabled={uploading}
          />

          {uploading ? (
            <>
              <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Uploading…</span>
            </>
          ) : (
            <>
              <Upload size={28} className="text-[var(--color-text-muted)]" />
              <div className="text-center">
                <span className="text-[var(--text-sm)] text-[var(--color-text-primary)] font-medium">
                  Drop receipt here
                </span>
                <span className="text-[var(--text-xs)] text-[var(--color-text-muted)] block mt-0.5">
                  or tap to browse · JPG, PNG, WebP, PDF up to 10MB
                </span>
              </div>
              <div className="flex items-center gap-1 text-[var(--text-xs)] text-[var(--color-text-muted)]">
                <Paperclip size={12} />
                <span>Receipt</span>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="text-[var(--text-xs)] text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}