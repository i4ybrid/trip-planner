import { describe, it, expect, beforeEach } from 'vitest';
import { MockTrip, mockApi, mockTrip } from '../services/mock-api';

describe('MockTrip', () => {
  let mock: MockTrip;

  beforeEach(() => {
    mock = new MockTrip();
  });

  describe('createTrip', () => {
    it('should create a new trip with the user as master', async () => {
      const result = await mock.createTrip('user-1', {
        name: 'Beach Vacation',
        destination: 'Hawaii',
      });

      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Beach Vacation');
      expect(result.data?.destination).toBe('Hawaii');
      expect(result.data?.tripMasterId).toBe('user-1');
      expect(result.data?.status).toBe('IDEA');
    });

    it('should add creator as a member', async () => {
      const tripResult = await mock.createTrip('user-1', { name: 'Test Trip' });
      const membersResult = await mock.getTripMembers(tripResult.data!.id);

      expect(membersResult.data).toHaveLength(1);
      expect(membersResult.data?.[0].userId).toBe('user-1');
      expect(membersResult.data?.[0].role).toBe('MASTER');
    });
  });

  describe('getTrips', () => {
    it('should return empty array when no trips exist', async () => {
      const result = await mock.getTrips();
      expect(result.data).toEqual([]);
    });

    it('should return created trips', async () => {
      await mock.createTrip('user-1', { name: 'Trip 1' });
      await mock.createTrip('user-1', { name: 'Trip 2' });

      const result = await mock.getTrips();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('getTrip', () => {
    it('should return trip by id', async () => {
      const created = await mock.createTrip('user-1', { name: 'Test Trip' });
      const result = await mock.getTrip(created.data!.id);

      expect(result.data?.name).toBe('Test Trip');
    });

    it('should return error for non-existent trip', async () => {
      const result = await mock.getTrip('non-existent');
      expect(result.error).toBe('Trip not found');
    });
  });

  describe('updateTrip', () => {
    it('should update trip details', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Original' });
      const result = await mock.updateTrip(trip.data!.id, { name: 'Updated' });

      expect(result.data?.name).toBe('Updated');
    });
  });

  describe('deleteTrip', () => {
    it('should delete trip and related data', async () => {
      const trip = await mock.createTrip('user-1', { name: 'To Delete' });
      await mock.addTripMember(trip.data!.id, 'user-2');
      await mock.createActivity(trip.data!.id, 'user-1', { title: 'Activity', category: 'activity' });

      await mock.deleteTrip(trip.data!.id);

      const result = await mock.getTrip(trip.data!.id);
      expect(result.error).toBe('Trip not found');
    });
  });

  describe('changeTripStatus', () => {
    it('should change trip status', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Test' });
      const result = await mock.changeTripStatus(trip.data!.id, 'PLANNING');

      expect(result.data?.status).toBe('PLANNING');
    });
  });

  describe('activities', () => {
    it('should create activity for a trip', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Test' });
      const result = await mock.createActivity(trip.data!.id, 'user-1', {
        title: 'Surfing',
        category: 'activity',
        cost: 50,
      });

      expect(result.data?.title).toBe('Surfing');
      expect(result.data?.cost).toBe(50);
    });

    it('should get activities for a trip', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Test' });
      await mock.createActivity(trip.data!.id, 'user-1', { title: 'Activity 1', category: 'activity' });
      await mock.createActivity(trip.data!.id, 'user-1', { title: 'Activity 2', category: 'restaurant' });

      const result = await mock.getActivities(trip.data!.id);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('votes', () => {
    it('should cast a vote on activity', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Test' });
      const activity = await mock.createActivity(trip.data!.id, 'user-1', { title: 'Test', category: 'activity' });
      
      const result = await mock.castVote(activity.data!.id, 'user-2', 'yes');

      expect(result.data?.option).toBe('yes');
      expect(result.data?.userId).toBe('user-2');
    });
  });

  describe('invites', () => {
    it('should create an invite', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Test' });
      const result = await mock.createInvite(trip.data!.id, { email: 'friend@test.com' });

      expect(result.data?.email).toBe('friend@test.com');
      expect(result.data?.token).toBeDefined();
      expect(result.data?.status).toBe('PENDING');
    });
  });

  describe('messages', () => {
    it('should send a message', async () => {
      const trip = await mock.createTrip('user-1', { name: 'Test' });
      const result = await mock.sendMessage(trip.data!.id, 'user-2', { content: 'Hello!' });

      expect(result.data?.content).toBe('Hello!');
      expect(result.data?.messageType).toBe('TEXT');
    });
  });
});

describe('mockApi', () => {
  beforeEach(() => {
    mockTrip.reset();
    vi.clearAllMocks();
  });

  it('should have all required methods', () => {
    expect(mockApi.getTrips).toBeDefined();
    expect(mockApi.getTrip).toBeDefined();
    expect(mockApi.createTrip).toBeDefined();
    expect(mockApi.updateTrip).toBeDefined();
    expect(mockApi.deleteTrip).toBeDefined();
    expect(mockApi.changeTripStatus).toBeDefined();
    expect(mockApi.getTripMembers).toBeDefined();
    expect(mockApi.addTripMember).toBeDefined();
    expect(mockApi.getActivities).toBeDefined();
    expect(mockApi.createActivity).toBeDefined();
    expect(mockApi.castVote).toBeDefined();
    expect(mockApi.getInvites).toBeDefined();
    expect(mockApi.createInvite).toBeDefined();
    expect(mockApi.getBookings).toBeDefined();
    expect(mockApi.getMessages).toBeDefined();
    expect(mockApi.sendMessage).toBeDefined();
    expect(mockApi.getMedia).toBeDefined();
    expect(mockApi.getNotifications).toBeDefined();
    expect(mockApi.markNotificationRead).toBeDefined();
    expect(mockApi.markAllNotificationsRead).toBeDefined();
    expect(mockApi.getCurrentUser).toBeDefined();
    expect(mockApi.updateProfile).toBeDefined();
    expect(mockApi.getUser).toBeDefined();
  });
});
