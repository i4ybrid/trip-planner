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
  booking: {
    create: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('ActivityService - Deadline & Booking', () => {
  let activityService: ActivityService;

  beforeEach(() => {
    vi.resetAllMocks();
    activityService = new ActivityService(mockPrismaClient);
  });

  describe('setVotingDeadline', () => {
    it('should set voting deadline on activity', async () => {
      const deadline = new Date('2026-06-01');
      mockPrisma.activity.update.mockResolvedValue({
        id: 'activity-1',
        votingEndsAt: deadline,
        status: 'OPEN',
      } as any);

      const result = await activityService.setVotingDeadline('activity-1', deadline);

      expect(result.votingEndsAt).toEqual(deadline);
      expect(mockPrisma.activity.update).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        data: { votingEndsAt: deadline },
      });
    });
  });

  describe('isVotingOpen', () => {
    it('should return true when voting is open and no deadline', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        status: 'OPEN',
        votingEndsAt: null,
      });

      const result = await activityService.isVotingOpen('activity-1');
      expect(result).toBe(true);
    });

    it('should return false when deadline has passed', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        status: 'OPEN',
        votingEndsAt: new Date('2020-01-01'),
      });

      const result = await activityService.isVotingOpen('activity-1');
      expect(result).toBe(false);
    });

    it('should return false when status is not OPEN', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        status: 'CLOSED',
        votingEndsAt: null,
      });

      const result = await activityService.isVotingOpen('activity-1');
      expect(result).toBe(false);
    });

    it('should return true when deadline is in the future', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        status: 'OPEN',
        votingEndsAt: new Date('2030-01-01'),
      });

      const result = await activityService.isVotingOpen('activity-1');
      expect(result).toBe(true);
    });
  });

  describe('processVotingDeadline', () => {
    it('should close voting and return winner when deadline passed', async () => {
      mockPrisma.activity.findUnique
        .mockResolvedValueOnce({
          id: 'activity-1',
          status: 'OPEN',
          votingEndsAt: new Date('2020-01-01'),
        })
        .mockResolvedValueOnce({
          id: 'activity-1',
          status: 'OPEN',
          votingEndsAt: new Date('2020-01-01'),
        });
      
      mockPrisma.vote.findMany.mockResolvedValue([
        { option: 'yes' },
        { option: 'yes' },
        { option: 'no' },
      ]);
      
      mockPrisma.activity.update.mockResolvedValue({} as any);

      const result = await activityService.processVotingDeadline('activity-1');

      expect(result.wasProcessed).toBe(true);
      expect(result.winner).toBe('yes');
    });

    it('should return wasProcessed false when no deadline', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        status: 'OPEN',
        votingEndsAt: null,
      });
      mockPrisma.vote.findMany.mockResolvedValue([]);

      const result = await activityService.processVotingDeadline('activity-1');

      expect(result.wasProcessed).toBe(false);
      expect(result.winner).toBeNull();
    });
  });

  describe('createBookingFromWinner', () => {
    it('should create booking from winning activity', async () => {
      mockPrisma.activity.findUnique
        .mockResolvedValueOnce({
          id: 'activity-1',
          tripId: 'trip-1',
          status: 'OPEN',
          title: 'Eiffel Tower',
          cost: 25,
        })
        .mockResolvedValueOnce({
          id: 'activity-1',
          votes: [{ option: 'yes' }, { option: 'yes' }],
        });

      mockPrisma.vote.findMany.mockResolvedValue([
        { option: 'yes' },
        { option: 'yes' },
      ]);

      mockPrisma.booking.create.mockResolvedValue({ id: 'booking-1' } as any);
      mockPrisma.activity.update.mockResolvedValue({} as any);

      const result = await activityService.createBookingFromWinner('activity-1', 'user-1');

      expect(result.id).toBe('booking-1');
    });

    it('should throw when activity not found', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        activityService.createBookingFromWinner('activity-1', 'user-1')
      ).rejects.toThrow('Activity not found');
    });

    it('should throw when already booked', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        status: 'BOOKED',
      });

      await expect(
        activityService.createBookingFromWinner('activity-1', 'user-1')
      ).rejects.toThrow('Activity is already booked');
    });

    it('should throw when did not win', async () => {
      mockPrisma.activity.findUnique
        .mockResolvedValueOnce({
          id: 'activity-1',
          status: 'OPEN',
        })
        .mockResolvedValueOnce({
          id: 'activity-1',
          votes: [{ option: 'no' }],
        });

      mockPrisma.vote.findMany.mockResolvedValue([
        { option: 'no' },
      ]);

      await expect(
        activityService.createBookingFromWinner('activity-1', 'user-1')
      ).rejects.toThrow('Cannot book activity that did not win');
    });
  });

  describe('getExpiredActivities', () => {
    it('should return activities with expired deadlines', async () => {
      const expiredActivities = [
        { id: 'activity-1', status: 'OPEN', votingEndsAt: new Date('2020-01-01') },
      ];
      mockPrisma.activity.findMany.mockResolvedValue(expiredActivities as any);

      const result = await activityService.getExpiredActivities();

      expect(result).toHaveLength(1);
      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith({
        where: {
          status: 'OPEN',
          votingEndsAt: { lt: expect.any(Date) },
        },
      });
    });
  });
});
