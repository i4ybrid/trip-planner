import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TripService } from '../services/trip.service';

const mockPrisma = {
  trip: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tripMember: {
    create: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('TripService', () => {
  let tripService: TripService;

  beforeEach(() => {
    vi.resetAllMocks();
    tripService = new TripService(mockPrismaClient);
  });

  describe('createTrip', () => {
    it('should create a trip with the user as trip master', async () => {
      const userId = 'user-123';
      const tripData = {
        name: 'Beach Vacation',
        destination: 'Hawaii',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-07'),
      };

      mockPrisma.trip.create.mockResolvedValue({
        id: 'trip-1',
        ...tripData,
        tripMasterId: userId,
        status: 'IDEA',
      });

      mockPrisma.tripMember.create.mockResolvedValue({
        id: 'member-1',
        tripId: 'trip-1',
        userId,
        role: 'MASTER',
      });

      const trip = await tripService.createTrip(userId, tripData);

      expect(trip.name).toBe('Beach Vacation');
      expect(trip.tripMasterId).toBe(userId);
      expect(mockPrisma.trip.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Beach Vacation',
          destination: 'Hawaii',
          tripMasterId: userId,
          status: 'IDEA',
        }),
      });
      expect(mockPrisma.tripMember.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          role: 'MASTER',
        }),
      });
    });
  });

  describe('getUserTrips', () => {
    it('should return all trips for a user', async () => {
      const userId = 'user-123';
      const trips = [
        { id: 'trip-1', name: 'Trip 1', tripMasterId: userId },
        { id: 'trip-2', name: 'Trip 2', tripMasterId: 'user-456' },
      ];

      mockPrisma.tripMember.findMany.mockResolvedValue([
        { tripId: 'trip-1', userId, role: 'MASTER', trip: trips[0] },
        { tripId: 'trip-2', userId, role: 'MEMBER', trip: trips[1] },
      ]);

      const result = await tripService.getUserTrips(userId);

      expect(result).toHaveLength(2);
      expect(mockPrisma.tripMember.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { trip: true },
      });
    });
  });

  describe('changeStatus', () => {
    it('should transition from IDEA to PLANNING', async () => {
      const tripId = 'trip-1';

      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        status: 'IDEA',
      });
      mockPrisma.trip.update.mockResolvedValue({
        id: tripId,
        status: 'PLANNING',
      });

      const result = await tripService.changeStatus(tripId, 'PLANNING');

      expect(result.status).toBe('PLANNING');
    });

    it('should reject invalid status transitions', async () => {
      const tripId = 'trip-1';

      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        status: 'IDEA',
      });

      await expect(tripService.changeStatus(tripId, 'IN_PROGRESS')).rejects.toThrow(
        'Invalid status transition from IDEA to IN_PROGRESS'
      );
    });
  });

  describe('addMember', () => {
    it('should add a new member to a trip', async () => {
      const tripId = 'trip-1';
      const userId = 'user-2';

      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        status: 'PLANNING',
      });
      mockPrisma.tripMember.create.mockResolvedValue({
        id: 'member-1',
        tripId,
        userId,
        role: 'MEMBER',
        status: 'INVITED',
      });

      const result = await tripService.addMember(tripId, userId);

      expect(result.userId).toBe(userId);
      expect(mockPrisma.tripMember.create).toHaveBeenCalledWith({
        data: {
          tripId,
          userId,
          role: 'MEMBER',
          status: 'INVITED',
        },
      });
    });

    it('should not add member to completed trip', async () => {
      const tripId = 'trip-1';
      const userId = 'user-2';

      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        status: 'COMPLETED',
      });

      await expect(tripService.addMember(tripId, userId)).rejects.toThrow(
        'Cannot add members to a completed trip'
      );
    });

    it('should not add member to cancelled trip', async () => {
      const tripId = 'trip-1';
      const userId = 'user-2';

      mockPrisma.trip.findUnique.mockResolvedValue({
        id: tripId,
        status: 'CANCELLED',
      });

      await expect(tripService.addMember(tripId, userId)).rejects.toThrow(
        'Cannot add members to a completed trip'
      );
    });

    it('should throw when trip not found', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      await expect(tripService.addMember('trip-1', 'user-2')).rejects.toThrow(
        'Trip not found'
      );
    });
  });

  describe('getTripById', () => {
    it('should return trip by id with members and activities', async () => {
      const trip = {
        id: 'trip-1',
        name: 'Test Trip',
        members: [{ userId: 'user-1', user: { name: 'User' } }],
        activities: [{ id: 'act-1' }],
      };
      mockPrisma.trip.findUnique.mockResolvedValue(trip);

      const result = await tripService.getTripById('trip-1');

      expect(result).toEqual(trip);
      expect(mockPrisma.trip.findUnique).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        include: {
          members: { include: { user: true } },
          activities: true,
        },
      });
    });

    it('should return null for non-existent trip', async () => {
      mockPrisma.trip.findUnique.mockResolvedValue(null);

      const result = await tripService.getTripById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('removeMember', () => {
    it('should remove a member from trip', async () => {
      mockPrisma.tripMember.delete.mockResolvedValue({} as any);

      await tripService.removeMember('trip-1', 'user-2');

      expect(mockPrisma.tripMember.delete).toHaveBeenCalledWith({
        where: { tripId_userId: { tripId: 'trip-1', userId: 'user-2' } },
      });
    });
  });

  describe('updateTrip', () => {
    it('should update trip fields', async () => {
      const updateData = { name: 'Updated Trip', destination: 'Paris' };
      mockPrisma.trip.update.mockResolvedValue({
        id: 'trip-1',
        ...updateData,
      } as any);

      const result = await tripService.updateTrip('trip-1', updateData);

      expect(result.name).toBe('Updated Trip');
      expect(mockPrisma.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
        data: updateData,
      });
    });
  });

  describe('deleteTrip', () => {
    it('should delete a trip', async () => {
      mockPrisma.trip.delete.mockResolvedValue({} as any);

      await tripService.deleteTrip('trip-1');

      expect(mockPrisma.trip.delete).toHaveBeenCalledWith({
        where: { id: 'trip-1' },
      });
    });
  });
});
