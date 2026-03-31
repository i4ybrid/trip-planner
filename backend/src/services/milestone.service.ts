import { getPrisma } from '@/lib/prisma';
import { notificationService } from './notification.service';
import { timelineService } from '@/services/timeline.service';
import { MilestoneType, MilestoneActionType } from '@prisma/client';

interface MilestoneTemplate {
  type: MilestoneType;
  name: string;
  daysFromStart: number;
  isHard: boolean;
  priority: number;
}

const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    type: 'COMMITMENT_REQUEST',
    name: 'Commitment Request',
    daysFromStart: -60,
    isHard: false,
    priority: 1,
  },
  {
    type: 'COMMITMENT_DEADLINE',
    name: 'Commitment Deadline',
    daysFromStart: -30,
    isHard: true,
    priority: 2,
  },
  {
    type: 'FINAL_PAYMENT_DUE',
    name: 'Final Payment Due',
    daysFromStart: -7,
    isHard: true,
    priority: 3,
  },
  {
    type: 'SETTLEMENT_DUE',
    name: 'Settlement Due',
    daysFromStart: 7,
    isHard: true,
    priority: 4,
  },
  {
    type: 'SETTLEMENT_COMPLETE',
    name: 'Settlement Complete',
    daysFromStart: 14,
    isHard: false,
    priority: 5,
  },
];

export class MilestoneService {
  private prisma = getPrisma();

  /**
   * Generate default milestones using TODAY as the baseline.
   * This is a manual backup for trips that skipped auto-generation.
   *
   * Algorithm:
   *   T_total = days from today to trip.startDate
   *   Commitment Request    = today + 50% of T_total
   *   Commitment Deadline   = today + 65% of T_total
   *   Final Payment Due      = today + 90% of T_total
   *   Settlement Due         = trip.endDate + 1 day
   *   Settlement Complete    = trip.endDate + 7 days
   */
  async generateDefaultMilestonesFromToday(
    tripId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<any[]> {
    // Delete any existing milestones first
    await this.prisma.milestone.deleteMany({ where: { tripId } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tripStart = new Date(startDate);
    tripStart.setHours(0, 0, 0, 0);

    const msPerDay = 24 * 60 * 60 * 1000;
    const T_total = Math.max(1, Math.round((tripStart.getTime() - today.getTime()) / msPerDay));

    const addDays = (base: Date, days: number): Date => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    const records = [
      {
        type: 'COMMITMENT_REQUEST' as const,
        name: 'Commitment Request',
        daysOffset: Math.ceil(T_total * 0.5),
        isHard: false,
        priority: 1,
      },
      {
        type: 'COMMITMENT_DEADLINE' as const,
        name: 'Commitment Deadline',
        daysOffset: Math.ceil(T_total * 0.65),
        isHard: true,
        priority: 2,
      },
      {
        type: 'FINAL_PAYMENT_DUE' as const,
        name: 'Final Payment Due',
        daysOffset: Math.ceil(T_total * 0.9),
        isHard: true,
        priority: 3,
      },
      {
        type: 'SETTLEMENT_DUE' as const,
        name: 'Settlement Due',
        daysOffset: null, // special: relative to endDate
        isHard: true,
        priority: 4,
      },
      {
        type: 'SETTLEMENT_COMPLETE' as const,
        name: 'Settlement Complete',
        daysOffset: null, // special: relative to endDate
        isHard: false,
        priority: 5,
      },
    ];

    const milestones = records.map((r) => {
      let dueDate: Date;
      if (r.daysOffset === null) {
        const base = new Date(endDate);
        base.setHours(0, 0, 0, 0);
        const extra = r.type === 'SETTLEMENT_DUE' ? 1 : 7;
        dueDate = addDays(base, extra);
      } else {
        dueDate = addDays(today, r.daysOffset);
      }

      const reminderAt = new Date(dueDate);
      reminderAt.setDate(reminderAt.getDate() - 3);

      return {
        tripId,
        type: r.type,
        name: r.name,
        dueDate,
        reminderAt,
        isHard: r.isHard,
        isManualOverride: false,
        isSkipped: false,
        isLocked: false,
        priority: r.priority,
      };
    });

    await this.prisma.milestone.createMany({ data: milestones });

    // Mark trip as having auto-generated milestones
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { autoMilestonesGenerated: true },
    });

    return this.prisma.milestone.findMany({
      where: { tripId },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });
  }

  /**
   * Generate default milestones for a trip based on start date
   */
  async generateDefaultMilestones(
    tripId: string,
    startDate: Date,
    _endDate: Date,
    tripCreatedAt: Date
  ): Promise<void> {
    // Delete any existing milestones first
    await this.prisma.milestone.deleteMany({ where: { tripId } });

    const milestones = MILESTONE_TEMPLATES.map((template) => {
      // Calculate due date based on start date
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + template.daysFromStart);

      // Don't create milestones in the past if trip was created recently
      // For past trips, shift milestones to be relative to trip creation
      let finalDueDate = dueDate;
      if (dueDate < tripCreatedAt) {
        finalDueDate = new Date(tripCreatedAt);
        finalDueDate.setDate(finalDueDate.getDate() + Math.abs(template.daysFromStart));
      }

      const reminderAt = new Date(finalDueDate);
      reminderAt.setDate(reminderAt.getDate() - 3);

      return {
        tripId,
        type: template.type,
        name: template.name,
        dueDate: finalDueDate,
        reminderAt,
        isHard: template.isHard,
        isManualOverride: false,
        isSkipped: false,
        isLocked: false,
        priority: template.priority,
      };
    });

    // Create milestones
    await this.prisma.milestone.createMany({ data: milestones });

    // Mark trip as having auto-generated milestones
    await this.prisma.trip.update({
      where: { id: tripId },
      data: { autoMilestonesGenerated: true },
    });
  }

