'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services/api';
import { Wallet, CreditCard, Plus, Trash2 } from 'lucide-react';
import { TripMember, User, BillSplit } from '@/types';

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

interface MemberWithUser extends TripMember {
  user?: User;
}

export default function TripPayments() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplit[]>([]);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [editingBill, setEditingBill] = useState<BillSplit | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [billSplitsResult, membersResult] = await Promise.all([
          api.getBillSplits(tripId),
          api.getTripMembers(tripId),
        ]);
        if (billSplitsResult.data) setBillSplits(billSplitsResult.data);
        if (membersResult.data) setMembers(membersResult.data);
      } catch (error) {
        console.error('Failed to load payments data:', error);
      }
    };
    loadData();
  }, [tripId]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount + e.tax + e.tip, 0) + 
    billSplits.reduce((sum, b) => sum + Number(b.amount), 0);

  const deleteBillSplit = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.deleteBillSplit(id);
      setBillSplits(billSplits.filter(b => b.id !== id));
    } catch (error) {
      console.error('Failed to delete bill split:', error);
    }
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const getUserName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    if (member?.user?.name) return member.user.name;
    if (userId === 'user-1') return 'You';
    return 'Unknown User';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payments & Expenses</h2>
        <Button onClick={() => router.push(`/trip/${tripId}/payments/add`)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {expenses.length === 0 && billSplits.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Wallet className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-4">No expenses yet</p>
                <p className="text-sm">Add restaurant bills, excursion fees, or other expenses</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {billSplits.map((bill) => (
                <Card key={bill.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{bill.title}</h3>
                          <Badge variant="outline" className="text-xs capitalize">
                            {bill.status.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {bill.description}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Paid by {getUserName(bill.paidBy)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(Number(bill.amount))}</p>
                        <div className="flex justify-end gap-1 mt-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/trip/${tripId}/payments/edit/${bill.id}`)}
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteBillSplit(bill.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {expenses.map((expense) => (
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
              ))}
            </>
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
                <span className="text-sm text-muted-foreground">Total Paid By Others</span>
                <span className="font-semibold">
                  {formatCurrency(billSplits.reduce((sum, b) => {
                    const payerSplit = b.members?.find(m => m.userId === b.paidBy);
                    return sum + (payerSplit ? Number(payerSplit.dollarAmount) : 0);
                  }, 0))}
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
              {members.map((member) => {
                // Calculate total paid by this member (from bill splits where they paid)
                const paid = billSplits
                  .filter(b => b.paidBy === member.userId)
                  .reduce((sum, b) => sum + Number(b.amount), 0);

                // Calculate total owed by this member (sum of their dollarAmount from all bill splits)
                const owes = billSplits.reduce((sum, b) => {
                  const memberSplit = b.members?.find(m => m.userId === member.userId);
                  return sum + (memberSplit ? Number(memberSplit.dollarAmount) : 0);
                }, 0);

                const balance = paid - owes;

                return (
                  <div key={member.userId} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs">
                        {member.user?.name?.charAt(0) || 'U'}
                      </div>
                      <span>{member.user?.name || 'User'}</span>
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
    </div>
  );
}
