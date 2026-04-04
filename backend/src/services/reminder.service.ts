import { getPrisma } from '@/lib/prisma';
import { notificationService } from './notification.service';
import { NotificationCategory, NotificationReferenceType } from '@prisma/client';

export class ReminderService {
  private prisma = getPrisma();

  async sendBulkSettlementReminders(tripId: string, _senderId: string): Promise<{ notified: string[]; skipped: string[] }> {
    // 1. Get all BillSplits for the trip with members
    const billSplits = await this.prisma.billSplit.findMany({
      where: { tripId },
      include: { members: true },
    });

    // 2. Find members with outstanding balances (status !== 'CONFIRMED')
    const outstandingUserIds = new Set<string>();
    for (const bs of billSplits) {
      for (const m of (bs.members as any[])) {
        if (m.status !== 'CONFIRMED') {
          outstandingUserIds.add(m.userId);
        }
      }
    }

    // 3. Fetch trip name
    const trip = await this.prisma.trip.findUnique({ where: { id: tripId }, select: { name: true } });

    // 4. Create notifications
    const notified: string[] = [];
    for (const userId of outstandingUserIds) {
      await notificationService.createNotification({
        userId,
        category: NotificationCategory.SETTLEMENT,
        title: 'Settlement Reminder',
        body: `You have outstanding payments for ${trip?.name || 'this trip'}. Please settle up.`,
        referenceId: tripId,
        referenceType: NotificationReferenceType.TRIP,
        link: `/trip/${tripId}/payments`,
      });
      notified.push(userId);
    }

    return { notified, skipped: [] };
  }

  async sendSettlementReminder(tripId: string, _senderId: string, targetUserId: string): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { name: true, tripMasterId: true },
    });

    await notificationService.createNotification({
      userId: targetUserId,
      category: NotificationCategory.SETTLEMENT,
      title: 'Settlement Reminder',
      body: `You have outstanding payments for ${trip?.name || 'this trip'}. Please settle up.`,
      referenceId: tripId,
      referenceType: NotificationReferenceType.TRIP,
      link: `/trip/${tripId}/payments`,
    });
  }
}

export const reminderService = new ReminderService();
