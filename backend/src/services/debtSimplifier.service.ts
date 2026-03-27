import prisma from '@/lib/prisma';

export interface MemberBalance {
  userId: string;
  name: string;
  balance: number; // positive = owed money, negative = owes money
}

export interface Settlement {
  from: string;  // userId of debtor
  fromName: string;
  to: string;    // userId of creditor
  toName: string;
  amount: number;
}

export interface DebtSimplificationResult {
  balances: MemberBalance[];
  settlements: Settlement[];
}

export class DebtSimplifierService {
  /**
   * Calculate balances for all trip members based on bill splits.
   * Balance = (total paid by member) - (total owed by member)
   * Positive balance = member is owed money
   * Negative balance = member owes money
   */
  async calculateBalances(tripId: string): Promise<MemberBalance[]> {
    // Get all confirmed trip members
    const tripMembers = await prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    if (tripMembers.length === 0) {
      return [];
    }

    // Get all bill splits for this trip
    const billSplits = await prisma.billSplit.findMany({
      where: { tripId },
      include: {
        members: true,
      },
    });

    // Calculate net balance for each member
    const balanceMap = new Map<string, number>();

    // Initialize all members with 0 balance
    for (const member of tripMembers) {
      balanceMap.set(member.userId, 0);
    }

    for (const bill of billSplits) {
      // The payer paid the full amount
      const currentPayerBalance = balanceMap.get(bill.paidBy) || 0;
      balanceMap.set(bill.paidBy, currentPayerBalance + Number(bill.amount));

      // Each member owes their share
      for (const member of bill.members) {
        const currentBalance = balanceMap.get(member.userId) || 0;
        balanceMap.set(member.userId, currentBalance - Number(member.dollarAmount));
      }
    }

    // Build result with user names
    const balances: MemberBalance[] = [];
    for (const member of tripMembers) {
      const balance = balanceMap.get(member.userId) || 0;
      // Round to 2 decimal places to avoid floating point issues
      const roundedBalance = Math.round(balance * 100) / 100;
      if (roundedBalance !== 0 || billSplits.length > 0) {
        balances.push({
          userId: member.userId,
          name: member.user.name,
          balance: roundedBalance,
        });
      }
    }

    return balances;
  }

  /**
   * Simplify debts using a greedy algorithm.
   * Matches debtors (negative balance) with creditors (positive balance)
   * to minimize the number of transactions.
   */
  simplifyDebts(balances: MemberBalance[]): Settlement[] {
    if (balances.length === 0) {
      return [];
    }

    // Create working copies to avoid mutating originals
    const creditors = balances
      .filter((b) => b.balance > 0.001) // Use small threshold to avoid floating point issues
      .map((b) => ({ ...b }))
      .sort((a, b) => b.balance - a.balance); // Highest balance first

    const debtors = balances
      .filter((b) => b.balance < -0.001) // Use small threshold
      .map((b) => ({ ...b }))
      .sort((a, b) => a.balance - b.balance); // Most negative first (lowest balance first)

    const settlements: Settlement[] = [];

    let i = 0; // creditor index
    let j = 0; // debtor index

    while (i < creditors.length && j < debtors.length) {
      const creditor = creditors[i];
      const debtor = debtors[j];

      // Amount is the minimum of what creditor is owed and what debtor owes
      const amount = Math.min(creditor.balance, Math.abs(debtor.balance));

      // Only create settlement if amount is significant (> 0.01)
      if (amount > 0.01) {
        settlements.push({
          from: debtor.userId,
          fromName: debtor.name,
          to: creditor.userId,
          toName: creditor.name,
          amount: Math.round(amount * 100) / 100,
        });
      }

      // Update remaining balances
      creditor.balance -= amount;
      debtor.balance += amount;

      // Move to next creditor/debtor if fully settled
      if (creditor.balance < 0.001) {
        i++;
      }
      if (Math.abs(debtor.balance) < 0.001) {
        j++;
      }
    }

    return settlements;
  }

  /**
   * Get simplified debt settlement for a trip.
   */
  async getSimplifiedDebts(tripId: string): Promise<DebtSimplificationResult> {
    const balances = await this.calculateBalances(tripId);
    const settlements = this.simplifyDebts(balances);

    return {
      balances,
      settlements,
    };
  }
}

export const debtSimplifierService = new DebtSimplifierService();
