'use client';

'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { logger } from '@/lib/logger';

interface AddMilestoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSuccess?: () => void;
}

export function AddMilestoneModal({
  isOpen,
  onClose,
  tripId,
  onSuccess,
}: AddMilestoneModalProps) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [milestoneType, setMilestoneType] = useState('CUSTOM');
  const [isHard, setIsHard] = useState(true);
  const [priority, setPriority] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setDueDate('');
    setMilestoneType('CUSTOM');
    setIsHard(true);
    setPriority(5);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('Please enter a milestone name');
      return;
    }

    if (!dueDate) {
      alert('Please select a due date');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createMilestone(tripId, {
        name: name.trim(),
        type: milestoneType,
        dueDate: new Date(dueDate).toISOString(),
        isHard,
        priority,
      });
      onSuccess?.();
      handleClose();
    } catch (error) {
      logger.error('Failed to create milestone:', error);
      alert('Failed to create milestone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Milestone"
      description="Create a custom milestone for this trip"
    >
      <div className="space-y-4">
        {/* Milestone name */}
        <div>
          <label className="block text-sm font-medium mb-2">Name *</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Booking Deadline, Final Headcount"
            maxLength={100}
            disabled={isSubmitting}
          />
        </div>

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium mb-2">Due Date *</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <select
            value={milestoneType}
            onChange={(e) => setMilestoneType(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm dark:bg-[hsl(var(--card))] dark:text-[hsl(var(--foreground))]"
            disabled={isSubmitting}
          >
            <option value="COMMITMENT_REQUEST">📋 Commitment Request</option>
            <option value="COMMITMENT_DEADLINE">⏰ Commitment Deadline</option>
            <option value="FINAL_PAYMENT_DUE">💰 Final Payment Due</option>
            <option value="SETTLEMENT_DUE">📊 Settlement Due</option>
            <option value="SETTLEMENT_COMPLETE">✅ Settlement Complete</option>
            <option value="CUSTOM">🎯 Custom Milestone</option>
          </select>
        </div>

        {/* Hard/Soft toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium text-sm">Hard Deadline</div>
            <div className="text-xs text-muted-foreground">
              Mark as a hard deadline (cannot be skipped)
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isHard}
              onChange={(e) => setIsHard(e.target.checked)}
              className="peer sr-only"
              disabled={isSubmitting}
            />
            <div className="peer h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white dark:after:border-gray-500 after:transition-all after:content-[''] peer-checked:bg-red-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-disabled:opacity-50"></div>
          </label>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            disabled={isSubmitting}
          >
            <option value={1}>Low</option>
            <option value={5}>Medium</option>
            <option value={10}>High</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Milestone'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
