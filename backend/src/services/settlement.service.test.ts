import { describe, it, expect } from 'vitest';
import { checkMemberIsSettled } from './settlement.service';
import { BillSplit, BillSplitMember, PaymentStatus } from '@prisma/client';

type BillSplitWithMembers = BillSplit & { members: BillSplitMember[] };

function makeBillSplit(overrides: Partial<BillSplit> & { members: BillSplitMember[] }): BillSplitWithMembers {
  return {
    id: 'bs-1',
    tripId: 'trip-1',
    activityId: null,
    title: 'Test Bill',
    description: null,
    amount: 100,
    currency: 'USD',
    splitType: 'EQUAL',
    paidBy: 'payer-1',
    createdBy: 'creator-1',
    status: 'PENDING',
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as BillSplitWithMembers;
}

function makeMember(userId: string, status: PaymentStatus = 'PENDING'): BillSplitMember {
  return {
    id: `m-${userId}`,
    billSplitId: 'bs-1',
    userId,
    dollarAmount: 50,
    type: 'EQUAL',
    percentage: null,
    shares: null,
    status,
    paidAt: null,
    paymentMethod: null,
    transactionId: null,
  };
}

describe('checkMemberIsSettled', () => {
  it('should return true when all bill splits are CONFIRMED and all member entries are PAID', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PAID'),
          makeMember('user-2', 'PAID'),
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(true);
    expect(checkMemberIsSettled('user-2', billSplits)).toBe(true);
  });

  it('should return true when member entry is CONFIRMED (payer confirmed)', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'CONFIRMED'),
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(true);
  });

  it('should return false when the bill split itself is not CONFIRMED', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'PENDING',
        members: [
          makeMember('user-1', 'PAID'),
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(false);
  });

  it('should return false when member entry status is PENDING', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PENDING'),
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(false);
  });

  it('should return false when member entry status is REJECTED', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'REJECTED'),
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(false);
  });

  it('should skip members not part of a bill split (they owe nothing)', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PAID'),
          // user-2 is not in this split
        ],
      }),
    ];

    // user-2 not in any split → nothing to pay → considered settled
    expect(checkMemberIsSettled('user-2', billSplits)).toBe(true);
  });

  it('should return false if any one bill split is not settled for this member', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        id: 'bs-1',
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PAID'),
        ],
      }),
      makeBillSplit({
        id: 'bs-2',
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PENDING'), // not paid yet
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(false);
  });

  it('should return false if any one bill split is not confirmed by payer', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        id: 'bs-1',
        status: 'CONFIRMED',
        members: [makeMember('user-1', 'PAID')],
      }),
      makeBillSplit({
        id: 'bs-2',
        status: 'PENDING', // payer hasn't confirmed
        members: [makeMember('user-1', 'PAID')],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(false);
  });

  it('should return true for member overpaying (netBalance > 0) when all splits are settled', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PAID'),
        ],
      }),
    ];

    // user-1 paid their $50 share even though they overpaid in the broader trip sense
    expect(checkMemberIsSettled('user-1', billSplits)).toBe(true);
  });

  it('should handle multiple bill splits with multiple members', () => {
    const billSplits: BillSplitWithMembers[] = [
      makeBillSplit({
        id: 'bs-1',
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PAID'),
          makeMember('user-2', 'PENDING'),
        ],
      }),
      makeBillSplit({
        id: 'bs-2',
        status: 'CONFIRMED',
        members: [
          makeMember('user-1', 'PAID'),
          makeMember('user-2', 'PAID'),
        ],
      }),
    ];

    expect(checkMemberIsSettled('user-1', billSplits)).toBe(true);
    expect(checkMemberIsSettled('user-2', billSplits)).toBe(false); // still PENDING in bs-1
  });
});