  /**
   * Recalculate milestone dates when trip start date changes
   * Only updates milestones that are not locked or skipped
   */
  async recalculateMilestones(tripId: string, newStartDate: Date): Promise<void> {
    const milestones = await this.prisma.milestone.findMany({
      where: {
        tripId,
        isLocked: false,
        isSkipped: false,
      },
    });

    for (const milestone of milestones) {
      const template = MILESTONE_TEMPLATES.find((t) => t.type === milestone.type);
      if (!template) continue;

      const newDueDate = new Date(newStartDate);
      newDueDate.setDate(newDueDate.getDate() + template.daysFromStart);

      const daysDelta = newDueDate.getTime() - milestone.dueDate.getTime();
      const newReminderAt = milestone.reminderAt
        ? new Date(milestone.reminderAt.getTime() + daysDelta)
        : undefined;

      await this.prisma.milestone.update({
        where: { id: milestone.id },
        data: { dueDate: newDueDate, reminderAt: newReminderAt },
      });
    }
  }

  /**
   * Get all milestones with completion status for each member
   */
  async getMilestonesWithProgress(tripId: string): Promise<any[]> {
    const milestones = await this.prisma.milestone.findMany({
      where: { tripId },
      include: {
        completions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });

    const members = await this.prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Attach completion status for each member to each milestone
    return milestones.map((milestone) => {
      const memberCompletions = members.map((member) => {
        const completion = milestone.completions.find((c) => c.userId === member.userId);
        return {
          userId: member.userId,
          userName: member.user.name,
          userAvatarUrl: member.user.avatarUrl,
          status: completion?.status || 'PENDING',
          completedAt: completion?.completedAt,
          note: completion?.note,
        };
      });

      const completedCount = milestone.completions.filter(
        (c) => c.status === 'COMPLETED'
      ).length;

      return {
        ...milestone,
        memberCompletions,
        completedCount,
        totalMembers: members.length,
        completions: undefined, // Remove raw completions from response
      };
    });
  }

  /**
   * Trigger on-demand action (payment request or settlement reminder)
   * Creates notifications for all recipients
   */
  async triggerOnDemandAction(
    tripId: string,
    actionType: MilestoneActionType,
    sentById: string,
    recipientIds: string[],
    message?: string
  ): Promise<void> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { name: true },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    // Create milestone action record
    await this.prisma.milestoneAction.create({
      data: {
        tripId,
        actionType,
        sentById,
        message,
        recipientIds,
      },
    });

    // Determine notification title and body based on action type
    const notificationType = actionType === 'PAYMENT_REQUEST' ? 'PAYMENT_REQUEST' : 'SETTLEMENT_REMINDER';
    const title = actionType === 'PAYMENT_REQUEST' ? 'Payment Request' : 'Settlement Reminder';
    const body = message || `Reminder from ${trip.name} organizer`;

    // Create notifications for each recipient
    for (const recipientId of recipientIds) {
      await notificationService.createNotification({
        userId: recipientId,
        category: notificationType === 'PAYMENT_REQUEST' ? 'PAYMENT' : 'SETTLEMENT',
        title,
        body,
        referenceId: tripId,
        referenceType: 'BILL_SPLIT',
        link: `/trip/${tripId}/payments`,
      });
    }
  }

