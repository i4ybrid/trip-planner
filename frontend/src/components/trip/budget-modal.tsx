'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button, Input } from '@/components';
import { api } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  currentBudget: number;
  onBudgetUpdated: (newBudget: number) => void;
}

export function BudgetModal({ isOpen, onClose, tripId, currentBudget, onBudgetUpdated }: BudgetModalProps) {
  const [budgetValue, setBudgetValue] = useState(String(currentBudget || ''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(budgetValue);
    if (isNaN(parsed) || parsed < 0) {
      setError('Please enter a valid budget amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await api.updateTripBudget(tripId, parsed);
      if (result.data?.budget !== undefined) {
        onBudgetUpdated(Number(result.data.budget));
      } else {
        onBudgetUpdated(parsed);
      }
    } catch (err) {
      logger.error('Failed to update budget:', err);
      setError('Failed to update budget. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Trip Budget"
      description="Set a total budget for this trip to track your spending."
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Budget'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}