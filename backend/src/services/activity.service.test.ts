import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ActivityService } from './activity.service';
import { createStubs } from '@/lib/stubs';
import { setPrisma, resetPrisma } from '@/lib/prisma-client';

describe('ActivityService', () => {
  let activityService: ActivityService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(() => {
    stubs = createStubs();
    setPrisma(stubs.prisma.getImplementation() as any);
    activityService = new ActivityService();
  });

  afterEach(() => {
    resetPrisma();
  });

  describe('createActivity', () => {
    it('should create activity with correct fields', async () => {
      const prisma = stubs.prisma.getImplementation();

      const activity = await activityService.createActivity({
        tripId: 'trip-1',
        title: 'Beach Day',
        description: 'Relax on the beach',
        proposedBy: 'user-1',
        proposedByName: 'Test User',
        location: 'Waikiki Beach',
        scheduledDate: new Date('2026-06-15'),
        estimatedCost: 50,
        currency: 'USD',
        activityType: 'LEISURE',
      });

      expect(activity.title).toBe('Beach Day');
      expect(activity.description).toBe('Relax on the beach');
      expect(activity.proposedBy).toBe('user-1');
      expect(activity.location).toBe('Waikiki Beach');
      expect(activity.estimatedCost).toBe(50);
      expect(activity.currency).toBe('USD');
      expect(activity.activityType).toBe('LEISURE');

      // Verify it was stored
      const stored = await prisma.activity.findUnique({ where: { id: activity.id } });
      expect(stored).toBeDefined();
    });

    it('should include proposer info in response', async () => {
      const prisma = stubs.prisma.getImplementation();
      await prisma.user.create({
        data: { id: 'user-proposer', email: 'proposer@test.com', name: 'Proposer', passwordHash: 'x' },
      });

      const activity = await activityService.createActivity({
        tripId: 'trip-1',
        title: 'Test Activity',
        proposedBy: 'user-proposer',
        proposedByName: 'Proposer',
      });

      expect(activity.proposer).toBeDefined();
      expect(activity.proposer!.id).toBe('user-proposer');
      expect(activity.proposer!.name).toBe('Proposer');
    });

    it('should create timeline event when activity is added', async () => {
      const prisma = stubs.prisma.getImplementation();

      await activityService.createActivity({
        tripId: 'trip-timeline',
        title: 'Timeline Test Activity',
        proposedBy: 'user-1',
        proposedByName: 'Test User',
      });

      const events = await prisma.timelineEvent.findMany({ where: { tripId: 'trip-timeline' } });
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('activity_added');
    });

    it('should default currency to USD', async () => {
      const activity = await activityService.createActivity({
        tripId: 'trip-1',
        title: 'Test Activity',
        proposedBy: 'user-1',
        proposedByName: 'Test User',
      });

      expect(activity.currency).toBe('USD');
    });
  });

  describe('getActivityById', () => {
    it('should return activity with votes and proposer', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-get-activity';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: {
          tripId,
          title: 'Find Activity',
          proposedBy: 'user-1',
          proposedByName: 'Test User',
          status: 'PROPOSED',
        },
      });

      await prisma.user.create({
        data: { id: 'user-1', email: 'u1@test.com', name: 'User One', passwordHash: 'x' },
      });

      await prisma.vote.create({
        data: { activityId: activity.id, userId: 'user-1', option: 'YES' },
      });

      const result = await activityService.getActivityById(activity.id);

      expect(result).toBeDefined();
      expect(result!.title).toBe('Find Activity');
      expect(result!.proposer).toBeDefined();
      expect(result!.votes).toBeDefined();
      expect(result!.votes.length).toBe(1);
      expect(result!.votes[0].option).toBe('YES');
    });

    it('should return null for non-existent activity', async () => {
      const result = await activityService.getActivityById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getTripActivities', () => {
    it('should return all activities for a trip', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-activities';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      await prisma.activity.create({
        data: { tripId, title: 'Activity 1', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });
      await prisma.activity.create({
        data: { tripId, title: 'Activity 2', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      const result = await activityService.getTripActivities(tripId);

      expect(result.length).toBe(2);
    });

    it('should return activities in descending order by createdAt', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-order';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const a1 = await prisma.activity.create({
        data: { tripId, title: 'First', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });
      await new Promise(r => setTimeout(r, 10));
      const a2 = await prisma.activity.create({
        data: { tripId, title: 'Second', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      const result = await activityService.getTripActivities(tripId);

      expect(result[0].id).toBe(a2.id);
      expect(result[1].id).toBe(a1.id);
    });

    it('should include vote counts', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-votes';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: { tripId, title: 'Vote Test', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-1', option: 'YES' } });
      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-2', option: 'YES' } });
      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-3', option: 'NO' } });

      const result = await activityService.getTripActivities(tripId);

      expect(result[0]._count).toBeDefined();
      expect(result[0]._count.votes).toBe(3);
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-del-act';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: { tripId, title: 'To Delete', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      const result = await activityService.deleteActivity(activity.id);

      expect(result.id).toBe(activity.id);

      const found = await prisma.activity.findUnique({ where: { id: activity.id } });
      expect(found).toBeNull();
    });

    it('should create timeline event when activity is deleted', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-del-timeline';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: { tripId, title: 'To Delete', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      await activityService.deleteActivity(activity.id);

      const events = await prisma.timelineEvent.findMany({ where: { tripId } });
      expect(events.some(e => e.eventType === 'activity_removed')).toBe(true);
    });
  });

  describe('getVoteCounts', () => {
    it('should return correct vote counts', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-votecounts';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: { tripId, title: 'Vote Count Test', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-1', option: 'YES' } });
      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-2', option: 'YES' } });
      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-3', option: 'NO' } });
      await prisma.vote.create({ data: { activityId: activity.id, userId: 'user-4', option: 'MAYBE' } });

      const result = await activityService.getVoteCounts(activity.id);

      expect(result.yes).toBe(2);
      expect(result.no).toBe(1);
      expect(result.maybe).toBe(1);
      expect(result.total).toBe(4);
    });

    it('should return zero counts when no votes', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-novotes';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: { tripId, title: 'No Votes', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      const result = await activityService.getVoteCounts(activity.id);

      expect(result.yes).toBe(0);
      expect(result.no).toBe(0);
      expect(result.maybe).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('updateActivity', () => {
    it('should update activity fields', async () => {
      const prisma = stubs.prisma.getImplementation();
      const tripId = 'trip-upd-act';

      await prisma.trip.create({
        data: { id: tripId, name: 'Test Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });

      const activity = await prisma.activity.create({
        data: { tripId, title: 'Old Title', proposedBy: 'user-1', proposedByName: 'User 1', status: 'PROPOSED' },
      });

      const result = await activityService.updateActivity(activity.id, {
        title: 'New Title',
        description: 'New Description',
      });

      expect(result.title).toBe('New Title');
      expect(result.description).toBe('New Description');
    });
  });
});
