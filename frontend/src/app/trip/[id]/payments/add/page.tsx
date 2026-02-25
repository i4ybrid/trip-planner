'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services/api';
import { DollarSign } from 'lucide-react';
import { TripMember, User } from '@/types';

interface MemberWithUser extends TripMember {
  user?: User;
}

export default function AddExpense() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'restaurant' | 'excursion' | 'house' | 'other'>('other');
  const [splitType, setSplitType] = useState<'equal' | 'shares' | 'percentage' | 'custom'>('equal');
  const [notes, setNotes] = useState('');
  const [splits, setSplits] = useState<{ userId: string; shares: number; percentage: number; customAmount: number }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastEditedIndex, setLastEditedIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const result = await api.getTripMembers(tripId);
        if (result.data) {
          setMembers(result.data);
          if (result.data.length > 0) {
            setPaidBy(result.data[0].userId);
            setSplits(result.data.map(m => ({ userId: m.userId, shares: 1, percentage: 0, customAmount: 0 })));
          }
        }
      } catch (err) {
        setError('Failed to load trip members');
      } finally {
        setIsLoading(false);
      }
    };
    loadMembers();
  }, [tripId]);

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

    setIsSubmitting(true);
    setError(null);

    const calculateSplits = () => {
      return members.map(member => {
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

    try {
      const splitsData = calculateSplits();

      // Create the bill split with members
      const billSplitResponse = await api.createBillSplit(tripId, {
        title: description,
        description: notes || '',
        amount: parseFloat(amount) + parseFloat(tax) + parseFloat(tip),
        currency: 'USD',
        splitType: splitType.toUpperCase() as 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL',
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

      // Navigate back to payments page
      router.push(`/trip/${tripId}/payments`);
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Add Expense</h2>
          <p className="text-sm text-muted-foreground">Add a restaurant bill, excursion fee, or other expense</p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No members found in this trip</p>
            <Button variant="ghost" onClick={() => router.back()} className="mt-2">
              Go Back
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>

      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Expense Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Category</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {[
                  { value: 'restaurant', label: 'Restaurant', icon: '🍽️' },
                  { value: 'excursion', label: 'Excursion', icon: '🎯' },
                  { value: 'house', label: 'House', icon: '🏠' },
                  { value: 'other', label: 'Other', icon: '📦' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value as typeof category)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all",
                      category === cat.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Description"
              placeholder={category === 'restaurant' ? "Dinner at Restaurant X" : category === 'excursion' ? "Scuba diving tour" : category === 'house' ? "Beach house rental" : "Expense description"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Subtotal"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Input
                label="Tax"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
              <Input
                label="Tip"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={tip}
                onChange={(e) => setTip(e.target.value)}
              />
            </div>

            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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
            </div>

            <div>
              <label className="text-sm font-medium">Split Type</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {['equal', 'shares', 'percentage', 'custom'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSplitType(type as typeof splitType)}
                    className={cn(
                      "rounded-lg border-2 p-2 text-xs capitalize transition-all",
                      splitType === type
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
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
              <div className="space-y-2 rounded-lg border border-border p-3">
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
                    <div key={member.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs">
                          {member.user?.name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm">{member.user?.name || 'User'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {splitType === 'shares' && (
                          <input
                            type="number"
                            min="0"
                            value={split?.shares || 1}
                            onChange={(e) => setSplits(splits.map(s => s.userId === member.userId ? { ...s, shares: parseInt(e.target.value) || 0 } : s))}
                            className="w-16 h-8 rounded-md border border-border bg-background px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                              className="w-16 h-8 rounded-md border border-border bg-background px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                            className="w-24 h-8 rounded-md border border-border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            placeholder="0.00"
                          />
                        )}
                        <span className="w-20 text-right text-sm font-medium">{formatCurrency(splitAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <Textarea
              label="Notes (optional)"
              placeholder="Add notes about this expense..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Add Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}
