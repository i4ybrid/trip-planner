import { describe, it, expect, beforeEach } from 'vitest';
import { TripService } from './trip.service';
import { createStubs } from '@/lib/stubs';

describe('TripService', () => {
  let tripService: TripService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(() => {
    stubs = createStubs();
    tripService = new TripService();
    // Inject the stubbed prisma client
    (tripService as any).prisma = stubs.prisma.getImplementation();
  });

  describe('createTrip', () => {
    it('should create a trip with the current user as master', async () => {
      const userId = 'user-123';
      const tripData = {
        name: 'Beach Vacation',
        destination: 'Hawaii',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-07'),
      };

      const trip = await tripService.createTrip(userId, tripData);

      expect(trip.name).toBe('Beach Vacation');
      expect(trip.tripMasterId).toBe(userId);
      expect(trip.status).toBe('IDEA');
    });

    it('should add creator as first member with MASTER role', async () => {
      const userId = 'user-123';
      const trip = await tripService.createTrip(userId, { name: 'Test Trip' });

      expect(trip.members).toBeDefined();
      expect(trip.members.length).toBeGreaterThan(0);
    });
  });

  describe('changeTripStatus', () => {
    it('should transition from IDEA to PLANNING', async () => {
      const userId = 'user-123';
      const trip = await tripService.createTrip(userId, { name: 'Test Trip' });

      // Manually set the trip in the stub
      const prisma = stubs.prisma.getImplementation();
      await prisma.trip.update({
        where: { id: trip.id },
        data: { status: 'IDEA' },
      });

      const result = await tripService.changeTripStatus(trip.id, 'PLANNING');

      expect(result.status).toBe('PLANNING');
    });

    it('should not allow invalid status transitions', async () => {
      const userId = 'user-123';
      const trip = await tripService.createTrip(userId, { name: 'Test Trip' });

      // Try to jump from IDEA to HAPPENING (invalid)
      await expect(
        tripService.changeTripStatus(trip.id, 'HAPPENING')
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('checkMemberPermission', () => {
    it('should return hasPermission true for confirmed member', async () => {
      const userId = 'user-123';
      const trip = await tripService.createTrip(userId, { name: 'Test Trip' });

      const result = await tripService.checkMemberPermission(trip.id, userId);

      expect(result.hasPermission).toBe(true);
      expect(result.role).toBe('MASTER');
    });

    it('should return hasPermission false for non-member', async () => {
      const userId = 'user-123';
      const trip = await tripService.createTrip(userId, { name: 'Test Trip' });

      const result = await tripService.checkMemberPermission(trip.id, 'non-member');

      expect(result.hasPermission).toBe(false);
    });
  });
});
