import { getPrisma } from '@/lib/prisma';
import { NotificationCategory, NotificationReferenceType } from '@prisma/client';

export interface CreateNotificationData {
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
  link?: string;
}

export class NotificationService {
  private prisma = getPrisma();

  async createNotification(data: CreateNotificationData) {
    return this.prisma.notification.create({
      data: {
        userId: data.userId,
        category: data.category,
        title: data.title,
        body: data.body,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        link: data.link,
        isRead: false,
      },
    });
  }

  async createTripNotification(
    tripId: string,
    category: NotificationCategory,
    title: string,
    body: string,
    excludeUserId?: string,
    referenceId?: string,
    referenceType?: NotificationReferenceType
  ) {
    const members = await this.prisma.tripMember.findMany({
      where: { tripId },
      select: { userId: true },
    });

    const notifications = [];
    for (const member of members) {
      if (member.userId === excludeUserId) continue;

      const notification = await this.createNotification({
        userId: member.userId,
        category,
        title,
        body,
        referenceId: referenceId || tripId,
        referenceType: referenceType || NotificationReferenceType.TRIP,
        link: `/trip/${tripId}`,
      });

      notifications.push(notification);
    }

    return notifications;
  }

  async createFriendNotification(
    userId: string,
    _friendId: string,
    category: NotificationCategory,
    referenceId?: string
  ) {
    return this.createNotification({
      userId,
      category,
      title: 'Friend Request',
      body: 'You have a new friend request',
      referenceId,
      referenceType: NotificationReferenceType.FRIEND_REQUEST,
      link: '/friends',
    });
  }

  async createChatMentionNotification(
    userId: string,
    messageId: string,
    tripId?: string,
    referenceType: NotificationReferenceType = NotificationReferenceType.MESSAGE
  ) {
    return this.createNotification({
      userId,
      category: NotificationCategory.CHAT,
      title: 'You were mentioned',
      body: 'Someone mentioned you in a chat',
      referenceId: messageId,
      referenceType,
      link: tripId ? `/trip/${tripId}/chat` : '/messages',
    });
  }

  async getNotifications(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      category?: NotificationCategory;
    }
  ) {
    const { limit = 50, offset = 0, category } = options || {};

    const where: any = { userId };
    if (category) where.category = category;

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return { notifications, unreadCount };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async getNotification(id: string, userId: string) {
    return this.prisma.notification.findFirst({
      where: { id, userId },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async markAsReadByReference(referenceType: NotificationReferenceType, referenceId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, referenceType, referenceId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteNotification(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async deleteOldNotifications(userId: string, beforeDate: Date) {
    return this.prisma.notification.deleteMany({
      where: { userId, createdAt: { lt: beforeDate } },
    });
  }

  // --- Preferences ---
  async getPreferences(userId: string) {
    return this.prisma.notificationPreference.findMany({
      where: { userId },
    });
  }

  async upsertPreference(
    userId: string,
    category: NotificationCategory,
    data: { inApp?: boolean; email?: boolean; push?: boolean }
  ) {
    return this.prisma.notificationPreference.upsert({
      where: { userId_category: { userId, category } },
      update: data,
      create: {
        userId,
        category,
        inApp: data.inApp ?? true,
        email: data.email ?? false,
        push: data.push ?? false,
      },
    });
  }
}

export const notificationService = new NotificationService();
