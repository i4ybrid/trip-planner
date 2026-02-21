import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NotificationService } from './notification.service';

const mockPrisma = {
  notification: {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  activity: {
    findUnique: vi.fn(),
  },
  tripMember: {
    findMany: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.resetAllMocks();
    notificationService = new NotificationService(mockPrismaClient);
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const input = {
        userId: 'user-1',
        tripId: 'trip-1',
        type: 'vote' as const,
        title: 'New vote',
        body: 'Someone voted on your activity',
        actionUrl: '/trip/trip-1/activities',
      };

      mockPrisma.notification.create.mockResolvedValue({
        id: 'notif-1',
        ...input,
        read: false,
        createdAt: new Date(),
      });

      const result = await notificationService.createNotification(input);

      expect(result.title).toBe('New vote');
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'vote',
          title: 'New vote',
        }),
      });
    });
  });

  describe('getUserNotifications', () => {
    it('should return user notifications', async () => {
      const notifications = [
        { id: 'notif-1', userId: 'user-1', title: 'Notification 1' },
        { id: 'notif-2', userId: 'user-1', title: 'Notification 2' },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await notificationService.getUserNotifications('user-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
    });

    it('should respect limit parameter', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);

      await notificationService.getUserNotifications('user-1', 10);

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      mockPrisma.notification.count.mockResolvedValue(5);

      const result = await notificationService.getUnreadCount('user-1');

      expect(result).toBe(5);
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockPrisma.notification.update.mockResolvedValue({
        id: 'notif-1',
        read: true,
      } as any);

      const result = await notificationService.markAsRead('notif-1');

      expect(result.read).toBe(true);
      expect(mockPrisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
        data: { read: true },
      });
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      mockPrisma.notification.updateMany.mockResolvedValue({ count: 3 } as any);

      await notificationService.markAllAsRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', read: false },
        data: { read: true },
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', async () => {
      mockPrisma.notification.delete.mockResolvedValue({} as any);

      await notificationService.deleteNotification('notif-1');

      expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
        where: { id: 'notif-1' },
      });
    });
  });

  describe('notifyTripMembers', () => {
    it('should notify all trip members except excluded', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 } as any);

      await notificationService.notifyTripMembers(
        'trip-1',
        'vote',
        'New Activity',
        'A new activity was added',
        '/trip/trip-1/activities',
        'user-1'
      );

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-2' }),
          expect.objectContaining({ userId: 'user-3' }),
        ]),
      });
    });
  });

  describe('notifyVoters', () => {
    it('should notify all voters on an activity', async () => {
      mockPrisma.activity.findUnique.mockResolvedValue({
        id: 'activity-1',
        votes: [
          { userId: 'user-1' },
          { userId: 'user-2' },
          { userId: 'user-2' },
        ],
        trip: { id: 'trip-1' },
      });
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 } as any);

      await notificationService.notifyVoters('activity-1', 'Vote Results', 'Your activity won!');

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-1' }),
          expect.objectContaining({ userId: 'user-2' }),
        ]),
      });
    });
  });

  describe('notifyMessageMentioned', () => {
    it('should notify mentioned users', async () => {
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 } as any);

      await notificationService.notifyMessageMentioned(
        'trip-1',
        'Hey @John check this out!',
        'Jane',
        ['user-1', 'user-2']
      );

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            type: 'message',
            title: 'Jane mentioned you',
            body: 'Hey @John check this out!',
          }),
        ]),
      });
    });
  });

  describe('getTripNotifications', () => {
    it('should return notifications for a trip', async () => {
      const notifications = [
        { id: 'notif-1', tripId: 'trip-1', userId: 'user-1' },
      ];
      mockPrisma.notification.findMany.mockResolvedValue(notifications);

      const result = await notificationService.getTripNotifications('trip-1', 'user-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
        where: { tripId: 'trip-1', userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('notifyEveryone', () => {
    it('should notify all trip members', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 2 } as any);

      await notificationService.notifyEveryone(
        'trip-1',
        'New message',
        'Check out the chat!'
      );

      expect(mockPrisma.notification.createMany).toHaveBeenCalled();
    });

    it('should exclude user when specified', async () => {
      mockPrisma.tripMember.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      mockPrisma.notification.createMany.mockResolvedValue({ count: 1 } as any);

      await notificationService.notifyEveryone(
        'trip-1',
        'New message',
        'Check out the chat!',
        'user-1'
      );

      expect(mockPrisma.notification.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'user-2' }),
        ]),
      });
    });
  });
});
