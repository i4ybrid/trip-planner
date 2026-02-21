import { PrismaClient, Notification } from '@prisma/client';

export type { Notification };

export type NotificationType = 
  | 'reminder'
  | 'payment'
  | 'vote'
  | 'message'
  | 'milestone'
  | 'invite';

export interface CreateNotificationInput {
  userId: string;
  tripId?: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
}

export class NotificationService {
  constructor(private prisma: PrismaClient) {}

  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        tripId: input.tripId,
        type: input.type,
        title: input.title,
        body: input.body,
        actionUrl: input.actionUrl,
      },
    });
  }

  async getUserNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, read: false },
    });
  }

  async markAsRead(notificationId: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  async getTripNotifications(tripId: string, userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { tripId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async notifyTripMembers(
    tripId: string,
    type: NotificationType,
    title: string,
    body: string,
    actionUrl?: string,
    excludeUserId?: string
  ): Promise<void> {
    const members = await this.prisma.tripMember.findMany({
      where: {
        tripId,
        status: 'CONFIRMED',
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      select: { userId: true },
    });

    await this.prisma.notification.createMany({
      data: members.map((member) => ({
        userId: member.userId,
        tripId,
        type,
        title,
        body,
        actionUrl,
      })),
    });
  }

  async notifyVoters(
    activityId: string,
    title: string,
    body: string
  ): Promise<void> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        votes: { select: { userId: true } },
        trip: { select: { id: true } },
      },
    });

    if (!activity) return;

    const userIds = [...new Set(activity.votes.map(v => v.userId))];

    await this.prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        tripId: activity.trip.id,
        type: 'vote',
        title,
        body,
        actionUrl: `/trip/${activity.trip.id}/activities`,
      })),
    });
  }

  async notifyMessageMentioned(
    tripId: string,
    messageContent: string,
    senderName: string,
    mentionedUserIds: string[]
  ): Promise<void> {
    await this.prisma.notification.createMany({
      data: mentionedUserIds.map(userId => ({
        userId,
        tripId,
        type: 'message',
        title: `${senderName} mentioned you`,
        body: messageContent,
        actionUrl: `/trip/${tripId}/chat`,
      })),
    });
  }

  async notifyEveryone(
    tripId: string,
    title: string,
    body: string,
    excludeUserId?: string
  ): Promise<void> {
    await this.notifyTripMembers(
      tripId,
      'message',
      title,
      body,
      `/trip/${tripId}/chat`,
      excludeUserId
    );
  }
}
