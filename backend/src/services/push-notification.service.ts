import { PrismaClient } from '@prisma/client';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: { action: string; title: string }[];
}

// Stub implementation - requires web-push to be configured
export class PushNotificationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async saveSubscription(userId: string, subscription: PushSubscription): Promise<void> {
    console.log('Push notifications not configured - web-push not installed');
  }

  async removeSubscription(userId: string, endpoint: string): Promise<void> {
    console.log('Push notifications not configured');
  }

  async sendPushNotification(subscription: PushSubscription, payload: PushNotificationPayload): Promise<boolean> {
    console.log('Push notifications not configured');
    return false;
  }

  async notifyUser(userId: string, payload: PushNotificationPayload): Promise<number> {
    console.log('Push notifications not configured');
    return 0;
  }

  async notifyTripMembers(tripId: string, payload: PushNotificationPayload, excludeUserId?: string): Promise<number> {
    console.log('Push notifications not configured');
    return 0;
  }

  async notifyMultipleUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    console.log('Push notifications not configured');
    return 0;
  }

  async broadcastTripUpdate(tripId: string, title: string, body: string): Promise<number> {
    return 0;
  }

  async sendNewMessageNotification(tripId: string, senderName: string, messagePreview: string, excludeUserId: string): Promise<number> {
    return 0;
  }

  async sendVoteNotification(tripId: string, activityTitle: string, userId: string): Promise<number> {
    return 0;
  }

  async sendPaymentRequestNotification(tripId: string, tripName: string, amount: string, userId: string): Promise<number> {
    return 0;
  }

  async sendBookingConfirmationNotification(tripId: string, activityName: string, userId: string): Promise<number> {
    return 0;
  }
}
