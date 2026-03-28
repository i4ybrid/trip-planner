import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MilestoneService } from './milestone.service';
import { createStubs } from '@/lib/stubs';
import { setPrisma, resetPrisma } from '@/lib/prisma-client';

describe('MilestoneService', () => {
  let milestoneService: MilestoneService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(() => {
    stubs = createStubs();
    setPrisma(stubs.prisma.getImplementation() as any);
    milestoneService = new MilestoneService();
  });

  afterEach(() => {
    resetPrisma();
  });

  describe('generateDefaultMilestones', () => {
    it('should create milestones with correct structure', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-123';
      const startDate = new Date('2026-06-01');
      const endDate = new Date('2026-06-07');
      const tripCreatedAt = new Date('2026-03-01');

      await milestoneService.generateDefaultMilestones(tripId, startDate, endDate, tripCreatedAt);

      // Verify milestones were created
      const milestones = await prisma.milestone.findMany({ where: { tripId } });
      expect(milestones.length).toBe(5); // 5 templates

      // Verify trip was marked as auto-generated
      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      expect(trip?.autoMilestonesGenerated).toBe(true);
    });

    it('should create milestones at correct percentages for standard trip', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-t1';
      // Trip start: June 1, 2026, end: Oct 1, 2026 = 122 days (>= 120, Tier 1)
      const startDate = new Date('2026-06-01');
      const endDate = new Date('2026-10-01');
      const tripCreatedAt = new Date('2026-01-01');

      await milestoneService.generateDefaultMilestones(tripId, startDate, endDate, tripCreatedAt);

      const milestones = await prisma.milestone.findMany({ where: { tripId } });
      const milestoneMap = new Map(milestones.map(m => [m.type, m]));

      // COMMITTED: T - 60 days from start
      const commitmentRequest = milestoneMap.get('COMMITMENT_REQUEST');
      expect(commitmentRequest).toBeDefined();
      const expectedCommitRequest = new Date(startDate);
      expectedCommitRequest.setDate(expectedCommitRequest.getDate() - 60);
      expect(commitmentRequest!.dueDate.toDateString()).toBe(expectedCommitRequest.toDateString());

      // COMMITMENT_DEADLINE: T - 30 days
      const commitmentDeadline = milestoneMap.get('COMMITMENT_DEADLINE');
      expect(commitmentDeadline).toBeDefined();
      const expectedCommitDeadline = new Date(startDate);
      expectedCommitDeadline.setDate(expectedCommitDeadline.getDate() - 30);
      expect(commitmentDeadline!.dueDate.toDateString()).toBe(expectedCommitDeadline.toDateString());

      // FINAL_PAYMENT_DUE: T - 7 days
      const finalPayment = milestoneMap.get('FINAL_PAYMENT_DUE');
      expect(finalPayment).toBeDefined();
      const expectedFinalPayment = new Date(startDate);
      expectedFinalPayment.setDate(expectedFinalPayment.getDate() - 7);
      expect(finalPayment!.dueDate.toDateString()).toBe(expectedFinalPayment.toDateString());

      // SETTLEMENT_DUE: T + 7 days
      const settlementDue = milestoneMap.get('SETTLEMENT_DUE');
      expect(settlementDue).toBeDefined();
      const expectedSettlementDue = new Date(startDate);
      expectedSettlementDue.setDate(expectedSettlementDue.getDate() + 7);
      expect(settlementDue!.dueDate.toDateString()).toBe(expectedSettlementDue.toDateString());

      // SETTLEMENT_COMPLETE: T + 14 days
      const settlementComplete = milestoneMap.get('SETTLEMENT_COMPLETE');
      expect(settlementComplete).toBeDefined();
      const expectedSettlementComplete = new Date(startDate);
      expectedSettlementComplete.setDate(expectedSettlementComplete.getDate() + 14);
      expect(settlementComplete!.dueDate.toDateString()).toBe(expectedSettlementComplete.toDateString());
    });

    it('should delete existing milestones before generating new ones', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-del-test';

      // Create a pre-existing milestone
      await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Old Milestone',
          dueDate: new Date('2026-01-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      // Generate new milestones
      await milestoneService.generateDefaultMilestones(
        tripId,
        new Date('2026-06-01'),
        new Date('2026-06-07'),
        new Date('2026-03-01')
      );

      // Old milestone should be gone
      const allMilestones = await prisma.milestone.findMany({ where: { tripId } });
      expect(allMilestones.some(m => m.name === 'Old Milestone')).toBe(false);
      expect(allMilestones.length).toBe(5); // Only the new 5 templates
    });

    it('should mark trip autoMilestonesGenerated as true after generation', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-auto-gen';

      // Create trip first
      await prisma.trip.create({
        data: {
          id: tripId,
          name: 'Test Trip',
          status: 'PLANNING',
          tripMasterId: 'user-1',
          autoMilestonesGenerated: false,
        },
      });

      await milestoneService.generateDefaultMilestones(
        tripId,
        new Date('2026-06-01'),
        new Date('2026-06-07'),
        new Date('2026-03-01')
      );

      const trip = await prisma.trip.findUnique({ where: { id: tripId } });
      expect(trip?.autoMilestonesGenerated).toBe(true);
    });

    it('should create milestones with correct isHard values', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-hard-test';

      await milestoneService.generateDefaultMilestones(
        tripId,
        new Date('2026-06-01'),
        new Date('2026-06-07'),
        new Date('2026-03-01')
      );

      const milestones = await prisma.milestone.findMany({ where: { tripId } });
      const milestoneMap = new Map(milestones.map(m => [m.type, m]));

      expect(milestoneMap.get('COMMITMENT_REQUEST')!.isHard).toBe(false);
      expect(milestoneMap.get('COMMITMENT_DEADLINE')!.isHard).toBe(true);
      expect(milestoneMap.get('FINAL_PAYMENT_DUE')!.isHard).toBe(true);
      expect(milestoneMap.get('SETTLEMENT_DUE')!.isHard).toBe(true);
      expect(milestoneMap.get('SETTLEMENT_COMPLETE')!.isHard).toBe(false);
    });
  });

  describe('recalculateMilestones', () => {
    it('should not update locked milestones during recalculation', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-recalc-locked';

      // Create milestones with one locked
      await prisma.milestone.createMany({
        data: [
          {
            tripId,
            type: 'COMMITMENT_REQUEST',
            name: 'Commitment Request',
            dueDate: new Date('2026-04-01'),
            isHard: false,
            isLocked: true, // Locked - should not be updated
            isSkipped: false,
            isManualOverride: false,
            priority: 1,
          },
          {
            tripId,
            type: 'COMMITMENT_DEADLINE',
            name: 'Commitment Deadline',
            dueDate: new Date('2026-05-01'),
            isHard: true,
            isLocked: false, // Not locked - should be updated
            isSkipped: false,
            isManualOverride: false,
            priority: 2,
          },
        ],
      });

      // Recalculate with new start date (shifted by 10 days)
      const newStartDate = new Date('2026-06-11'); // Original was June 1
      await milestoneService.recalculateMilestones(tripId, newStartDate);

      const milestones = await prisma.milestone.findMany({ where: { tripId } });
      const commitmentRequest = milestones.find(m => m.type === 'COMMITMENT_REQUEST');
      const commitmentDeadline = milestones.find(m => m.type === 'COMMITMENT_DEADLINE');

      // Locked milestone should NOT have changed
      expect(commitmentRequest!.dueDate.toDateString()).toBe(new Date('2026-04-01').toDateString());

      // Unlocked milestone should be updated (was T-30 from June 1 = May 2; now T-30 from June 11 = May 12)
      expect(commitmentDeadline!.dueDate.toDateString()).toBe(new Date('2026-05-12').toDateString());
    });

    it('should not update skipped milestones during recalculation', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-recalc-skipped';

      await prisma.milestone.createMany({
        data: [
          {
            tripId,
            type: 'COMMITMENT_REQUEST',
            name: 'Commitment Request',
            dueDate: new Date('2026-04-01'),
            isHard: false,
            isLocked: false,
            isSkipped: true, // Skipped - should not be updated
            isManualOverride: false,
            priority: 1,
          },
          {
            tripId,
            type: 'COMMITMENT_DEADLINE',
            name: 'Commitment Deadline',
            dueDate: new Date('2026-05-01'),
            isHard: true,
            isLocked: false,
            isSkipped: false, // Not skipped - should be updated
            isManualOverride: false,
            priority: 2,
          },
        ],
      });

      const newStartDate = new Date('2026-06-11');
      await milestoneService.recalculateMilestones(tripId, newStartDate);

      const milestones = await prisma.milestone.findMany({ where: { tripId } });
      const commitmentRequest = milestones.find(m => m.type === 'COMMITMENT_REQUEST');
      const commitmentDeadline = milestones.find(m => m.type === 'COMMITMENT_DEADLINE');

      // Skipped milestone should NOT have changed
      expect(commitmentRequest!.dueDate.toDateString()).toBe(new Date('2026-04-01').toDateString());

      // Non-skipped should be updated
      expect(commitmentDeadline!.dueDate.toDateString()).toBe(new Date('2026-05-12').toDateString());
    });
  });

  describe('triggerOnDemandAction', () => {
    it('should create milestone action record for PAYMENT_REQUEST', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-action-1';

      // Setup: create trip
      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      await milestoneService.triggerOnDemandAction(
        tripId,
        'PAYMENT_REQUEST',
        'user-1',
        ['user-2', 'user-3'],
        'Please pay your share'
      );

      const actions = await prisma.milestoneAction.findMany({ where: { tripId } });
      expect(actions.length).toBe(1);
      expect(actions[0].actionType).toBe('PAYMENT_REQUEST');
      expect(actions[0].sentById).toBe('user-1');
      expect(actions[0].recipientIds).toEqual(['user-2', 'user-3']);
      expect(actions[0].message).toBe('Please pay your share');
    });

    it('should create milestone action record for SETTLEMENT_REMINDER', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-action-2';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      await milestoneService.triggerOnDemandAction(
        tripId,
        'SETTLEMENT_REMINDER',
        'user-1',
        ['user-2'],
        'Time to settle up'
      );

      const actions = await prisma.milestoneAction.findMany({ where: { tripId } });
      expect(actions.length).toBe(1);
      expect(actions[0].actionType).toBe('SETTLEMENT_REMINDER');
    });

    it('should create notification for each recipient', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-action-notif';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      await milestoneService.triggerOnDemandAction(
        tripId,
        'PAYMENT_REQUEST',
        'user-1',
        ['user-2', 'user-3'],
        'Please pay'
      );

      const notifications = await prisma.notification.findMany({ where: { tripId } });
      expect(notifications.length).toBe(2);
      const recipientIds = notifications.map(n => n.userId);
      expect(recipientIds).toContain('user-2');
      expect(recipientIds).toContain('user-3');
    });

    it('should use default message when none provided', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-action-default';

      await prisma.trip.create({
        data: { id: tripId, name: 'My Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      await milestoneService.triggerOnDemandAction(
        tripId,
        'SETTLEMENT_REMINDER',
        'user-1',
        ['user-2']
        // No message provided
      );

      const notifications = await prisma.notification.findMany({ where: { tripId } });
      expect(notifications[0].body).toBe('Reminder from My Trip organizer');
    });

    it('should throw error if trip not found', async () => {
      await expect(
        milestoneService.triggerOnDemandAction(
          'nonexistent-trip',
          'PAYMENT_REQUEST',
          'user-1',
          ['user-2']
        )
      ).rejects.toThrow('Trip not found');
    });
  });

  describe('getMilestonesWithProgress', () => {
    it('should return milestones with per-member completion status', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-progress';

      // Setup: create trip with members
      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-1', role: 'MASTER', status: 'CONFIRMED' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED' },
      });
      await prisma.user.create({
        data: { id: 'user-1', email: 'u1@test.com', name: 'User One', passwordHash: 'x' },
      });
      await prisma.user.create({
        data: { id: 'user-2', email: 'u2@test.com', name: 'User Two', passwordHash: 'x' },
      });

      // Create milestone
      const milestone = await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Commitment Request',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      // Create completion for one member
      await prisma.milestoneCompletion.create({
        data: {
          milestoneId: milestone.id,
          userId: 'user-1',
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      const result = await milestoneService.getMilestonesWithProgress(tripId);

      expect(result.length).toBe(1);
      expect(result[0].memberCompletions.length).toBe(2); // 2 members
      expect(result[0].completedCount).toBe(1);
      expect(result[0].totalMembers).toBe(2);

      const user1Completion = result[0].memberCompletions.find(c => c.userId === 'user-1');
      expect(user1Completion!.status).toBe('COMPLETED');

      const user2Completion = result[0].memberCompletions.find(c => c.userId === 'user-2');
      expect(user2Completion!.status).toBe('PENDING');
    });

    it('should only include CONFIRMED members', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-progress-confirmed';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-1', role: 'MASTER', status: 'CONFIRMED' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-2', role: 'MEMBER', status: 'PENDING' }, // Not confirmed
      });
      await prisma.user.create({
        data: { id: 'user-1', email: 'u1@test.com', name: 'User One', passwordHash: 'x' },
      });
      await prisma.user.create({
        data: { id: 'user-2', email: 'u2@test.com', name: 'User Two', passwordHash: 'x' },
      });

      await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Commitment Request',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      const result = await milestoneService.getMilestonesWithProgress(tripId);

      // Should only have 1 member (user-1), not user-2 (PENDING)
      expect(result[0].totalMembers).toBe(1);
      expect(result[0].memberCompletions.length).toBe(1);
    });
  });

  describe('createCustomMilestone', () => {
    it('should create a custom milestone with type CUSTOM', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-custom';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const result = await milestoneService.createCustomMilestone(tripId, {
        name: 'My Custom Milestone',
        dueDate: new Date('2026-07-01'),
        isHard: true,
        priority: 10,
      });

      expect(result.type).toBe('CUSTOM');
      expect(result.name).toBe('My Custom Milestone');
      expect(result.isHard).toBe(true);
      expect(result.priority).toBe(10);
      expect(result.isManualOverride).toBe(true);
    });
  });

  describe('updateMilestone', () => {
    it('should update milestone fields', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-update-ms';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const milestone = await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Old Name',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      const result = await milestoneService.updateMilestone(milestone.id, {
        name: 'New Name',
        isLocked: true,
        isHard: true,
      });

      expect(result.name).toBe('New Name');
      expect(result.isLocked).toBe(true);
      expect(result.isHard).toBe(true);
      expect(result.isManualOverride).toBe(true); // Should be set when dueDate or name changes
    });

    it('should set isManualOverride when dueDate is changed', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-update-date';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const milestone = await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Test',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      const result = await milestoneService.updateMilestone(milestone.id, {
        dueDate: new Date('2026-05-01'),
      });

      expect(result.isManualOverride).toBe(true);
    });
  });

  describe('updateMilestoneCompletion', () => {
    it('should create completion record', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-complete';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const milestone = await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Commitment Request',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      const result = await milestoneService.updateMilestoneCompletion(
        milestone.id,
        'user-1',
        'COMPLETED',
        'I committed!'
      );

      expect(result.status).toBe('COMPLETED');
      expect(result.note).toBe('I committed!');
      expect(result.completedAt).toBeDefined();
    });

    it('should update existing completion', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-complete-update';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const milestone = await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Commitment Request',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      // Create initial completion
      await milestoneService.updateMilestoneCompletion(milestone.id, 'user-1', 'COMPLETED');

      // Update to PENDING
      const result = await milestoneService.updateMilestoneCompletion(milestone.id, 'user-1', 'PENDING');

      expect(result.status).toBe('PENDING');
    });
  });

  describe('getMilestoneProgress', () => {
    it('should return milestone progress per member', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-get-progress';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-1', role: 'MASTER', status: 'CONFIRMED' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED' },
      });
      await prisma.user.create({
        data: { id: 'user-1', email: 'u1@test.com', name: 'User One', passwordHash: 'x' },
      });
      await prisma.user.create({
        data: { id: 'user-2', email: 'u2@test.com', name: 'User Two', passwordHash: 'x' },
      });

      const m1 = await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Commitment Request',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      await prisma.milestoneCompletion.create({
        data: { milestoneId: m1.id, userId: 'user-1', status: 'COMPLETED' },
      });

      const result = await milestoneService.getMilestoneProgress(tripId);

      expect(result.summary.totalMilestones).toBe(1);
      expect(result.memberProgress.length).toBe(2);
      expect(result.memberProgress[0].completedMilestones).toBe(1);
      expect(result.memberProgress[1].completedMilestones).toBe(0);
    });

    it('should exclude skipped milestones from total count', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-progress-skip';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });
      await prisma.tripMember.create({
        data: { tripId, userId: 'user-1', role: 'MASTER', status: 'CONFIRMED' },
      });
      await prisma.user.create({
        data: { id: 'user-1', email: 'u1@test.com', name: 'User One', passwordHash: 'x' },
      });

      await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_REQUEST',
          name: 'Active',
          dueDate: new Date('2026-04-01'),
          isHard: false,
          isLocked: false,
          isSkipped: false,
          isManualOverride: false,
          priority: 1,
        },
      });

      await prisma.milestone.create({
        data: {
          tripId,
          type: 'COMMITMENT_DEADLINE',
          name: 'Skipped',
          dueDate: new Date('2026-05-01'),
          isHard: false,
          isLocked: false,
          isSkipped: true, // Skipped
          isManualOverride: false,
          priority: 2,
        },
      });

      const result = await milestoneService.getMilestoneProgress(tripId);

      expect(result.summary.totalMilestones).toBe(1); // Only active ones
    });
  });
});
