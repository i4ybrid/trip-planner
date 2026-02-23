import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useTripStore } from './trip-store';
import { Trip, TripMember } from '@/types';

// Mock the API service directly
vi.mock('@/services', () => ({
  api: {
    getTrips: vi.fn(),
    getTrip: vi.fn(),
    createTrip: vi.fn(),
    updateTrip: vi.fn(),
    deleteTrip: vi.fn(),
    changeTripStatus: vi.fn(),
  },
  mockTrip: {
    reset: vi.fn(),
  },
}));

import { api } from '@/services';

describe('useTripStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTripStore.setState({
      trips: [],
      currentTrip: null,
      isLoading: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have empty trips array', () => {
      const { trips } = useTripStore.getState();
      expect(trips).toEqual([]);
    });

    it('should have null currentTrip', () => {
      const { currentTrip } = useTripStore.getState();
      expect(currentTrip).toBeNull();
    });

    it('should have isLoading false', () => {
      const { isLoading } = useTripStore.getState();
      expect(isLoading).toBe(false);
    });

    it('should have null error', () => {
      const { error } = useTripStore.getState();
      expect(error).toBeNull();
    });
  });

  describe('fetchTrips', () => {
    it('should set isLoading true while fetching', async () => {
      (api.getTrips as any).mockResolvedValue({ data: [] });
      
      const store = useTripStore.getState();
      const promise = store.fetchTrips();
      
      expect(useTripStore.getState().isLoading).toBe(true);
      
      await promise;
    });

    it('should set trips on success', async () => {
      const trip: Trip = { id: '1', name: 'Trip 1', status: 'IDEA', tripMasterId: 'user-1', createdAt: '', updatedAt: '' };
      const tripMembers: TripMember[] = [{
        id: 'm1',
        tripId: '1',
        userId: 'user-1',
        role: 'MASTER',
        status: 'CONFIRMED',
        joinedAt: '',
        trip: trip
      }];
      
      (api.getTrips as any).mockResolvedValue({ data: tripMembers });
      
      await useTripStore.getState().fetchTrips();
      
      expect(useTripStore.getState().trips).toEqual([trip]);
    });

    it('should set error on failure', async () => {
      (api.getTrips as any).mockResolvedValue({ error: 'Failed to fetch' });
      
      await useTripStore.getState().fetchTrips();
      
      // The store has its own hardcoded error message
      expect(useTripStore.getState().error).toBe('Failed to fetch');
    });
  });

  describe('createTrip', () => {
    it('should create a new trip', async () => {
      const newTrip = { id: '1', name: 'New Trip', status: 'IDEA' as const, tripMasterId: 'user-1', createdAt: '', updatedAt: '' };
      (api.createTrip as any).mockResolvedValue({ data: newTrip });
      
      const result = await useTripStore.getState().createTrip({ name: 'New Trip' });
      
      expect(result?.name).toBe('New Trip');
      expect(useTripStore.getState().trips).toHaveLength(1);
      expect(useTripStore.getState().trips[0]).toEqual(newTrip);
    });

    it('should return null on error', async () => {
      (api.createTrip as any).mockResolvedValue({ error: 'Failed to create' });
      
      const result = await useTripStore.getState().createTrip({ name: 'New Trip' });
      
      expect(result).toBeNull();
    });
  });

  describe('updateTrip', () => {
    it('should update trip in state', async () => {
      const initialTrip = { id: '1', name: 'Trip', status: 'IDEA' as const, tripMasterId: 'user-1', createdAt: '', updatedAt: '' };
      useTripStore.setState({
        trips: [initialTrip],
      });
      
      const updated = { ...initialTrip, name: 'Updated' };
      (api.updateTrip as any).mockResolvedValue({ data: updated });
      
      await useTripStore.getState().updateTrip('1', { name: 'Updated' });
      
      expect(useTripStore.getState().trips[0]?.name).toBe('Updated');
    });
  });

  describe('deleteTrip', () => {
    it('should remove trip from state', async () => {
      useTripStore.setState({ trips: [{ id: '1', name: 'Trip', status: 'IDEA' as const, tripMasterId: 'user-1', createdAt: '', updatedAt: '' }] });
      (api.deleteTrip as any).mockResolvedValue({ data: undefined });
      
      await useTripStore.getState().deleteTrip('1');
      
      expect(useTripStore.getState().trips).toHaveLength(0);
    });
  });

  describe('changeStatus', () => {
    it('should update trip status', async () => {
      const trip = { id: '1', name: 'Trip', status: 'IDEA' as const, tripMasterId: 'user-1', createdAt: '', updatedAt: '' };
      useTripStore.setState({ trips: [trip], currentTrip: trip });
      
      const updated = { ...trip, status: 'PLANNING' as const };
      (api.changeTripStatus as any).mockResolvedValue({ data: updated });
      
      await useTripStore.getState().changeStatus('1', 'PLANNING');
      
      expect(useTripStore.getState().trips[0]?.status).toBe('PLANNING');
      expect(useTripStore.getState().currentTrip?.status).toBe('PLANNING');
    });
  });

  describe('setCurrentTrip', () => {
    it('should set currentTrip', () => {
      const trip = { id: '1', name: 'Trip', status: 'IDEA' as const, tripMasterId: 'user-1', createdAt: '', updatedAt: '' };
      
      useTripStore.getState().setCurrentTrip(trip);
      
      expect(useTripStore.getState().currentTrip).toEqual(trip);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useTripStore.setState({ error: 'Some error' });
      
      useTripStore.getState().clearError();
      
      expect(useTripStore.getState().error).toBeNull();
    });
  });
});
