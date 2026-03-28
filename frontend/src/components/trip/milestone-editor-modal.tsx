'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Milestone } from '@/types';
import { api } from '@/services/api';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

interface MilestoneEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: Milestone | null;
  onSuccess?: () => void;
}

export function MilestoneEditorModal({
  isOpen,
  onClose,
  milestone,
  onSuccess,
}: MilestoneEditorModalProps) {
  const [name, setName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [isHard, setIsHard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (milestone) {
      setName(milestone.name);
      setDueDate(format(new Date(milestone.dueDate), 'yyyy-MM-dd'));
      setIsLocked(milestone.isLocked);
      setIsSkipped(milestone.isSkipped);
      setIsHard(milestone.isHard);
    }
  }, [milestone]);

  const handleSubmit = async () => {
    if (!milestone) return;

    if (!name.trim()) {
      setError('Please enter a milestone name');
      return;
    }

    if (!dueDate) {
      setError('Please select a due date');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await api.updateMilestone(milestone.id, {
        name: name.trim(),
        dueDate: new Date(dueDate).toISOString(),
        isLocked,
        isSkipped,
        isHard,
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Failed to update milestone:', error);
      setError('Failed to update milestone. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDueDate('');
    setIsLocked(false);
    setIsSkipped(false);
    setIsHard(true);
    onClose();
  };

  if (!milestone) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Milestone"
      description={`Editing "${milestone.name}"`}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {/* Milestone name */}
        <div>
          <label className="block text-sm font-medium mb-2">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Milestone name"
            disabled={milestone.type !== 'CUSTOM'}
          />
          {milestone.type !== 'CUSTOM' && (
            <p className="mt-1 text-xs text-muted-foreground">
              Default milestone names cannot be changed
            </p>
          )}
        </div>

        {/* Due date */}
        <div>
          <label className="block text-sm font-medium mb-2">Due Date</label>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {/* Lock toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium text-sm">Lock Date</div>
            <div className="text-xs text-muted-foreground">
              Prevent date from being recalculated when trip start changes
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isLocked}
              onChange={(e) => setIsLocked(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white dark:after:border-gray-500 after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
          </label>
        </div>

        {/* Skip toggle */}
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="font-medium text-sm">Skip Milestone</div>
            <div className="text-xs text-muted-foreground">
              Hide this milestone from the progress view
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              checked={isSkipped}
              onChange={(e) => setIsSkipped(e.target.checked)}
              className="peer sr-only"
            />
            <div className="peer h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white dark:after:border-gray-500 after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
          </label>
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
            />
            <div className="peer h-5 w-9 rounded-full bg-gray-200 dark:bg-gray-600 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white dark:after:border-gray-500 after:transition-all after:content-[''] peer-checked:bg-red-500 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
