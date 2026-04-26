import webpush from 'web-push';
import { getPrisma } from '@/lib/prisma-client';

let initialized = false;

function ensureInitialized() {
  if (initialized) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  initialized = true;
}

export const pushService = {
  async subscribe(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
    ensureInitialized();
    const prisma = getPrisma();
    await prisma.pushSubscription.upsert({
      where: { userId },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
  },

  async unsubscribe(userId: string) {
    const prisma = getPrisma();
    await prisma.pushSubscription.deleteMany({ where: { userId } });
  },

  async sendPush(userId: string, notification: { title: string; body: string; data?: Record<string, unknown> }) {
    ensureInitialized();
    const prisma = getPrisma();
    const sub = await prisma.pushSubscription.findUnique({ where: { userId } });
    if (!sub) return;
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(notification)
      );
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // Subscription expired or unreachable, clean it up
        await prisma.pushSubscription.delete({ where: { userId } });
      }
    }
  },
};