  /**
   * Create a custom milestone
   */
  async createCustomMilestone(
    tripId: string,
    data: {
      name: string;
      type: string;
      dueDate: Date;
      isHard?: boolean;
      priority?: number;
    }
  ): Promise<any> {
    const reminderAt = new Date(data.dueDate);
    reminderAt.setDate(reminderAt.getDate() - 3);

    return this.prisma.milestone.create({
      data: {
        tripId,
        type: data.type as MilestoneType,
        name: data.name,
        dueDate: data.dueDate,
        reminderAt,
        isHard: data.isHard ?? true,
        isManualOverride: true,
        isLocked: false,
        isSkipped: false,
        priority: data.priority ?? 10,
      },
    });
  }

  /**
   * Update milestone (date, lock, skip, hard/soft)
   */
  async updateMilestone(
    milestoneId: string,
    data: {
      dueDate?: Date;
      isLocked?: boolean;
      isSkipped?: boolean;
      isHard?: boolean;
      name?: string;
    }
  ): Promise<any> {
    const updateData: any = {};
    
    if (data.dueDate !== undefined) {
      updateData.dueDate = data.dueDate;
      const reminderAt = new Date(data.dueDate);
      reminderAt.setDate(reminderAt.getDate() - 3);
      updateData.reminderAt = reminderAt;
      updateData.isManualOverride = true;
    }
    if (data.isLocked !== undefined) updateData.isLocked = data.isLocked;
    if (data.isSkipped !== undefined) updateData.isSkipped = data.isSkipped;
    if (data.isHard !== undefined) updateData.isHard = data.isHard;
    if (data.name !== undefined) updateData.name = data.name;

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });
  }

  /**
   * Update milestone completion for a specific user
   */
  async updateMilestoneCompletion(
    milestoneId: string,
    userId: string,
    status: string,
    note?: string
  ): Promise<any> {
    const result = await this.prisma.milestoneCompletion.upsert({
      where: {
        milestoneId_userId: {
          milestoneId,
          userId,
        },
      },
      update: {
        status: status as any,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        note,
      },
      create: {
        milestoneId,
        userId,
        status: status as any,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        note,
      },
    });

    // Emit milestone_occurred timeline event when milestone is completed
    if (status === 'COMPLETED') {
      try {
        const milestone = await this.prisma.milestone.findUnique({
          where: { id: milestoneId },
          select: { name: true, type: true, tripId: true },
        });
        if (milestone) {
          await timelineService.emitTimelineEvent({
            tripId: milestone.tripId,
            eventType: 'milestone_occurred',
            description: `Milestone "${milestone.name}" was completed`,
            actorId: userId,
            metadata: { milestoneId, milestoneType: milestone.type },
          });
        }
      } catch (e) {
        console.error('Timeline event failed:', e);
      }
    }

    return result;
  }

  /**
   * Get milestone completion progress per member
   */
  async getMilestoneProgress(tripId: string): Promise<any> {
    const members = await this.prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    const milestones = await this.prisma.milestone.findMany({
      where: { tripId },
      include: {
        completions: true,
      },
    });

    // Calculate progress per member
    const memberProgress = members.map((member) => {
      const memberCompletions = milestones.map((milestone) => {
        const completion = milestone.completions.find((c) => c.userId === member.userId);
        return {
          milestoneId: milestone.id,
          milestoneName: milestone.name,
          milestoneType: milestone.type,
          dueDate: milestone.dueDate,
          status: completion?.status || 'PENDING',
          completedAt: completion?.completedAt,
        };
      });

      const completedMilestones = memberCompletions.filter(
        (c) => c.status === 'COMPLETED'
      ).length;
      const totalMilestones = milestones.filter((m) => !m.isSkipped).length;

      return {
        userId: member.userId,
        userName: member.user.name,
        userAvatarUrl: member.user.avatarUrl,
        completions: memberCompletions,
        completedMilestones,
        totalMilestones,
        progressPercentage: totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0,
      };
    });

    // Overall milestone summary
    const activeMilestones = milestones.filter((m) => !m.isSkipped);
    const overdueMilestones = activeMilestones.filter(
      (m) => new Date(m.dueDate) < new Date() && !m.isSkipped
    );
    const completedMilestones = activeMilestones.filter(
      (m) => m.completions.every((c) => c.status === 'COMPLETED')
    );

    return {
      milestones: activeMilestones.map((m) => ({
        id: m.id,
        name: m.name,
        type: m.type,
        dueDate: m.dueDate,
        isHard: m.isHard,
        isLocked: m.isLocked,
        isSkipped: m.isSkipped,
      })),
      memberProgress,
      summary: {
        totalMilestones: activeMilestones.length,
        completedMilestones: completedMilestones.length,
        overdueMilestones: overdueMilestones.length,
      },
    };
  }
}

export const milestoneService = new MilestoneService();
