import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ActivityService } from './activity.service';

const mockPrisma = {
  activity: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  vote: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('ActivityService', () => {
  let activityService: ActivityService;

  beforeEach(() => {
    vi.resetAllMocks();
    activityService = new ActivityService(mockPrismaClient);
  });

  describe('createActivity', () => {
    it('should create a new activity', async () => {
      const activityData = {
        tripId: 'trip-1',
        title: 'Visit Eiffel Tower',
        description: 'Morning visit',
        category: 'attraction' as const,
        proposedBy: 'user-1',
        cost: 25,
      };

      mockPrisma.activity.create.mockResolvedValue({
        id: 'activity-1',
        ...activityData,
        location: null,
        startTime: null,
        endTime: null,
        currency: 'USD',
      });

      const result = await activityService.createActivity(activityData);

      expect(result.title).toBe('Visit Eiffel Tower');
      expect(result.proposedBy).toBe('user-1');
      expect(mockPrisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: 'trip-1',
          title: 'Visit Eiffel Tower',
          category: 'attraction',
          proposedBy: 'user-1',
        }),
      });
    });
  });

  describe('getTripActivities', () => {
    it('should return all activities for a trip', async () => {
      const activities = [
        { id: 'activity-1', tripId: 'trip-1', title: 'Activity 1' },
        { id: 'activity-2', tripId: 'trip-1', title: 'Activity 2' },
      ];
      mockPrisma.activity.findMany.mockResolvedValue(activities);

      const result = await activityService.getTripActivities('trip-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        where: { tripId: 'trip-1' },
        include: { votes: true, proposer: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('vote', () => {
    it('should create a new vote', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);
      mockPrisma.vote.create.mockResolvedValue({
        id: 'vote-1',
        activityId: 'activity-1',
        userId: 'user-1',
        option: 'yes',
      });

      const result = await activityService.vote('activity-1', 'user-1', 'yes');

      expect(result.option).toBe('yes');
      expect(mockPrisma.vote.create).toHaveBeenCalled();
    });

    it('should update existing vote', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        activityId: 'activity-1',
        userId: 'user-1',
        option: 'yes',
      });
      mockPrisma.vote.update.mockResolvedValue({
        id: 'vote-1',
        activityId: 'activity-1',
        userId: 'user-1',
        option: 'no',
      });

      const result = await activityService.vote('activity-1', 'user-1', 'no');

      expect(result.option).toBe('no');
      expect(mockPrisma.vote.update).toHaveBeenCalled();
    });
  });

  describe('getVoteCounts', () => {
    it('should return vote counts by option', async () => {
      const votes = [
        { option: 'yes' },
        { option: 'yes' },
        { option: 'no' },
      ];
      mockPrisma.vote.findMany.mockResolvedValue(votes);

      const result = await activityService.getVoteCounts('activity-1');

      expect(result).toEqual({ yes: 2, no: 1 });
    });

    it('should return empty object for no votes', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await activityService.getVoteCounts('activity-1');

      expect(result).toEqual({});
    });
  });

  describe('getWinningOption', () => {
    it('should return the option with most votes', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([
        { option: 'yes' },
        { option: 'yes' },
        { option: 'no' },
      ]);

      const result = await activityService.getWinningOption('activity-1');

      expect(result).toBe('yes');
    });

    it('should return null for no votes', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await activityService.getWinningOption('activity-1');

      expect(result).toBeNull();
    });

    it('should return first option on tie', async () => {
      mockPrisma.vote.findMany.mockResolvedValue([
        { option: 'yes' },
        { option: 'no' },
      ]);

      const result = await activityService.getWinningOption('activity-1');

      expect(result).toBe('yes');
    });
  });

  describe('removeVote', () => {
    it('should remove a vote', async () => {
      mockPrisma.vote.delete.mockResolvedValue({} as any);

      await activityService.removeVote('activity-1', 'user-1');

      expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
        where: {
          activityId_userId: { activityId: 'activity-1', userId: 'user-1' },
        },
      });
    });
  });

  describe('hasVoted', () => {
    it('should return true if user has voted', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue({
        id: 'vote-1',
        activityId: 'activity-1',
        userId: 'user-1',
        option: 'yes',
      });

      const result = await activityService.hasVoted('activity-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false if user has not voted', async () => {
      mockPrisma.vote.findUnique.mockResolvedValue(null);

      const result = await activityService.hasVoted('activity-1', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('deleteActivity', () => {
    it('should delete an activity', async () => {
      mockPrisma.activity.delete.mockResolvedValue({} as any);

      await activityService.deleteActivity('activity-1');

      expect(mockPrisma.activity.delete).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });
    });
  });
});
