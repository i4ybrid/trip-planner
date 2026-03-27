import { describe, it, expect } from 'vitest';
import { DebtSimplifierService, MemberBalance, Settlement } from './debtSimplifier.service';

describe('DebtSimplifierService', () => {
  let service: DebtSimplifierService;

  beforeEach(() => {
    service = new DebtSimplifierService();
  });

  describe('simplifyDebts', () => {
    it('should return empty arrays for empty balances', () => {
      const result = service.simplifyDebts([]);
      expect(result).toEqual([]);
    });

    it('should handle single person with zero balance', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 0 },
      ];
      const result = service.simplifyDebts(balances);
      expect(result).toEqual([]);
    });

    it('should handle single person with non-zero balance (edge case)', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 100 },
      ];
      const result = service.simplifyDebts(balances);
      // Single person can't settle with themselves
      expect(result).toEqual([]);
    });

    it('should handle two people where one owes the other', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 50 },
        { userId: 'B', name: 'Bob', balance: -50 },
      ];
      const result = service.simplifyDebts(balances);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        from: 'B',
        fromName: 'Bob',
        to: 'A',
        toName: 'Alice',
        amount: 50,
      });
    });

    it('should handle chain settlement (A->B->C)', () => {
      // A paid $100 (owes $30) → balance = +$70
      // B paid $0 (owes $50) → balance = -$50
      // C paid $0 (owes $20) → balance = -$20
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 70 },
        { userId: 'B', name: 'Bob', balance: -50 },
        { userId: 'C', name: 'Charlie', balance: -20 },
      ];
      const result = service.simplifyDebts(balances);
      // B pays A $50, C pays A $20 (2 transactions instead of 3)
      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        from: 'B',
        fromName: 'Bob',
        to: 'A',
        toName: 'Alice',
        amount: 50,
      });
      expect(result).toContainEqual({
        from: 'C',
        fromName: 'Charlie',
        to: 'A',
        toName: 'Alice',
        amount: 20,
      });
    });

    it('should handle circular debt (A owes B, B owes C, C owes A)', () => {
      // This creates a cycle that can be simplified
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 10 },
        { userId: 'B', name: 'Bob', balance: -10 },
        { userId: 'C', name: 'Charlie', balance: 0 },
      ];
      const result = service.simplifyDebts(balances);
      // Should simplify to B paying A $10
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        from: 'B',
        fromName: 'Bob',
        to: 'A',
        toName: 'Alice',
        amount: 10,
      });
    });

    it('should handle partial settlements', () => {
      // A is owed $50, B owes $30, C owes $20
      // Total credit = $50, Total debt = $50 (balanced)
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 50 },
        { userId: 'B', name: 'Bob', balance: -30 },
        { userId: 'C', name: 'Charlie', balance: -20 },
      ];
      const result = service.simplifyDebts(balances);
      // B pays A $30, C pays A $20 (2 transactions)
      expect(result).toHaveLength(2);
      const totalSettled = result.reduce((sum, s) => sum + s.amount, 0);
      expect(totalSettled).toBe(50); // $50 total debt settled
    });

    it('should handle zero amount debtors/creditors', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 0 },
        { userId: 'B', name: 'Bob', balance: 0 },
        { userId: 'C', name: 'Charlie', balance: 0 },
      ];
      const result = service.simplifyDebts(balances);
      expect(result).toEqual([]);
    });

    it('should handle negative amounts gracefully', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 25 },
        { userId: 'B', name: 'Bob', balance: -25 },
      ];
      const result = service.simplifyDebts(balances);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(25);
    });

    it('should handle very small amounts (floating point edge case)', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 0.01 },
        { userId: 'B', name: 'Bob', balance: -0.01 },
      ];
      const result = service.simplifyDebts(balances);
      // Small amounts below threshold should be filtered out
      expect(result).toHaveLength(0);
    });

    it('should handle large numbers correctly', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 10000 },
        { userId: 'B', name: 'Bob', balance: -5000 },
        { userId: 'C', name: 'Charlie', balance: -5000 },
      ];
      const result = service.simplifyDebts(balances);
      expect(result).toHaveLength(2);
      const totalSettled = result.reduce((sum, s) => sum + s.amount, 0);
      expect(totalSettled).toBe(10000);
    });

    it('should handle decimal amounts correctly', () => {
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 33.33 },
        { userId: 'B', name: 'Bob', balance: -33.33 },
      ];
      const result = service.simplifyDebts(balances);
      expect(result).toHaveLength(1);
      expect(result[0].amount).toBeCloseTo(33.33, 2);
    });

    it('should minimize number of transactions', () => {
      // 4 people: A is owed $60, B owes $20, C owes $20, D owes $20
      const balances: MemberBalance[] = [
        { userId: 'A', name: 'Alice', balance: 60 },
        { userId: 'B', name: 'Bob', balance: -20 },
        { userId: 'C', name: 'Charlie', balance: -20 },
        { userId: 'D', name: 'Diana', balance: -20 },
      ];
      const result = service.simplifyDebts(balances);
      // Should be 3 transactions (B->A, C->A, D->A), not 6
      expect(result).toHaveLength(3);
    });

    it('should handle unsorted input correctly', () => {
      const balances: MemberBalance[] = [
        { userId: 'C', name: 'Charlie', balance: -20 },
        { userId: 'A', name: 'Alice', balance: 70 },
        { userId: 'B', name: 'Bob', balance: -50 },
      ];
      const result = service.simplifyDebts(balances);
      // Should still produce correct simplified debts regardless of input order
      expect(result).toHaveLength(2);
      const totalFromB = result.filter(s => s.from === 'B').reduce((sum, s) => sum + s.amount, 0);
      const totalFromC = result.filter(s => s.from === 'C').reduce((sum, s) => sum + s.amount, 0);
      expect(totalFromB).toBe(50);
      expect(totalFromC).toBe(20);
    });
  });
});
