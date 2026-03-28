'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Milestone, TripMember } from '@/types';
import { api } from '@/services/api';
import { logger } from '@/lib/logger';

interface RequestPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  milestone: Milestone | null;
  members: TripMember[];
  onSuccess?: () => void;
}

export function RequestPaymentModal({
  isOpen,
  onClose,
  tripId,
  milestone,
  members,
  onSuccess,
}: RequestPaymentModalProps) {
  const [recipientType, setRecipientType] = useState<'all' | 'selected'>('all');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmedMembers = members.filter(m => m.status === 'CONFIRMED');

  const handleSubmit = async () => {
    if (!milestone) return;

    const recipientIds = recipientType === 'all'
      ? confirmedMembers.map(m => m.userId)
      : selectedMembers;

    if (recipientIds.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.triggerMilestoneAction(tripId, 'PAYMENT_REQUEST', recipientIds, message);
      onSuccess?.();
      onClose();
      // Reset form
      setRecipientType('all');
      setSelectedMembers([]);
      setMessage('');
    } catch (error) {
      logger.error('Failed to send payment request:', error);
      alert('Failed to send payment request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleClose = () => {
    setRecipientType('all');
    setSelectedMembers([]);
    setMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Payment"
      description={`Send a payment reminder for "${milestone?.name}"`}
    >
      <div className="space-y-4">
        {/* Recipient selection */}
        <div>
          <label className="block text-sm font-medium mb-2">Send to</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recipientType"
                checked={recipientType === 'all'}
                onChange={() => setRecipientType('all')}
                className="text-primary"
              />
              <span className="text-sm">All confirmed members</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="recipientType"
                checked={recipientType === 'selected'}
                onChange={() => setRecipientType('selected')}
                className="text-primary"
              />
              <span className="text-sm">Selected members</span>
            </label>
          </div>
        </div>

        {/* Member selection when "selected" is chosen */}
        {recipientType === 'selected' && (
          <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
            {confirmedMembers.map(member => (
              <label
                key={member.userId}
                className="flex items-center gap-2 p-2 rounded hover:bg-secondary cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(member.userId)}
                  onChange={() => toggleMember(member.userId)}
                  className="text-primary rounded"
                />
                <span className="text-sm">{member.user?.name}</span>
              </label>
            ))}
            {confirmedMembers.length === 0 && (
              <p className="text-sm text-muted-foreground p-2">No confirmed members</p>
            )}
          </div>
        )}

        {/* Message */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Message <span className="text-muted-foreground">(optional)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to the payment reminder..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Payment Request'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
