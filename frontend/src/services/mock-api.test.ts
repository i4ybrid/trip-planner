import { describe, it, expect, beforeEach } from 'vitest';
import { mockApi, mockDb, mockTrip } from '../services/mock-api';

describe('MockDatabase', () => {
  beforeEach(() => {
    mockTrip.reset();
  });

  describe('createTrip', () => {
    it('should create a new trip with the user as master', async () => {
      const result = await mockApi.createTrip({
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
      const tripResult = await mockApi.createTrip({ name: 'Test Trip' });
      const membersResult = await mockApi.getTripMembers(tripResult.data!.id);

      expect(membersResult.data).toHaveLength(1);
      expect(membersResult.data?.[0].userId).toBe('user-1');
      expect(membersResult.data?.[0].role).toBe('MASTER');
    });
  });

  describe('getTrips', () => {
    it('should return seeded trips', async () => {
      const result = await mockApi.getTrips();
      expect(result.data).toHaveLength(5);
    });
  });

  describe('getTrip', () => {
    it('should return trip by id', async () => {
      const result = await mockApi.getTrip('trip-1');
      expect(result.data?.name).toBe('Hawaii Beach Vacation');
    });

    it('should return error for non-existent trip', async () => {
      const result = await mockApi.getTrip('non-existent');
      expect(result.error).toBe('Trip not found');
    });
  });

  describe('updateTrip', () => {
    it('should update trip details', async () => {
      const result = await mockApi.updateTrip('trip-1', { name: 'Updated Hawaii' });
      expect(result.data?.name).toBe('Updated Hawaii');
    });
  });

  describe('changeTripStatus', () => {
    it('should change trip status', async () => {
      const result = await mockApi.changeTripStatus('trip-1', 'PLANNING');
      expect(result.data?.status).toBe('PLANNING');
    });
  });

  describe('activities', () => {
    it('should create activity for a trip', async () => {
      const result = await mockApi.createActivity('trip-1', {
        title: 'Surfing',
        category: 'activity',
        cost: 50,
      });

      expect(result.data?.title).toBe('Surfing');
      expect(result.data?.cost).toBe(50);
    });

    it('should get activities for a trip', async () => {
      const result = await mockApi.getActivities('trip-1');
      expect(result.data).toBeDefined();
      expect(result.data?.length).toBeGreaterThan(0);
    });
  });

  describe('votes', () => {
    it('should cast a vote on activity', async () => {
      const result = await mockApi.castVote('act-1', 'YES');
      expect(result.data?.option).toBe('YES');
      expect(result.data?.userId).toBe('user-1');
    });

    it('should get votes for activity', async () => {
      const result = await mockApi.getVotes('act-1');
      expect(result.data).toBeDefined();
    });
  });

  describe('messages', () => {
    it('should send a trip message', async () => {
      const result = await mockApi.sendTripMessage('trip-1', { content: 'Hello!' });

      expect(result.data?.content).toBe('Hello!');
      expect(result.data?.messageType).toBe('TEXT');
    });
  });

  describe('bill splits', () => {
    it('should get bill splits for a trip', async () => {
      const result = await mockApi.getBillSplits('trip-1');
      expect(result.data).toHaveLength(2);
    });

    it('should create a bill split', async () => {
      const result = await mockApi.createBillSplit('trip-1', {
        title: 'Test Bill',
        amount: 100,
        splitType: 'EQUAL',
        members: [
          { userId: 'user-1', dollarAmount: 50 },
          { userId: 'user-2', dollarAmount: 50 },
        ],
      });

      expect(result.data?.title).toBe('Test Bill');
      expect(result.data?.amount).toBe(100);
    });

    it('should get bill split members', async () => {
      const result = await mockApi.getBillSplitMembers('bill-1');
      expect(result.data).toHaveLength(4);
    });
  });

  describe('friends', () => {
    it('should get friends', async () => {
      const result = await mockApi.getFriends();
      expect(result.data).toHaveLength(2);
    });

    it('should get friend requests', async () => {
      const result = await mockApi.getFriendRequests();
      expect(result.data?.received).toHaveLength(1);
    });

    it('should add a friend', async () => {
      const result = await mockApi.addFriend('user-4');
      expect(result.data?.friendId).toBe('user-4');
    });
  });

  describe('settings', () => {
    it('should get settings', async () => {
      const result = await mockApi.getSettings();
      expect(result.data?.friendRequestSource).toBe('ANYONE');
    });

    it('should update settings', async () => {
      const result = await mockApi.updateSettings({ friendRequestSource: 'TRIP_MEMBERS' });
      expect(result.data?.friendRequestSource).toBe('TRIP_MEMBERS');
    });
  });

  describe('timeline', () => {
    it('should get timeline events', async () => {
      const result = await mockApi.getTripTimeline('trip-1');
      expect(result.data).toHaveLength(8);
    });
  });

  describe('trip members', () => {
    it('should get trip members', async () => {
      const result = await mockApi.getTripMembers('trip-1');
      expect(result.data).toHaveLength(4);
    });

    it('should add trip member', async () => {
      const result = await mockApi.addTripMember('trip-1', 'user-4');
      expect(result.data?.userId).toBe('user-4');
    });
  });

  describe('notifications', () => {
    it('should get notifications', async () => {
      const result = await mockApi.getNotifications();
      expect(result.data).toBeDefined();
    });

    it('should mark notification as read', async () => {
      const result = await mockApi.markNotificationRead('notif-1');
      expect(result.data).toBeUndefined();
    });
  });

  describe('media', () => {
    it('should get media', async () => {
      const result = await mockApi.getMedia('trip-5');
      expect(result.data).toHaveLength(3);
    });
  });

  describe('DM conversations', () => {
    it('should get DM conversations', async () => {
      const result = await mockApi.getDmConversations();
      expect(result.data).toHaveLength(2);
    });

    it('should get DM messages', async () => {
      const result = await mockApi.getDmMessages('dm-1');
      expect(result.data).toHaveLength(2);
    });
  });
});

describe('mockApi exports', () => {
  it('should have all required methods', () => {
    expect(mockApi.getTrips).toBeDefined();
    expect(mockApi.getTrip).toBeDefined();
    expect(mockApi.createTrip).toBeDefined();
    expect(mockApi.updateTrip).toBeDefined();
    expect(mockApi.deleteTrip).toBeDefined();
    expect(mockApi.changeTripStatus).toBeDefined();
    expect(mockApi.getTripMembers).toBeDefined();
    expect(mockApi.addTripMember).toBeDefined();
    expect(mockApi.updateTripMember).toBeDefined();
    expect(mockApi.removeTripMember).toBeDefined();
    expect(mockApi.getActivities).toBeDefined();
    expect(mockApi.createActivity).toBeDefined();
    expect(mockApi.updateActivity).toBeDefined();
    expect(mockApi.deleteActivity).toBeDefined();
    expect(mockApi.getVotes).toBeDefined();
    expect(mockApi.castVote).toBeDefined();
    expect(mockApi.removeVote).toBeDefined();
    expect(mockApi.getInvites).toBeDefined();
    expect(mockApi.createInvite).toBeDefined();
    expect(mockApi.acceptInvite).toBeDefined();
    expect(mockApi.declineInvite).toBeDefined();
    expect(mockApi.getTripMessages).toBeDefined();
    expect(mockApi.sendTripMessage).toBeDefined();
    expect(mockApi.editMessage).toBeDefined();
    expect(mockApi.deleteMessage).toBeDefined();
    expect(mockApi.addReaction).toBeDefined();
    expect(mockApi.getMedia).toBeDefined();
    expect(mockApi.uploadMedia).toBeDefined();
    expect(mockApi.getFriends).toBeDefined();
    expect(mockApi.addFriend).toBeDefined();
    expect(mockApi.removeFriend).toBeDefined();
    expect(mockApi.getFriendRequests).toBeDefined();
    expect(mockApi.sendFriendRequest).toBeDefined();
    expect(mockApi.respondToFriendRequest).toBeDefined();
    expect(mockApi.getDmConversations).toBeDefined();
    expect(mockApi.createDmConversation).toBeDefined();
    expect(mockApi.getDmMessages).toBeDefined();
    expect(mockApi.sendDmMessage).toBeDefined();
    expect(mockApi.getBillSplits).toBeDefined();
    expect(mockApi.createBillSplit).toBeDefined();
    expect(mockApi.getBillSplit).toBeDefined();
    expect(mockApi.updateBillSplit).toBeDefined();
    expect(mockApi.deleteBillSplit).toBeDefined();
    expect(mockApi.getBillSplitMembers).toBeDefined();
    expect(mockApi.addBillSplitMember).toBeDefined();
    expect(mockApi.markBillSplitMemberPaid).toBeDefined();
    expect(mockApi.removeBillSplitMember).toBeDefined();
    expect(mockApi.getTripTimeline).toBeDefined();
    expect(mockApi.getNotifications).toBeDefined();
    expect(mockApi.markNotificationRead).toBeDefined();
    expect(mockApi.markAllNotificationsRead).toBeDefined();
    expect(mockApi.getSettings).toBeDefined();
    expect(mockApi.updateSettings).toBeDefined();
    expect(mockApi.changePassword).toBeDefined();
    expect(mockApi.uploadAvatar).toBeDefined();
    expect(mockApi.getCurrentUser).toBeDefined();
    expect(mockApi.updateProfile).toBeDefined();
    expect(mockApi.getUser).toBeDefined();
  });
});

describe('mockTrip exports', () => {
  it('should have getTripMembersWithUsers method', () => {
    expect(mockTrip.getTripMembersWithUsers).toBeDefined();
  });

  it('should have reset method', () => {
    expect(mockTrip.reset).toBeDefined();
  });
});
