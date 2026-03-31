'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Badge, Avatar } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services/api';
import { DollarSign } from 'lucide-react';
import { TripMember, User, BillSplit, BillSplitMember, CostType } from '@/types';
import { useFormSubmit } from '@/hooks/useFormSubmit';

interface MemberWithUser extends TripMember {
  user?: User;
}

interface MemberSplit extends BillSplitMember {
  user?: User;
}

export default function EditExpense() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;
  const billId = params.billId as string;

  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [billSplits, setBillSplits] = useState<MemberSplit[]>([]);
  const [bill, setBill] = useState<BillSplit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [tax, setTax] = useState('');
  const [tip, setTip] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitType, setSplitType] = useState<'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL'>('EQUAL');
  const [costType, setCostType] = useState<CostType>('PER_PERSON');
  const [splits, setSplits] = useState<{ userId: string; shares: number; percentage: number; customAmount: number }[]>([]);
  const [lastEditedIndex, setLastEditedIndex] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { isSubmitting, error: hookError, submitForm } = useFormSubmit({
    waitForNavigation: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [membersResult, billResult] = await Promise.all([
          api.getTripMembers(tripId),
          api.getBillSplit(billId),
        ]);
        
        if (membersResult.data) {
          setMembers(membersResult.data);
        }
        
        if (billResult.data) {
          const billData = billResult.data;
          setBill(billData);
          setDescription(billData.title);
          setAmount(billData.amount.toString());
          setPaidBy(billData.paidBy);
          setSplitType(billData.splitType);
          setCostType(billData.costType || 'PER_PERSON');

          if (billData.members) {
            setBillSplits(billData.members);
            // Initialize splits from stored percentage/shares values (convert from Decimal strings)
            setSplits(billData.members.map(m => ({
              userId: m.userId,
              shares: typeof m.shares === 'number' ? m.shares : Number(m.shares) || 1,
              percentage: typeof m.percentage === 'number' ? m.percentage : Number(m.percentage) || 0,
              customAmount: typeof m.dollarAmount === 'number' ? m.dollarAmount : Number(m.dollarAmount) || 0,
            })));
          }
        }
      } catch (err) {
        setLoadError('Failed to load expense data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [tripId, billId]);

  const baseAmount = parseFloat(amount) || 0;
  const taxAmount = parseFloat(tax) || 0;
  const tipAmount = parseFloat(tip) || 0;
  const totalAmount = baseAmount + taxAmount + tipAmount;
  const perPersonEqual = members.length > 0 ? totalAmount / members.length : 0;
  const totalShares = splits.reduce((sum, s) => sum + (Number(s.shares) || 0), 0);
  const totalPercentage = splits.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
  const totalCustomAmount = splits.reduce((sum, s) => sum + (Number(s.customAmount) || 0), 0);

  // Auto-balance last member's percentage when other members change
  useEffect(() => {
    if (splitType !== 'PERCENTAGE' || members.length < 2 || lastEditedIndex === null) return;

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
    if (splitType !== 'MANUAL' || members.length < 2 || lastEditedIndex === null) return;

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

  const calculateSplits = () => {
    return members.map(member => {
      // For FIXED cost type, only the payer owes the full amount
      if (costType === 'FIXED') {
        const splitAmount = member.userId === paidBy ? totalAmount : 0;
        return {
          userId: member.userId,
          amount: Math.round(splitAmount * 100) / 100,
          percentage: undefined,
          shares: undefined,
        };
      }

      const split = splits.find(s => s.userId === member.userId);
      let splitAmount = 0;

      switch (splitType) {
        case 'EQUAL':
          splitAmount = perPersonEqual;
          break;
        case 'SHARES':
          const shares = Number(split?.shares) || 1;
          splitAmount = totalShares > 0 ? (shares / totalShares) * totalAmount : 0;
          break;
        case 'PERCENTAGE':
          splitAmount = ((Number(split?.percentage) || 0) / 100) * totalAmount;
          break;
        case 'MANUAL':
          splitAmount = Number(split?.customAmount) || 0;
          break;
      }

      return {
        userId: member.userId,
        amount: Math.round(splitAmount * 100) / 100,
        percentage: split?.percentage,
        shares: split?.shares,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    await submitForm(async () => {
      const splitsData = calculateSplits();

      await api.updateBillSplit(billId, {
        title: description,
        description: bill?.description || '',
        amount: totalAmount,
        currency: 'USD',
        splitType,
        costType,
        paidBy,
        members: splitsData.map(s => ({
          userId: s.userId,
          dollarAmount: s.amount,
          percentage: s.percentage,
          shares: s.shares,
        })),
      });

      router.push(`/trip/${tripId}/payments`);
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Expense not found</p>
            <Button variant="ghost" onClick={() => router.back()} className="mt-2">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()} className="h-8 w-8 p-0">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Edit Expense</h2>
          <p className="text-sm text-muted-foreground">Update expense details</p>
        </div>
      </div>

      {hookError && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-900/20">
          <CardContent className="py-4 text-sm text-red-600 dark:text-red-400">
            {hookError}
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">
                {bill.status.toLowerCase()}
              </Badge>
            </div>

            <Input
              label="Description"
              placeholder="Expense description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
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
                    {costType === 'PER_PERSON' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">/pp</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCostType(costType === 'PER_PERSON' ? 'FIXED' : 'PER_PERSON')}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-md border border-border transition-colors shrink-0",
                      costType === 'PER_PERSON'
                        ? "bg-primary text-white border-primary"
                        : "bg-secondary text-muted-foreground border-border dark:bg-secondary-dark"
                    )}
                  >
                    {costType === 'PER_PERSON' ? '/pp' : ''}
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

            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

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

            <div>
              <label className="text-sm font-medium">Split Type</label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {['equal', 'shares', 'percentage', 'manual'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSplitType(type.toUpperCase() as typeof splitType)}
                    className={cn(
                      "rounded-lg border-2 p-2 text-xs capitalize transition-all",
                      splitType === type.toUpperCase()
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {costType === 'FIXED' ? (
              // FIXED cost type: only the payer owes the full amount
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Split Details</label>
                  <span className="text-xs text-muted-foreground">Fixed cost — payer covers total</span>
                </div>
                <div className="space-y-2 rounded-lg border border-border p-3">
                  {members.map((member) => {
                    const isPayer = member.userId === paidBy;
                    const splitAmount = isPayer ? totalAmount : 0;
                    return (
                      <div key={member.userId} className="flex items-center justify-between">
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
              </div>
            ) : (
              // PER_PERSON cost type: normal split configuration
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Split Details</label>
                  {splitType === 'PERCENTAGE' && (
                    <span className={cn(
                      "text-xs font-medium",
                      Math.abs(totalPercentage - 100) < 0.1 ? "text-green-600" : "text-amber-600"
                    )}>
                      Total: {totalPercentage.toFixed(1)}%
                    </span>
                  )}
                  {splitType === 'MANUAL' && (
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
                      case 'EQUAL':
                        splitAmount = perPersonEqual;
                        break;
                      case 'SHARES':
                        const shares = split?.shares || 1;
                        splitAmount = totalShares > 0 ? (shares / totalShares) * totalAmount : 0;
                        break;
                      case 'PERCENTAGE':
                        splitAmount = ((split?.percentage || 0) / 100) * totalAmount;
                        break;
                      case 'MANUAL':
                        splitAmount = split?.customAmount || 0;
                        break;
                    }

                    return (
                      <div key={member.userId} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={member.user?.avatarUrl || undefined}
                            name={member.user?.name || 'User'}
                            size="sm"
                          />
                          <span className="text-sm">{member.user?.name || 'User'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {splitType === 'SHARES' && (
                            <input
                              type="number"
                              min="0"
                              value={split?.shares || 1}
                              onChange={(e) => setSplits(splits.map(s => s.userId === member.userId ? { ...s, shares: parseInt(e.target.value) || 0 } : s))}
                              onBlur={(e) => { const v = parseFloat(e.target.value); if (isNaN(v)) e.target.value = ''; }}
                              className="w-16 h-8 rounded-md border border-border bg-background px-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                          )}
                          {splitType === 'PERCENTAGE' && (
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
                          {splitType === 'MANUAL' && (
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
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
