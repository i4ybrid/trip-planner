'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Milestone, TripMember, BillSplit } from '@/types';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface RemindSettleModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  milestone: Milestone | null;
  members: TripMember[];
  billSplits: BillSplit[];
  onSuccess?: () => void;
}

interface MemberBalance {
  userId: string;
  userName: string;
  outstanding: number;
}

export function RemindSettleModal({
  isOpen,
  onClose,
  tripId,
  milestone,
  members,
  billSplits,
  onSuccess,
}: RemindSettleModalProps) {
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmedMembers = members.filter(m => m.status === 'CONFIRMED');

  // Calculate outstanding balances for each member
  const memberBalances: MemberBalance[] = confirmedMembers.map(member => {
    // Calculate what this member owes based on bill splits
    let outstanding = 0;
    
    billSplits.forEach(bill => {
      const memberSplit = bill.members?.find(m => m.userId === member.userId);
      if (memberSplit) {
        if (memberSplit.status === 'PENDING' || memberSplit.status === 'PARTIAL') {
          outstanding += Number(memberSplit.dollarAmount);
        }
      }
    });

    return {
      userId: member.userId,
      userName: member.user?.name || 'Unknown',
      outstanding,
    };
  });

  const membersWithOutstanding = memberBalances.filter(b => b.outstanding > 0);

  const handleSubmit = async () => {
    if (!milestone) return;

    const recipientIds = selectedMembers.length > 0
      ? selectedMembers
      : membersWithOutstanding.map(m => m.userId);

    if (recipientIds.length === 0) {
      alert('No members with outstanding balances to remind');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.triggerMilestoneAction(tripId, 'SETTLEMENT_REMINDER', recipientIds, message);
      onSuccess?.();
      onClose();
      // Reset form
      setSelectedMembers([]);
      setMessage('');
    } catch (error) {
      logger.error('Failed to send settlement reminder:', error);
      alert('Failed to send settlement reminder. Please try again.');
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
    setSelectedMembers([]);
    setMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Remind to Settle"
      description={`Send a settlement reminder for "${milestone?.name}"`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Outstanding balances */}
        {membersWithOutstanding.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Members with Outstanding Balances
            </label>
            <div className="max-h-48 overflow-y-auto rounded-md border p-2 space-y-1">
              {membersWithOutstanding.map(balance => (
                <div
                  key={balance.userId}
                  className="flex items-center justify-between p-2 rounded hover:bg-secondary"
                >
                  <label className="flex items-center gap-2 cursor-pointer flex-1">
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(balance.userId)}
                      onChange={() => toggleMember(balance.userId)}
                      className="text-primary rounded"
                    />
                    <span className="text-sm">{balance.userName}</span>
                  </label>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(balance.outstanding)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {membersWithOutstanding.length === 0 && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-center">
            <p className="text-sm text-green-700">All members have settled their balances!</p>
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
            placeholder="Add a personal message to the settlement reminder..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[100px] resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send Settlement Reminder'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
