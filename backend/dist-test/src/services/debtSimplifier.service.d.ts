export interface MemberBalance {
    userId: string;
    name: string;
    balance: number;
}
export interface Settlement {
    from: string;
    fromName: string;
    to: string;
    toName: string;
    amount: number;
}
export interface DebtSimplificationResult {
    balances: MemberBalance[];
    settlements: Settlement[];
}
export declare class DebtSimplifierService {
    /**
     * Calculate balances for all trip members based on bill splits.
     * Balance = (total paid by member) - (total owed by member)
     * Positive balance = member is owed money
     * Negative balance = member owes money
     */
    calculateBalances(tripId: string): Promise<MemberBalance[]>;
    /**
     * Simplify debts using a greedy algorithm.
     * Matches debtors (negative balance) with creditors (positive balance)
     * to minimize the number of transactions.
     */
    simplifyDebts(balances: MemberBalance[]): Settlement[];
    /**
     * Get simplified debt settlement for a trip.
     */
    getSimplifiedDebts(tripId: string): Promise<DebtSimplificationResult>;
}
export declare const debtSimplifierService: DebtSimplifierService;
//# sourceMappingURL=debtSimplifier.service.d.ts.map