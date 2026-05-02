'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services/api';
import { DollarSign, Loader, Utensils, MapPin, Home, Package, ReceiptText } from 'lucide-react';
import { TripMember, User, CostType } from '@/types';
import { useFormSubmit } from '@/hooks/useFormSubmit';

interface MemberWithUser extends TripMember {
  user?: User;
}

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  members: MemberWithUser[];
  onSuccess?: () => void;
}

interface SplitData {
  userId: string;
  shares: number;
  percentage: number;
  customAmount: number;
}

export function AddExpenseModal({ isOpen, onClose, tripId, members, onSuccess }: AddExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'restaurant' | 'excursion' | 'house' | 'other'>('other');
  const [splitType, setSplitType] = useState<'equal' | 'shares' | 'percentage' | 'custom'>('equal');
  const [costType, setCostType] = useState<CostType>('PER_PERSON');
  const [notes, setNotes] = useState('');
  const [splits, setSplits] = useState<SplitData[]>([]);
  const [lastEditedIndex, setLastEditedIndex] = useState<number | null>(null);

  const { isSubmitting, error: hookError, submitForm } = useFormSubmit({
    waitForNavigation: true,
  });

  // Initialize splits when members change
  useEffect(() => {
    if (members.length > 0 && splits.length === 0) {
      setPaidBy(members[0].userId);
      setSplits(members.map(m => ({ userId: m.userId, shares: 1, percentage: 0, customAmount: 0 })));
    }
  }, [members, splits.length]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setDescription('');
      setAmount('');
      setTax('');
      setTip('');
      setPaidBy(members[0]?.userId || '');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('other');
      setSplitType('equal');
      setCostType('PER_PERSON');
      setNotes('');
      setSplits(members.map(m => ({ userId: m.userId, shares: 1, percentage: 0, customAmount: 0 })));
      setLastEditedIndex(null);
    }
  }, [isOpen, members]);

  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(tax) || 0) + (parseFloat(tip) || 0);
  const perPersonEqual = members.length > 0 ? totalAmount / members.length : 0;
  const totalShares = splits.reduce((sum, s) => sum + (Number(s.shares) || 0), 0);
  const totalPercentage = splits.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
  const totalCustomAmount = splits.reduce((sum, s) => sum + (Number(s.customAmount) || 0), 0);

  // Auto-balance last member's percentage when other members change
  useEffect(() => {
    if (splitType !== 'percentage' || members.length < 2 || lastEditedIndex === null) return;

    const isLastMemberEdited = lastEditedIndex === members.length - 1;
    if (isLastMemberEdited) return;

    const otherMembersPercentage = splits
      .filter((_, i) => i !== members.length - 1)
      .reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);

    const newLastPercentage = Math.round((100 - otherMembersPercentage) * 10) / 10;

    setSplits(prev => prev.map((s, i) =>
      i === members.length - 1 ? { ...s, percentage: newLastPercentage } : s
    ));
    setLastEditedIndex(null);
  }, [splits.map(s => s.percentage).join(','), splitType, members.length]);

  // Auto-balance last member's custom amount when other members change
  useEffect(() => {
    if (splitType !== 'custom' || members.length < 2 || lastEditedIndex === null) return;

    const isLastMemberEdited = lastEditedIndex === members.length - 1;
    if (isLastMemberEdited) return;

    const otherMembersAmount = splits
      .filter((_, i) => i !== members.length - 1)
      .reduce((sum, s) => sum + (Number(s.customAmount) || 0), 0);

    const newLastAmount = Math.round((totalAmount - otherMembersAmount) * 100) / 100;

    if (newLastAmount <= totalAmount) {
      setSplits(prev => prev.map((s, i) =>
        i === members.length - 1 ? { ...s, customAmount: newLastAmount } : s
      ));
    }
    setLastEditedIndex(null);
  }, [splits.map(s => s.customAmount).join(','), splitType, members.length, totalAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    await submitForm(async () => {
      const calculateSplits = () => {
        return members.map(member => {
          // For FIXED cost type, only the payer owes the full amount
          if (costType === 'FIXED') {
            const splitAmount = member.userId === paidBy ? totalAmount : 0;
            return {
              userId: member.userId,
              amount: Math.round(splitAmount * 100) / 100,
              shares: undefined,
              percentage: undefined,
            };
          }

          const split = splits.find(s => s.userId === member.userId);
          let splitAmount = 0;

          switch (splitType) {
            case 'equal':
              splitAmount = perPersonEqual;
              break;
            case 'shares':
              const shares = Number(split?.shares) || 1;
              splitAmount = totalShares > 0 ? (shares / totalShares) * totalAmount : 0;
              break;
            case 'percentage':
              splitAmount = ((Number(split?.percentage) || 0) / 100) * totalAmount;
              break;
            case 'custom':
              splitAmount = Number(split?.customAmount) || 0;
              break;
          }

          return {
            userId: member.userId,
            amount: Math.round(splitAmount * 100) / 100,
            shares: split?.shares,
            percentage: split?.percentage,
          };
        });
      };

      const splitsData = calculateSplits();

      // Create the bill split with members
      const billSplitResponse = await api.createBillSplit(tripId, {
        title: description,
        description: notes || '',
        amount: parseFloat(amount) + parseFloat(tax) + parseFloat(tip),
        currency: 'USD',
        splitType: splitType.toUpperCase() as 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL',
        costType,
        paidBy,
        dueDate: new Date(date).toISOString(),
        members: splitsData.map(s => ({
          userId: s.userId,
          dollarAmount: s.amount,
          percentage: s.percentage,
          shares: s.shares,
        })),
      });

      if (billSplitResponse.error) {
        throw new Error(billSplitResponse.error);
      }

      // Call success callback and close
      onSuccess?.();
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      className="max-h-[92vh] overflow-hidden p-0"
    >
      <div className="flex max-h-[92vh] flex-col">
        <div className="border-b border-border/70 bg-accent px-5 py-5 text-accent-foreground sm:px-6">
          <div className="flex items-start gap-3 pr-9">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/15">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Add Expense</h2>
              <p className="mt-1 text-sm leading-6 text-accent-foreground/78">
                Add a restaurant bill, excursion fee, or other shared trip cost.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {hookError && (
            <Card className="mb-5 border-red-500 bg-red-50 dark:bg-red-900/20">
              <CardContent className="py-4 text-sm text-red-600 dark:text-red-400">
                {hookError}
              </CardContent>
            </Card>
          )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category selector */}
          <section className="rounded-lg border border-border/70 bg-muted/30 p-4">
            <label className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Category</label>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { value: 'restaurant', label: 'Restaurant', icon: <Utensils className="h-5 w-5" /> },
                { value: 'excursion', label: 'Excursion', icon: <MapPin className="h-5 w-5" /> },
                { value: 'house', label: 'House', icon: <Home className="h-5 w-5" /> },
                { value: 'other', label: 'Other', icon: <Package className="h-5 w-5" /> },
              ].map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value as typeof category)}
                  className={cn(
                    "flex min-h-20 flex-col items-center justify-center gap-2 rounded-md border bg-card px-3 py-3 text-sm font-semibold transition-all",
                    category === cat.value
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="text-xs">{cat.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Description */}
          <section className="grid gap-4 rounded-lg border border-border/70 bg-card/80 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <Input
                label="Description"
                placeholder={category === 'restaurant' ? "Dinner at Restaurant X" : category === 'excursion' ? "Scuba diving tour" : category === 'house' ? "Beach house rental" : "Expense description"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              {/* Subtotal, Tax, Tip */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Subtotal</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                    className="pr-8 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    required
                  />
                  <span className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground",
                    costType !== 'PER_PERSON' && "opacity-50"
                  )}>/pp</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCostType(costType === 'PER_PERSON' ? 'FIXED' : 'PER_PERSON')}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md border border-border transition-colors shrink-0",
                    costType === 'PER_PERSON'
                      ? "bg-primary text-white border-primary"
                      : "bg-secondary text-muted-foreground border-border opacity-50"
                  )}
                >
                  /pp
                </button>
                  </div>
                </div>
                <Input
                  label="Tax"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                  onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                  className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <Input
                  label="Tip"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={tip}
                  onChange={(e) => setTip(e.target.value)}
                  onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                  className="appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
              </div>
            </div>

            {/* Total display */}
            <div className="flex flex-col justify-between rounded-lg bg-muted p-4">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="mt-2 text-3xl font-bold">{formatCurrency(totalAmount)}</span>
              <span className="mt-3 text-xs leading-5 text-muted-foreground">
                {costType === 'PER_PERSON' ? 'Subtotal is treated as a per-person cost.' : 'Subtotal is treated as a fixed bill total.'}
              </span>
            </div>
          </section>

          {/* Paid By & Date */}
          <section className="grid gap-4 rounded-lg border border-border/70 bg-card/80 p-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Paid By</label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.name || 'User'}</option>
                ))}
              </select>
            </div>
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </section>

          {/* Split Type selector */}
          <section className="rounded-lg border border-border/70 bg-card/80 p-4">
            <label className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">Split Type</label>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {['equal', 'shares', 'percentage', 'custom'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSplitType(type as typeof splitType)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm font-semibold capitalize transition-all",
                    splitType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/70 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </section>

          {/* Split Details */}
          {costType === 'FIXED' ? (
            // FIXED cost type: only the payer owes the full amount
            <section className="space-y-3 rounded-lg border border-border/70 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Split Details</label>
                <span className="text-xs text-muted-foreground">Fixed cost — payer covers total</span>
              </div>
              <div className="space-y-2">
                {members.map((member) => {
                  const isPayer = member.userId === paidBy;
                  const splitAmount = isPayer ? totalAmount : 0;
                  return (
                    <div key={member.userId} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={member.user?.avatarUrl || undefined}
                          name={member.user?.name || 'User'}
                          size="sm"
                        />
                        <span className="text-sm">{member.user?.name || 'User'}</span>
                        {isPayer && <span className="text-xs text-muted-foreground">(payer)</span>}
                      </div>
                      <span className={cn(
                        "w-20 text-right text-sm font-medium",
                        isPayer ? "text-primary" : "text-muted-foreground"
                      )}>
                        {formatCurrency(splitAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            // PER_PERSON cost type: normal split configuration
            <section className="space-y-3 rounded-lg border border-border/70 bg-card/80 p-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Split Details</label>
                {splitType === 'percentage' && (
                  <span className={cn(
                    "text-xs font-medium",
                    Math.abs(totalPercentage - 100) < 0.1 ? "text-green-600" : "text-amber-600"
                  )}>
                    Total: {totalPercentage.toFixed(1)}%
                  </span>
                )}
                {splitType === 'custom' && (
                  <span className={cn(
                    "text-xs font-medium",
                    Math.abs(totalCustomAmount - totalAmount) < 0.01 ? "text-green-600" : "text-amber-600"
                  )}>
                    Total: {formatCurrency(totalCustomAmount)} / {formatCurrency(totalAmount)}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {members.map((member) => {
                  const split = splits.find(s => s.userId === member.userId);
                  let splitAmount = 0;

                  switch (splitType) {
                    case 'equal':
                      splitAmount = perPersonEqual;
                      break;
                    case 'shares':
                      const shares = split?.shares || 1;
                      splitAmount = totalShares > 0 ? (shares / totalShares) * totalAmount : 0;
                      break;
                    case 'percentage':
                      splitAmount = ((split?.percentage || 0) / 100) * totalAmount;
                      break;
                    case 'custom':
                      splitAmount = split?.customAmount || 0;
                      break;
                  }

                  return (
                    <div key={member.userId} className="grid gap-3 rounded-md bg-muted/50 px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="flex min-w-0 items-center gap-2">
                        <Avatar
                          src={member.user?.avatarUrl || undefined}
                          name={member.user?.name || 'User'}
                          size="sm"
                        />
                        <span className="min-w-0 truncate text-sm font-medium">{member.user?.name || 'User'}</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                        {splitType === 'shares' && (
                          <input
                            type="number"
                            min="0"
                            value={split?.shares || 1}
                            onChange={(e) => setSplits(splits.map(s => s.userId === member.userId ? { ...s, shares: parseInt(e.target.value) || 0 } : s))}
                            onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                            className="w-16 h-8 rounded-md border border-border bg-background px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                        )}
                        {splitType === 'percentage' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={split?.percentage || 0}
                              onChange={(e) => {
                                const memberIndex = members.findIndex(m => m.userId === member.userId);
                                const newPercentage = Math.min(parseFloat(e.target.value) || 0, 100);
                                setSplits(splits.map((s, i) =>
                                  s.userId === member.userId
                                    ? { ...s, percentage: newPercentage }
                                    : s
                                ));
                                setLastEditedIndex(memberIndex);
                              }}
                              onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                              className="w-16 h-8 rounded-md border border-border bg-background px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span>%</span>
                          </div>
                        )}
                        {splitType === 'custom' && (
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max={totalAmount}
                            value={split?.customAmount || 0}
                            onChange={(e) => {
                              const memberIndex = members.findIndex(m => m.userId === member.userId);
                              const newAmount = Math.min(parseFloat(e.target.value) || 0, totalAmount);
                              setSplits(splits.map((s, i) =>
                                s.userId === member.userId
                                  ? { ...s, customAmount: newAmount }
                                  : s
                              ));
                              setLastEditedIndex(memberIndex);
                            }}
                            onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                            className="w-24 h-8 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            placeholder="0.00"
                          />
                        )}
                        <span className="w-20 text-right text-sm font-medium">{formatCurrency(splitAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Notes */}
          <section className="rounded-lg border border-border/70 bg-card/80 p-4">
            <Textarea
              label="Notes (optional)"
              placeholder="Add notes about this expense..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </section>

          {/* Actions */}
          <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-border/70 bg-card/95 px-5 py-4 backdrop-blur sm:-mx-6 sm:px-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Add Expense'
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </Modal>
  );
}
