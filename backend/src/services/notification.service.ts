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

// In-memory batch state for trip chat notifications (outside class to persist)
interface PendingTripChatBatch {
  tripId: string;
  messageIds: string[];
  messageCount: number;
  firstMessageAt: Date;
  timer?: NodeJS.Timeout;
}

const pendingTripChat: Map<string, PendingTripChatBatch> = new Map(); // key: `${userId}:${tripId}`

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

  // Batch trip chat notification: adds to pending batch, flushes after 5 min or >5 messages
  async createTripChatNotification(tripId: string, excludeUserId: string, messageId: string) {
    const members = await this.prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' },
      select: { userId: true },
    });

    for (const member of members) {
      if (member.userId === excludeUserId) continue;

      const key = member.userId + ':' + tripId;
      const existing = pendingTripChat.get(key);

      if (existing) {
        existing.messageIds.push(messageId);
        existing.messageCount++;
        if (existing.timer) clearTimeout(existing.timer);
        existing.timer = setTimeout(() => this.flushTripChatBatch(key), 5 * 60 * 1000);
        if (existing.messageCount > 5) {
          await this.flushTripChatBatch(key);
        }
      } else {
        const timer = setTimeout(() => this.flushTripChatBatch(key), 5 * 60 * 1000);
        pendingTripChat.set(key, {
          tripId,
          messageIds: [messageId],
          messageCount: 1,
          firstMessageAt: new Date(),
          timer,
        });
      }
    }
  }

  private async flushTripChatBatch(key: string) {
    const batch = pendingTripChat.get(key);
    if (!batch) return;

    pendingTripChat.delete(key);

    if (batch.timer) clearTimeout(batch.timer);

    if (batch.messageCount === 0) return;

    const userId = key.split(':')[0];
    const trip = await this.prisma.trip.findUnique({
      where: { id: batch.tripId },
      select: { name: true },
    });

    if (batch.messageCount === 1) {
      const message = await this.prisma.message.findUnique({
        where: { id: batch.messageIds[0] },
        select: { sender: { select: { name: true } }, content: true },
      });
      await this.createNotification({
        userId,
        category: NotificationCategory.CHAT,
        title: 'New message in ' + (trip?.name || 'trip'),
        body: (message?.sender?.name || 'Someone') + ': ' + (message?.content || '').substring(0, 50),
        referenceId: batch.tripId,
        referenceType: NotificationReferenceType.MESSAGE,
        link: '/trip/' + batch.tripId + '/chat',
      });
    } else {
      await this.createNotification({
        userId,
        category: NotificationCategory.CHAT,
        title: batch.messageCount + ' new messages in ' + (trip?.name || 'trip'),
        body: 'You have ' + batch.messageCount + ' unread messages in the trip chat',
        referenceId: batch.tripId,
        referenceType: NotificationReferenceType.MESSAGE,
        link: '/trip/' + batch.tripId + '/chat',
      });
    }
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
