import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PaymentService } from './payment.service';

const mockPrisma = {
  booking: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  tripMember: {
    findMany: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('PaymentService', () => {
  let paymentService: PaymentService;

  beforeEach(() => {
    vi.resetAllMocks();
    paymentService = new PaymentService(mockPrismaClient);
  });

  describe('calculateSplits', () => {
    const baseInput = {
      tripId: 'trip-1',
      description: 'Dinner',
      amount: 100,
      paidById: 'user-1',
      splitType: 'equal' as const,
    };

    it('should split equally among all members', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
        { userId: 'user-3', status: 'CONFIRMED' },
        { userId: 'user-4', status: 'CONFIRMED' },
      ]);

      const splits = await paymentService.calculateSplits(baseInput);

      expect(splits).toHaveLength(4);
      splits.forEach(split => {
        expect(split.amount).toBe(25);
        expect(split.isPaid).toBe(split.userId === 'user-1');
      });
    });

    it('should split by shares', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);

      const input = {
        ...baseInput,
        splitType: 'shares' as const,
        splits: [
          { userId: 'user-1', shares: 2 },
          { userId: 'user-2', shares: 1 },
        ],
      };

      const splits = await paymentService.calculateSplits(input);

      expect(splits.find(s => s.userId === 'user-1')?.amount).toBeCloseTo(66.67, 1);
      expect(splits.find(s => s.userId === 'user-2')?.amount).toBeCloseTo(33.33, 1);
    });

    it('should split by percentage', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);

      const input = {
        ...baseInput,
        splitType: 'percentage' as const,
        splits: [
          { userId: 'user-1', percentage: 70 },
          { userId: 'user-2', percentage: 30 },
        ],
      };

      const splits = await paymentService.calculateSplits(input);

      expect(splits.find(s => s.userId === 'user-1')?.amount).toBe(70);
      expect(splits.find(s => s.userId === 'user-2')?.amount).toBe(30);
    });

    it('should split by custom amounts', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);

      const input = {
        ...baseInput,
        splitType: 'custom' as const,
        splits: [
          { userId: 'user-1', amount: 75 },
          { userId: 'user-2', amount: 25 },
        ],
      };

      const splits = await paymentService.calculateSplits(input);

      expect(splits.find(s => s.userId === 'user-1')?.amount).toBe(75);
      expect(splits.find(s => s.userId === 'user-2')?.amount).toBe(25);
    });

    it('should include tax and tip in split calculation', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);

      const input = {
        ...baseInput,
        amount: 100,
        taxAmount: 10,
        tipAmount: 10,
      };

      const splits = await paymentService.calculateSplits(input);

      splits.forEach(split => {
        expect(split.amount).toBe(60);
      });
    });

    it('should throw error for invalid split type', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([]);
      
      const input = {
        ...baseInput,
        splitType: 'invalid' as any,
      };

      await expect(paymentService.calculateSplits(input)).rejects.toThrow('Invalid split type');
    });
  });

  describe('calculateSettlements', () => {
    it('should calculate settlements between members', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        { tripId: 'trip-1', bookedBy: 'user-1', status: 'CONFIRMED', notes: '$50' },
        { tripId: 'trip-1', bookedBy: 'user-2', status: 'CONFIRMED', notes: '$50' },
      ]);

      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);

      const settlements = await paymentService.calculateSettlements('trip-1');

      expect(settlements).toHaveLength(0);
    });

    it('should calculate single settlement when one paid all', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([
        { tripId: 'trip-1', bookedBy: 'user-1', status: 'CONFIRMED', notes: '$100' },
      ]);

      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);

      const settlements = await paymentService.calculateSettlements('trip-1');

      expect(settlements).toHaveLength(1);
      expect(settlements[0].fromUserId).toBe('user-2');
      expect(settlements[0].toUserId).toBe('user-1');
      expect(settlements[0].amount).toBe(50);
    });
  });

  describe('generatePaymentLink', () => {
    it('should generate Venmo payment link', () => {
      const link = paymentService.generatePaymentLink('johndoe', 50, 'venmo');
      expect(link).toContain('venmo.com');
      expect(link).toContain('johndoe');
      expect(link).toContain('50');
    });

    it('should generate PayPal payment link', () => {
      const link = paymentService.generatePaymentLink('johndoe', 25, 'paypal');
      expect(link).toContain('paypal.me');
      expect(link).toContain('johndoe');
    });

    it('should generate Zelle payment link', () => {
      const link = paymentService.generatePaymentLink('johndoe@email.com', 100, 'zelle');
      expect(link).toContain('zelle');
      expect(link).toContain('johndoe@email.com');
    });
  });

  describe('deleteExpense', () => {
    it('should delete own expense', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'expense-1',
        bookedBy: 'user-1',
        tripId: 'trip-1',
      });
      mockPrisma.booking.delete.mockResolvedValue({} as any);

      await paymentService.deleteExpense('expense-1', 'user-1');

      expect(mockPrisma.booking.delete).toHaveBeenCalledWith({
        where: { id: 'expense-1' },
      });
    });

    it('should throw when deleting another user expense', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'expense-1',
        bookedBy: 'user-1',
        tripId: 'trip-1',
      });

      await expect(
        paymentService.deleteExpense('expense-1', 'user-2')
      ).rejects.toThrow('Not authorized to delete this expense');
    });

    it('should throw when expense not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);

      await expect(
        paymentService.deleteExpense('expense-1', 'user-1')
      ).rejects.toThrow('Expense not found');
    });
  });

  describe('createExpense', () => {
    it('should create expense with splits', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1', status: 'CONFIRMED' },
        { userId: 'user-2', status: 'CONFIRMED' },
      ]);
      mockPrisma.booking.create.mockResolvedValue({
        id: 'expense-1',
        tripId: 'trip-1',
        bookedBy: 'user-1',
        status: 'CONFIRMED',
        notes: 'Dinner',
      });

      const result = await paymentService.createExpense({
        tripId: 'trip-1',
        description: 'Dinner',
        amount: 100,
        paidById: 'user-1',
        splitType: 'equal',
      });

      expect(result.expense.id).toBe('expense-1');
      expect(result.splits).toHaveLength(2);
      expect(mockPrisma.booking.create).toHaveBeenCalledWith({
        data: {
          tripId: 'trip-1',
          bookedBy: 'user-1',
          status: 'CONFIRMED',
          notes: 'Dinner',
        },
      });
    });
  });

  describe('getTripExpenses', () => {
    it('should return all expenses for a trip', async () => {
      const expenses = [
        { id: 'expense-1', tripId: 'trip-1', notes: 'Dinner' },
        { id: 'expense-2', tripId: 'trip-1', notes: 'Hotel' },
      ];
      mockPrisma.booking.findMany.mockResolvedValue(expenses as any);

      const result = await paymentService.getTripExpenses('trip-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.booking.findMany).toHaveBeenCalledWith({
        where: { tripId: 'trip-1' },
        orderBy: { createdAt: 'desc' },
        include: { trip: true },
      });
    });
  });
});
