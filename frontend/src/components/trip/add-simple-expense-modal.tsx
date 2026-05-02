'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button, Input, Select } from '@/components';
import { api } from '@/services/api';
import { formatCurrency, cn } from '@/lib/utils';
import { DollarSign, Loader2, Utensils, Plane, Home, Sparkles, Package } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ExpenseCategory } from '@/types';
import { useAuth } from '@/hooks/use-auth';

interface AddSimpleExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  onSuccess?: () => void;
}

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'FOOD', label: 'Food', icon: <Utensils className="h-4 w-4" /> },
  { value: 'TRANSPORT', label: 'Transport', icon: <Plane className="h-4 w-4" /> },
  { value: 'LODGING', label: 'Lodging', icon: <Home className="h-4 w-4" /> },
  { value: 'ACTIVITIES', label: 'Activities', icon: <Sparkles className="h-4 w-4" /> },
  { value: 'OTHER', label: 'Other', icon: <Package className="h-4 w-4" /> },
];

export function AddSimpleExpenseModal({ isOpen, onClose, tripId, onSuccess }: AddSimpleExpenseModalProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('OTHER');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setCategory('OTHER');
    setDate(new Date().toISOString().split('T')[0]);
    setError(null);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.createExpense(tripId, {
        amount: parsedAmount,
        description: description.trim(),
        category,
        payerId: user?.id || '',
        date: new Date(date).toISOString(),
        splitType: 'EQUAL',
      });
      resetForm();
      onSuccess?.();
    } catch (err) {
      logger.error('Failed to create expense:', err);
      setError('Failed to create expense. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Expense"
      description="Log a simple expense for the trip."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border-2 px-3 py-1.5 text-sm transition-all",
                  category === cat.value
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent-subtle)] text-[var(--color-text-secondary)]"
                )}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <Input
          label="Description"
          placeholder="What was this expense for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Amount & Date row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                required
              />
            </div>
          </div>
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}