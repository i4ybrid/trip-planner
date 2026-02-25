import prisma from '@/lib/prisma';

export class NotificationService {
  async getNotifications(_userId: string, limit = 50) {
    return prisma.notification.findMany({
      where: { userId: _userId },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async markAsRead(notificationId: string, _userId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async createNotification(data: {
    userId: string;
    tripId?: string;
    type: string;
    title: string;
    body: string;
    actionType?: string;
    actionId?: string;
    actionUrl?: string;
    priority?: string;
    scheduledFor?: Date;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        tripId: data.tripId,
        type: data.type as any,
        title: data.title,
        body: data.body,
        actionType: data.actionType,
        actionId: data.actionId,
        actionUrl: data.actionUrl,
        priority: data.priority,
        scheduledFor: data.scheduledFor,
      },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async createTripNotification(tripId: string, type: string, title: string, body: string, excludeUserId?: string) {
    const members = await prisma.tripMember.findMany({
      where: { tripId },
      select: { userId: true },
    });

    const notifications = [];
    for (const member of members) {
      if (member.userId === excludeUserId) continue;

      const notification = await this.createNotification({
        userId: member.userId,
        tripId,
        type,
        title,
        body,
        actionType: 'trip',
        actionId: tripId,
      });

      notifications.push(notification);
    }

    return notifications;
  }
}

export const notificationService = new NotificationService();
