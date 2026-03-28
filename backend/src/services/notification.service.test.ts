import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NotificationService } from './notification.service';
import { createStubs } from '@/lib/stubs';
import { setPrisma, resetPrisma } from '@/lib/prisma-client';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let stubs: ReturnType<typeof createStubs>;

  beforeEach(async () => {
    stubs = createStubs();
    setPrisma(stubs.prisma.getImplementation() as any);
    notificationService = new NotificationService();
    const prisma = stubs.prisma.getImplementation();
    await prisma.notificationPreference.createMany({
      data: [
        { userId: 'user-1', category: 'MILESTONE', inApp: true },
        { userId: 'user-1', category: 'INVITE', inApp: true },
        { userId: 'user-1', category: 'PAYMENT', inApp: true },
        { userId: 'user-1', category: 'SETTLEMENT', inApp: true },
        { userId: 'user-1', category: 'MEMBER', inApp: true },
        { userId: 'user-1', category: 'CHAT', inApp: true },
        { userId: 'user-1', category: 'FRIEND', inApp: true },
      ],
    });
  });

  afterEach(() => {
    resetPrisma();
  });

  describe('getNotifications', () => {
    it('should return notifications for user', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.notification.create({
        data: { userId: 'user-1', type: 'GENERAL', title: 'Notif 1', body: 'Body 1', read: false },
      });
      await prisma.notification.create({
        data: { userId: 'user-1', type: 'GENERAL', title: 'Notif 2', body: 'Body 2', read: true },
      });
      await prisma.notification.create({
        data: { userId: 'user-2', type: 'GENERAL', title: 'Other User', body: 'Body', read: false },
      });

      const result = await notificationService.getNotifications('user-1');

      expect(result.length).toBe(2);
      result.forEach(n => expect(n.userId).toBe('user-1'));
    });

    it('should respect limit parameter', async () => {
      const prisma = stubs.prisma.getImplementation();

      for (let i = 0; i < 10; i++) {
        await prisma.notification.create({
          data: { userId: 'user-limit', type: 'GENERAL', title: `Notif ${i}`, body: `Body ${i}`, read: false },
        });
      }

      const result = await notificationService.getNotifications('user-limit', 5);

      expect(result.length).toBe(5);
    });

    it('should return notifications in descending order by createdAt', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.notification.create({
        data: { userId: 'user-order', type: 'GENERAL', title: 'First', body: 'First', read: false },
      });
      await new Promise(r => setTimeout(r, 10));
      await prisma.notification.create({
        data: { userId: 'user-order', type: 'GENERAL', title: 'Second', body: 'Second', read: false },
      });

      const result = await notificationService.getNotifications('user-order');

      expect(result[0].title).toBe('Second');
      expect(result[1].title).toBe('First');
    });

    it('should include trip info in response', async () => {
      const prisma = stubs.prisma.getImplementation();
      await prisma.trip.create({
        data: { id: 'trip-notif', name: 'My Trip', status: 'PLANNING', tripMasterId: 'user-1' },
      });
      await prisma.notification.create({
        data: { userId: 'user-1', tripId: 'trip-notif', type: 'GENERAL', title: 'Trip Notif', body: 'Body', read: false },
      });

      const result = await notificationService.getNotifications('user-1');

      expect(result[0].trip).toBeDefined();
      expect(result[0].trip!.name).toBe('My Trip');
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.notification.create({
        data: { userId: 'user-unread', type: 'GENERAL', title: 'Unread 1', body: 'Body', read: false },
      });
      await prisma.notification.create({
        data: { userId: 'user-unread', type: 'GENERAL', title: 'Unread 2', body: 'Body', read: false },
      });
      await prisma.notification.create({
        data: { userId: 'user-unread', type: 'GENERAL', title: 'Read', body: 'Body', read: true },
      });

      const count = await notificationService.getUnreadCount('user-unread');

      expect(count).toBe(2);
    });

    it('should return 0 when all notifications are read', async () => {
      const count = await notificationService.getUnreadCount('user-all-read');
      expect(count).toBe(0);
    });

    it('should return 0 when no notifications exist', async () => {
      const count = await notificationService.getUnreadCount('user-none');
      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const prisma = stubs.prisma.getImplementation();

      const notif = await prisma.notification.create({
        data: { userId: 'user-1', type: 'GENERAL', title: 'To Mark', body: 'Body', read: false },
      });

      const result = await notificationService.markAsRead(notif.id, 'user-1');

      expect(result.read).toBe(true);

      // Verify in DB
      const updated = await prisma.notification.findUnique({ where: { id: notif.id } });
      expect(updated!.read).toBe(true);
    });

    it('should return updated notification', async () => {
      const prisma = stubs.prisma.getImplementation();

      const notif = await prisma.notification.create({
        data: { userId: 'user-1', type: 'GENERAL', title: 'To Mark', body: 'Body', read: false },
      });

      const result = await notificationService.markAsRead(notif.id, 'user-1');

      expect(result.id).toBe(notif.id);
      expect(result.read).toBe(true);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all unread notifications as read for user', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.notification.create({
        data: { userId: 'user-all', type: 'GENERAL', title: 'Unread 1', body: 'Body', read: false },
      });
      await prisma.notification.create({
        data: { userId: 'user-all', type: 'GENERAL', title: 'Unread 2', body: 'Body', read: false },
      });
      await prisma.notification.create({
        data: { userId: 'user-all', type: 'GENERAL', title: 'Already Read', body: 'Body', read: true },
      });

      const result = await notificationService.markAllAsRead('user-all');

      expect(result.count).toBe(2);

      // Verify all are now read
      const all = await prisma.notification.findMany({ where: { userId: 'user-all' } });
      all.forEach(n => expect(n.read).toBe(true));
    });

    it('should not affect other users notifications', async () => {
      const prisma = stubs.prisma.getImplementation();

      await prisma.notification.create({
        data: { userId: 'user-a', type: 'GENERAL', title: 'User A Notif', body: 'Body', read: false },
      });
      await prisma.notification.create({
        data: { userId: 'user-b', type: 'GENERAL', title: 'User B Notif', body: 'Body', read: false },
      });

      await notificationService.markAllAsRead('user-a');

      const userB = await prisma.notification.findMany({ where: { userId: 'user-b' } });
      expect(userB[0].read).toBe(false);
    });
  });

  describe('createNotification', () => {
    it('should create notification with correct fields', async () => {
      const prisma = stubs.prisma.getImplementation();

      const notification = await notificationService.createNotification({
        userId: 'user-1',
        tripId: 'trip-123',
        type: 'PAYMENT_REQUEST',
        title: 'Payment Request',
        body: 'Please pay your share',
        actionType: 'payment',
        actionId: 'bill-1',
        actionUrl: '/trips/trip-123/payments',
        priority: 'high',
      });

      expect(notification.userId).toBe('user-1');
      expect(notification.tripId).toBe('trip-123');
      expect(notification.type).toBe('PAYMENT_REQUEST');
      expect(notification.title).toBe('Payment Request');
      expect(notification.body).toBe('Please pay your share');
      expect(notification.priority).toBe('high');
      expect(notification.read).toBe(false);

      // Verify it was stored
      const stored = await prisma.notification.findUnique({ where: { id: notification.id } });
      expect(stored).toBeDefined();
    });

    it('should create notification without optional fields', async () => {
      const notification = await notificationService.createNotification({
        userId: 'user-1',
        type: 'GENERAL',
        title: 'General Notification',
        body: 'Something happened',
      });

      expect(notification.userId).toBe('user-1');
      expect(notification.tripId).toBeNull();
      expect(notification.actionUrl).toBeUndefined();
      expect(notification.priority).toBeUndefined();
    });
  });
});
