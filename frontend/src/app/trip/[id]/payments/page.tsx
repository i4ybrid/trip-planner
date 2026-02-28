'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components';
import { formatCurrency, cn } from '@/lib/utils';
import { api } from '@/services/api';
import { Wallet, CreditCard, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { TripMember, User, BillSplit, BillSplitMember, PaymentMethod } from '@/types';

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

interface BillSplitWithMembers extends BillSplit {
  members: BillSplitMember[];
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'VENMO', label: 'Venmo', icon: 'V' },
  { value: 'PAYPAL', label: 'PayPal', icon: 'P' },
  { value: 'ZELLE', label: 'Zelle', icon: 'Z' },
  { value: 'CASHAPP', label: 'Cash App', icon: '$' },
  { value: 'CASH', label: 'Cash', icon: 'C' },
  { value: 'OTHER', label: 'Other', icon: 'O' },
];

export default function TripPayments() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const tripId = params.id as string;
  const currentUserId = session?.user?.id;

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billSplits, setBillSplits] = useState<BillSplitWithMembers[]>([]);
  const [members, setMembers] = useState<MemberWithUser[]>([]);
  const [editingBill, setEditingBill] = useState<BillSplit | null>(null);
  const [markingPaid, setMarkingPaid] = useState<{ billId: string; userId: string } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | ''>('');
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [billSplitsResult, membersResult] = await Promise.all([
          api.getBillSplits(tripId),
          api.getTripMembers(tripId),
        ]);
        if (billSplitsResult.data) setBillSplits(billSplitsResult.data as BillSplitWithMembers[]);
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

  const handleMarkAsPaid = async (billId: string, userId: string) => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }
    try {
      await api.markBillSplitMemberPaid(billId, userId, selectedPaymentMethod);
      // Refresh the bill splits to show updated status
      const result = await api.getBillSplits(tripId);
      if (result.data) setBillSplits(result.data as BillSplitWithMembers[]);
      setMarkingPaid(null);
      setSelectedPaymentMethod('');
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      alert('Failed to mark as paid. Please try again.');
    }
  };

  const handleConfirmReceipt = async (billId: string) => {
    try {
      await api.confirmBillSplitPayment(billId);
      // Refresh the bill splits to show updated status
      const result = await api.getBillSplits(tripId);
      if (result.data) setBillSplits(result.data as BillSplitWithMembers[]);
      setConfirmingPaymentId(null);
    } catch (error) {
      console.error('Failed to confirm payment:', error);
      alert('Failed to confirm payment. Please try again.');
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
                        
                        {/* Member payment status */}
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Payment Status:</p>
                          {bill.members?.map((member) => {
                            const isCurrentUser = member.userId === currentUserId;
                            const isPayer = member.userId === bill.paidBy;
                            const isPaid = member.status === 'PAID' || member.status === 'CONFIRMED';
                            const isMarkingPaid = markingPaid?.billId === bill.id && markingPaid?.userId === member.userId;
                            
                            return (
                              <div
                                key={member.id || member.userId}
                                className="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2"
                              >
                                <div className="flex items-center gap-2">
                                  {isPaid ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <span className="text-sm">{getUserName(member.userId)}</span>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'text-xs',
                                      member.status === 'CONFIRMED' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                                      member.status === 'PAID' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                                      member.status === 'PENDING' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                                      member.status === 'PARTIAL' && 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
                                    )}
                                  >
                                    {member.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(member.dollarAmount)}
                                  </span>
                                </div>
                                
                                {/* Mark as Paid button - only show for current user who is not the payer and hasn't paid */}
                                {!isPayer && !isPaid && isCurrentUser && (
                                  <div className="flex items-center gap-2">
                                    {isMarkingPaid ? (
                                      <>
                                        <select
                                          value={selectedPaymentMethod}
                                          onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                                          className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                                          autoFocus
                                        >
                                          <option value="">Select method</option>
                                          {PAYMENT_METHODS.map((method) => (
                                            <option key={method.value} value={method.value}>
                                              {method.label}
                                            </option>
                                          ))}
                                        </select>
                                        <Button
                                          size="sm"
                                          onClick={() => handleMarkAsPaid(bill.id, member.userId)}
                                          className="h-7 text-xs"
                                        >
                                          Confirm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setMarkingPaid(null);
                                            setSelectedPaymentMethod('');
                                          }}
                                          className="h-7 text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setMarkingPaid({ billId: bill.id, userId: member.userId })}
                                        className="h-7 text-xs"
                                      >
                                        Mark as Paid
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {/* Confirm Receipt button - show for payer when member has marked as PAID */}
                                {!isCurrentUser && isPayer && member.status === 'PAID' && (
                                  <div className="flex items-center gap-2">
                                    {confirmingPaymentId === bill.id ? (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => handleConfirmReceipt(bill.id)}
                                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                        >
                                          <CheckCircle2 className="mr-1 h-3 w-3" />
                                          Yes, Confirm
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setConfirmingPaymentId(null)}
                                          className="h-7 text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setConfirmingPaymentId(bill.id)}
                                        className="h-7 text-xs border-green-600 text-green-600 hover:bg-green-50"
                                      >
                                        Confirm Receipt
                                      </Button>
                                    )}
                                  </div>
                                )}

                                {/* Show payment method if paid */}
                                {isPaid && member.paymentMethod && (
                                  <Badge variant="secondary" className="text-xs">
                                    {member.paymentMethod}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
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
