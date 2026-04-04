import cron from 'node-cron';
import { getPrisma } from '@/lib/prisma';
import { notificationService } from '@/services/notification.service';
import { NotificationCategory, NotificationReferenceType } from '@prisma/client';

const prisma = getPrisma();

/**
 * Notification Scheduler - runs cron jobs for milestone/settlement notifications
 * 
 * Schedule:
 * - Every 15 minutes: Milestone due/overdue check
 * - Every 15 minutes: Milestone reminder check
 * - Daily at 8 AM: Settlement due check
 */
export function startNotificationScheduler() {
  // Every 15 minutes: check milestone due/overdue
  cron.schedule('*/15 * * * *', async () => {
    await checkMilestoneDue();
    await checkMilestoneOverdue();
  });

  // Every 15 minutes: check milestone reminders
  cron.schedule('*/15 * * * *', async () => {
    await checkMilestoneReminders();
  });

  // Daily at 8 AM UTC: check settlement due
  cron.schedule('0 8 * * *', async () => {
    await checkSettlementDue();
  });

  console.log('[NotificationScheduler] Started');
}

async function checkMilestoneDue() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const milestones = await prisma.milestone.findMany({
      where: {
        dueDate: { gte: today, lt: tomorrow },
        isSkipped: false,
        isLocked: false,
      },
      include: {
        trip: {
          select: { id: true, name: true },
          include: {
            members: {
              where: { status: 'CONFIRMED' },
              select: { userId: true },
            },
          },
        },
      },
    });

    for (const milestone of milestones) {
      // Notify ALL confirmed trip members, not just those with PENDING completions
      const memberIds = milestone.trip.members.map((m: any) => m.userId);
      for (const userId of memberIds) {
        await notificationService.createNotification({
          userId,
          category: NotificationCategory.MILESTONE,
          title: 'Milestone Due Today',
          body: `"${milestone.name}" for ${milestone.trip.name} is due today`,
          referenceId: milestone.id,
          referenceType: NotificationReferenceType.MILESTONE,
          link: `/trip/${milestone.trip.id}`,
        });
      }
    }
    console.log(`[NotificationScheduler] Milestone due check: ${milestones.length} milestones`);
  } catch (error) {
    console.error('[NotificationScheduler] Error in milestone due check:', error);
  }
}

async function checkMilestoneOverdue() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  try {
    const milestones = await prisma.milestone.findMany({
      where: {
        dueDate: { lt: yesterday },
        isSkipped: false,
        isLocked: false,
        OR: [
          { firstOverdueNotifiedAt: null },
          { firstOverdueNotifiedAt: { lt: yesterday } },
        ],
      },
      include: {
        trip: {
          select: { id: true, name: true },
          include: {
            members: {
              where: { status: 'CONFIRMED' },
              select: { userId: true },
            },
          },
        },
      },
    });

    for (const milestone of milestones) {
      // Notify ALL confirmed trip members
      const memberIds = milestone.trip.members.map((m: any) => m.userId);
      for (const userId of memberIds) {
        await notificationService.createNotification({
          userId,
          category: NotificationCategory.MILESTONE,
          title: 'Milestone Overdue',
          body: `"${milestone.name}" for ${milestone.trip.name} is past its due date`,
          referenceId: milestone.id,
          referenceType: NotificationReferenceType.MILESTONE,
          link: `/trip/${milestone.trip.id}`,
        });
      }
      // Mark as notified
      await prisma.milestone.update({
        where: { id: milestone.id },
        data: { firstOverdueNotifiedAt: new Date() },
      });
    }
    console.log(`[NotificationScheduler] Milestone overdue check: ${milestones.length} milestones`);
  } catch (error) {
    console.error('[NotificationScheduler] Error in milestone overdue check:', error);
  }
}

async function checkMilestoneReminders() {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  try {
    const milestones = await prisma.milestone.findMany({
      where: {
        reminderAt: { gte: now, lte: inOneHour },
        isSkipped: false,
        isLocked: false,
      },
      include: {
        trip: {
          select: { id: true, name: true },
          include: {
            members: {
              where: { status: 'CONFIRMED' },
              select: { userId: true },
            },
          },
        },
      },
    });

    for (const milestone of milestones) {
      // Notify ALL confirmed trip members
      const memberIds = milestone.trip.members.map((m: any) => m.userId);
      for (const userId of memberIds) {
        await notificationService.createNotification({
          userId,
          category: NotificationCategory.MILESTONE,
          title: 'Milestone Reminder',
          body: `"${milestone.name}" for ${milestone.trip.name} is coming up soon`,
          referenceId: milestone.id,
          referenceType: NotificationReferenceType.MILESTONE,
          link: `/trip/${milestone.trip.id}`,
        });
      }
    }
    console.log(`[NotificationScheduler] Milestone reminder check: ${milestones.length} milestones`);
  } catch (error) {
    console.error('[NotificationScheduler] Error in milestone reminder check:', error);
  }
}

async function checkSettlementDue() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(23, 59, 59, 999);

  try {
    const trips = await prisma.trip.findMany({
      where: {
        endDate: { lte: yesterday },
        status: 'COMPLETED',
      },
      include: {
        members: {
          where: { status: 'CONFIRMED' },
          select: { userId: true },
        },
      },
    });

    for (const trip of trips) {
      const memberIds = trip.members.map((m: any) => m.userId);
      for (const userId of memberIds) {
        await notificationService.createNotification({
          userId,
          category: NotificationCategory.SETTLEMENT,
          title: 'Settlement Due',
          body: `Trip "${trip.name}" has ended. Please settle your balances.`,
          referenceId: trip.id,
          referenceType: NotificationReferenceType.TRIP,
          link: `/trip/${trip.id}/payments`,
        });
      }
    }
    console.log(`[NotificationScheduler] Settlement due check: ${trips.length} trips`);
  } catch (error) {
    console.error('[NotificationScheduler] Error in settlement due check:', error);
  }
}
