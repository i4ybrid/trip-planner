import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BillSplitService } from './billSplit.service';
import { createStubs } from '@/lib/stubs';
import { setPrisma, resetPrisma } from '@/lib/prisma-client';

describe('BillSplitService - Settlement Reset on New Charge', () => {
  let billSplitService: BillSplitService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(() => {
    stubs = createStubs();
    setPrisma(stubs.prisma.getImplementation() as any);
    billSplitService = new BillSplitService();
  });

  afterEach(() => {
    resetPrisma();
  });

  async function setupTripWithSettledMembers() {
    // Access the internal Maps directly for seeding test data
    const prismaInternal = stubs.prisma as any;
    
    // Create users
    const user1 = { id: 'user-1', email: 'user1@test.com', name: 'User 1', avatarUrl: null, phone: null, venmo: null, paypal: null, zelle: null, cashapp: null, passwordHash: null, createdAt: new Date(), updatedAt: new Date() };
    const user2 = { id: 'user-2', email: 'user2@test.com', name: 'User 2', avatarUrl: null, phone: null, venmo: null, paypal: null, zelle: null, cashapp: null, passwordHash: null, createdAt: new Date(), updatedAt: new Date() };
    prismaInternal.users.set(user1.id, user1);
    prismaInternal.users.set(user2.id, user2);

    // Create trip
    const trip = { id: 'trip-1', name: 'Test Trip', description: null, destination: null, startDate: null, endDate: null, coverImage: null, status: 'PLANNING', tripMasterId: 'user-1', style: 'OPEN', autoMilestonesGenerated: false, createdAt: new Date(), updatedAt: new Date() };
    prismaInternal.trips.set(trip.id, trip);

    // Create confirmed trip members
    const member1 = { id: 'member-1', tripId: 'trip-1', userId: 'user-1', role: 'ORGANIZER', status: 'CONFIRMED', joinedAt: new Date(), invitedById: null };
    const member2 = { id: 'member-2', tripId: 'trip-1', userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED', joinedAt: new Date(), invitedById: null };
    prismaInternal.members.set(`${member1.tripId}-${member1.userId}`, member1);
    prismaInternal.members.set(`${member2.tripId}-${member2.userId}`, member2);

    // Create SETTLEMENT_DUE and SETTLEMENT_COMPLETE milestones
    const settlementDueMilestone = { id: 'ms-settlement-due', tripId: 'trip-1', type: 'SETTLEMENT_DUE', name: 'Settlement Due', dueDate: new Date(), isManualOverride: false, isSkipped: false, isLocked: false, isHard: true, priority: 0, createdAt: new Date(), updatedAt: new Date() };
    const settlementCompleteMilestone = { id: 'ms-settlement-complete', tripId: 'trip-1', type: 'SETTLEMENT_COMPLETE', name: 'Settlement Complete', dueDate: new Date(), isManualOverride: false, isSkipped: false, isLocked: false, isHard: true, priority: 0, createdAt: new Date(), updatedAt: new Date() };
    prismaInternal.milestones.set(settlementDueMilestone.id, settlementDueMilestone);
    prismaInternal.milestones.set(settlementCompleteMilestone.id, settlementCompleteMilestone);

    // Mark both members as settled (SETTLEMENT_DUE and SETTLEMENT_COMPLETE completed)
    const completion1 = { id: 'mc-1', milestoneId: 'ms-settlement-due', userId: 'user-1', status: 'COMPLETED', completedAt: new Date(), note: null, createdAt: new Date() };
    const completion2 = { id: 'mc-2', milestoneId: 'ms-settlement-due', userId: 'user-2', status: 'COMPLETED', completedAt: new Date(), note: null, createdAt: new Date() };
    const completeCompletion1 = { id: 'mc-3', milestoneId: 'ms-settlement-complete', userId: 'user-1', status: 'COMPLETED', completedAt: new Date(), note: null, createdAt: new Date() };
    const completeCompletion2 = { id: 'mc-4', milestoneId: 'ms-settlement-complete', userId: 'user-2', status: 'COMPLETED', completedAt: new Date(), note: null, createdAt: new Date() };
    
    prismaInternal.milestoneCompletions.set(`${completion1.milestoneId}-${completion1.userId}`, completion1);
    prismaInternal.milestoneCompletions.set(`${completion2.milestoneId}-${completion2.userId}`, completion2);
    prismaInternal.milestoneCompletions.set(`${completeCompletion1.milestoneId}-${completeCompletion1.userId}`, completeCompletion1);
    prismaInternal.milestoneCompletions.set(`${completeCompletion2.milestoneId}-${completeCompletion2.userId}`, completeCompletion2);

    return { trip, user1, user2, member1, member2, settlementDueMilestone, settlementCompleteMilestone };
  }

  it('should reset SETTLEMENT_DUE milestone completions when a new bill split is created', async () => {
    const prisma = stubs.prisma.getImplementation();
    const { trip } = await setupTripWithSettledMembers();

    // Verify pre-condition: members have COMPLETED milestone
    const preCompletion1 = await prisma.milestoneCompletion.findUnique({
      where: { milestoneId_userId: { milestoneId: 'ms-settlement-due', userId: 'user-1' } },
    });
    expect(preCompletion1?.status).toBe('COMPLETED');

    // Create a new bill split - this should reset settlement milestones for affected members
    await billSplitService.createBillSplit({
      tripId: trip.id,
      title: 'New Expense',
      amount: 100,
      currency: 'USD',
      splitType: 'EQUAL',
      paidBy: 'user-1',
      createdBy: 'user-1',
    });

    // Verify: SETTLEMENT_DUE completions for user-1 and user-2 should be deleted (reset to PENDING)
    const afterCompletion1 = await prisma.milestoneCompletion.findUnique({
      where: { milestoneId_userId: { milestoneId: 'ms-settlement-due', userId: 'user-1' } },
    });
    const afterCompletion2 = await prisma.milestoneCompletion.findUnique({
      where: { milestoneId_userId: { milestoneId: 'ms-settlement-due', userId: 'user-2' } },
    });

    expect(afterCompletion1).toBeUndefined(); // Reset - no completion record
    expect(afterCompletion2).toBeUndefined(); // Reset - no completion record
  });

  it('should reset SETTLEMENT_COMPLETE milestone completions when a new bill split is created', async () => {
    const prisma = stubs.prisma.getImplementation();
    const { trip } = await setupTripWithSettledMembers();

    // Verify pre-condition: members have COMPLETED milestone for SETTLEMENT_COMPLETE
    const preCompletion1 = await prisma.milestoneCompletion.findUnique({
      where: { milestoneId_userId: { milestoneId: 'ms-settlement-complete', userId: 'user-1' } },
    });
    expect(preCompletion1?.status).toBe('COMPLETED');

    // Create a new bill split
    await billSplitService.createBillSplit({
      tripId: trip.id,
      title: 'New Expense',
      amount: 100,
      currency: 'USD',
      splitType: 'EQUAL',
      paidBy: 'user-1',
      createdBy: 'user-1',
    });

    // Verify: SETTLEMENT_COMPLETE completions should also be deleted
    const afterCompletion1 = await prisma.milestoneCompletion.findUnique({
      where: { milestoneId_userId: { milestoneId: 'ms-settlement-complete', userId: 'user-1' } },
    });
    const afterCompletion2 = await prisma.milestoneCompletion.findUnique({
      where: { milestoneId_userId: { milestoneId: 'ms-settlement-complete', userId: 'user-2' } },
    });

    expect(afterCompletion1).toBeUndefined();
    expect(afterCompletion2).toBeUndefined();
  });

  it('should not affect milestone completions when no SETTLEMENT_DUE milestone exists', async () => {
    const prismaInternal = stubs.prisma as any;
    
    // Create users
    const user1 = { id: 'user-1', email: 'user1@test.com', name: 'User 1', avatarUrl: null, phone: null, venmo: null, paypal: null, zelle: null, cashapp: null, passwordHash: null, createdAt: new Date(), updatedAt: new Date() };
    prismaInternal.users.set(user1.id, user1);

    // Create trip
    const trip = { id: 'trip-1', name: 'Test Trip', description: null, destination: null, startDate: null, endDate: null, coverImage: null, status: 'PLANNING', tripMasterId: 'user-1', style: 'OPEN', autoMilestonesGenerated: false, createdAt: new Date(), updatedAt: new Date() };
    prismaInternal.trips.set(trip.id, trip);

    // Create confirmed trip member
    const member1 = { id: 'member-1', tripId: 'trip-1', userId: 'user-1', role: 'ORGANIZER', status: 'CONFIRMED', joinedAt: new Date(), invitedById: null };
    prismaInternal.members.set(`${member1.tripId}-${member1.userId}`, member1);

    // Note: No SETTLEMENT_DUE milestone created - it doesn't exist

    // Create a new bill split - should not throw even without milestones
    await billSplitService.createBillSplit({
      tripId: trip.id,
      title: 'New Expense',
      amount: 100,
      currency: 'USD',
      splitType: 'EQUAL',
      paidBy: 'user-1',
      createdBy: 'user-1',
    });

    // Should complete without error
  });
});
