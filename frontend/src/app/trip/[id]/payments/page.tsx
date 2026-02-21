'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Textarea, Modal, Badge } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services';
import { Wallet, CreditCard, Plus, Trash2, DollarSign, Users } from 'lucide-react';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_API === 'true';

interface Expense {
  id: string;
  description: string;
  amount: number;
  tax: number;
  tip: number;
  paidBy: string;
  date: string;
  category: 'restaurant' | 'excursion' | 'house' | 'other';
  splitType: 'equal' | 'shares' | 'percentage' | 'custom';
  splits: { userId: string; amount: number; shares?: number; percentage?: number }[];
  notes?: string;
}

export default function TripPayments() {
  const params = useParams();
  const tripId = params.id as string;
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [tripMembers, setTripMembers] = useState<{ userId: string; role: string; user: { name: string } }[]>([]);

  useEffect(() => {
    if (USE_MOCK) {
      import('@/services').then(({ mockTrip }) => {
        setTripMembers(mockTrip.getTripMembersWithUsers(tripId));
      });
    } else {
      api.getTripMembers(tripId).then((response) => {
        if (response.data) {
          setTripMembers(response.data.map((m: any) => ({
            userId: m.userId,
            role: m.role,
            user: m.user || { name: 'Unknown' },
          })));
        }
      });
    }
  }, [tripId]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount + e.tax + e.tip, 0);

  const addExpense = (expense: Expense) => {
    setExpenses([...expenses, { ...expense, id: Date.now().toString() }]);
    setShowModal(false);
    setEditingExpense(null);
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const getUserName = (userId: string) => {
    const names: Record<string, string> = {
      'user-1': 'You',
      'user-2': 'Sarah Chen',
      'user-3': 'Mike Johnson',
      'user-4': 'Emma Wilson',
    };
    return names[userId] || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payments & Expenses</h2>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wallet className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-4">No expenses yet</p>
                <p className="text-sm">Add restaurant bills, excursion fees, or other expenses</p>
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{expense.description}</h3>
                        <Badge variant="outline" className="text-xs capitalize">
                          {expense.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Paid by {getUserName(expense.paidBy)} • {expense.date}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                        {expense.tax > 0 && <span>Tax: {formatCurrency(expense.tax)}</span>}
                        {expense.tip > 0 && <span>Tip: {formatCurrency(expense.tip)}</span>}
                        <span className="capitalize">Split: {expense.splitType}</span>
                      </div>
                      {expense.notes && (
                        <p className="mt-2 text-sm text-muted-foreground italic">{expense.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(expense.amount + expense.tax + expense.tip)}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteExpense(expense.id)}
                        className="mt-2 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Total Expenses</span>
                <span className="font-semibold">{formatCurrency(totalExpenses)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                <span className="text-sm text-muted-foreground">Per Person</span>
                <span className="font-semibold">
                  {tripMembers.length > 0 ? formatCurrency(totalExpenses / tripMembers.length) : formatCurrency(0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Balances
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tripMembers.map((member) => {
                const paid = expenses.filter(e => e.paidBy === member.userId).reduce((sum, e) => sum + e.amount + e.tax + e.tip, 0);
                const owes = totalExpenses / tripMembers.length;
                const balance = paid - owes;
                
                return (
                  <div key={member.userId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs">
                        {member.user.name.charAt(0)}
                      </div>
                      <span>{member.user.name}</span>
                    </div>
                    <span className={cn('font-medium', balance > 0 ? 'text-green-600' : balance < 0 ? 'text-red-600' : '')}>
                      {balance > 0 ? '+' : ''}{formatCurrency(balance)}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      <ExpenseModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingExpense(null); }}
        onSubmit={addExpense}
        members={tripMembers}
        expense={editingExpense}
      />
    </div>
  );
}

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Expense) => void;
  members: { userId: string; user: { name: string } }[];
  expense?: Expense | null;
}

function ExpenseModal({ isOpen, onClose, onSubmit, members, expense }: ExpenseModalProps) {
  const [description, setDescription] = useState(expense?.description || '');
  const [amount, setAmount] = useState(expense?.amount.toString() || '');
  const [tax, setTax] = useState(expense?.tax.toString() || '');
  const [tip, setTip] = useState(expense?.tip.toString() || '');
  const [paidBy, setPaidBy] = useState(expense?.paidBy || members[0]?.userId || '');
  const [date, setDate] = useState(expense?.date || new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<'restaurant' | 'excursion' | 'house' | 'other'>(expense?.category || 'other');
  const [splitType, setSplitType] = useState<'equal' | 'shares' | 'percentage' | 'custom'>(expense?.splitType || 'equal');
  const [notes, setNotes] = useState(expense?.notes || '');
  const [splits, setSplits] = useState<{ userId: string; shares: number; percentage: number; customAmount: number }[]>(
    members.map(m => ({ userId: m.userId, shares: 1, percentage: 0, customAmount: 0 }))
  );

  const totalAmount = (parseFloat(amount) || 0) + (parseFloat(tax) || 0) + (parseFloat(tip) || 0);
  const perPersonEqual = members.length > 0 ? totalAmount / members.length : 0;
  const totalShares = splits.reduce((sum, s) => sum + s.shares, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const calculateSplits = () => {
      return members.map(member => {
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
        
        return {
          userId: member.userId,
          amount: Math.round(splitAmount * 100) / 100,
          shares: split?.shares,
          percentage: split?.percentage,
        };
      });
    };

    onSubmit({
      id: expense?.id || '',
      description,
      amount: parseFloat(amount),
      tax: parseFloat(tax) || 0,
      tip: parseFloat(tip) || 0,
      paidBy,
      date,
      category,
      splitType,
      splits: calculateSplits(),
      notes: notes || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Expense"
      description="Add a restaurant bill, excursion fee, or other expense"
      className="max-w-lg"
    >
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
                <option key={m.userId} value={m.userId}>{m.user.name}</option>
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
          <label className="text-sm font-medium">Split Details</label>
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
                      {member.user.name.charAt(0)}
                    </div>
                    <span className="text-sm">{member.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {splitType === 'shares' && (
                      <Input
                        type="number"
                        min="0"
                        value={split?.shares || 1}
                        onChange={(e) => setSplits(splits.map(s => s.userId === member.userId ? { ...s, shares: parseInt(e.target.value) || 0 } : s))}
                        className="w-16 h-8 text-center"
                      />
                    )}
                    {splitType === 'percentage' && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={split?.percentage || 0}
                          onChange={(e) => setSplits(splits.map(s => s.userId === member.userId ? { ...s, percentage: parseFloat(e.target.value) || 0 } : s))}
                          className="w-16 h-8 text-center"
                        />
                        <span>%</span>
                      </div>
                    )}
                    {splitType === 'custom' && (
                      <Input
                        type="number"
                        step="0.01"
                        value={split?.customAmount || 0}
                        onChange={(e) => setSplits(splits.map(s => s.userId === member.userId ? { ...s, customAmount: parseFloat(e.target.value) || 0 } : s))}
                        className="w-24 h-8"
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
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Expense</Button>
        </div>
      </form>
    </Modal>
  );
}
