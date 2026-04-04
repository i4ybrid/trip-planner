import { getPrisma } from '@/lib/prisma';
import { timelineService } from '@/services/timeline.service';
import { MilestoneType, MilestoneActionType } from '@prisma/client';

const MILESTONE_ICON_MAP: Record<string, string> = {
  COMMITMENT_REQUEST: 'Handshake',
  COMMITMENT_DEADLINE: 'Clock',
  FINAL_PAYMENT_DUE: 'DollarSign',
  SETTLEMENT_DUE: 'FileText',
  SETTLEMENT_COMPLETE: 'CheckCircle',
  CUSTOM: 'Star',
};

interface MilestoneTemplate {
  type: MilestoneType;
  name: string;
  daysFromStart: number;
  daysFromEnd?: number;
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
    daysFromStart: 0,
    daysFromEnd: 1,
    isHard: true,
    priority: 4,
  },
  {
    type: 'SETTLEMENT_COMPLETE',
    name: 'Settlement Complete',
    daysFromStart: 0,
    daysFromEnd: 7,
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
    ];

    const milestones = records.map((r) => {
      let dueDate: Date;
      if (r.daysOffset === null) {
        const base = new Date(endDate);
        base.setHours(0, 0, 0, 0);
        dueDate = base;
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

    // Fetch trip master ID for timeline events
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { tripMasterId: true },
    });

    // Write timeline events for each milestone
    const createdMilestones = await this.prisma.milestone.findMany({
      where: { tripId },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });

    for (const milestone of createdMilestones) {
      await timelineService.writeMilestoneToTimeline(
        {
          id: milestone.id,
          tripId: milestone.tripId,
          type: milestone.type,
          name: milestone.name,
          dueDate: milestone.dueDate,
        },
        trip?.tripMasterId
      );
    }

    await timelineService.upsertNeedsRefresh(tripId);

    return createdMilestones;
  }

  /**
   * Generate idea-phase milestones: COMMITMENT_REQUEST and COMMITMENT_DEADLINE.
   * These are created when a trip is first made (IDEA → PLANNING transition).
   *
   * Algorithm:
   *   T_remaining_ms = startDate.getTime() - Date.now()
   *   COMMITMENT_REQUEST  = now + T_remaining_ms × 0.30
   *   COMMITMENT_DEADLINE = now + T_remaining_ms × 0.50
   *
   * Only creates if not already exists for this trip.
   */
  async generateIdeaMilestones(tripId: string, startDate: Date): Promise<any[]> {
    const now = new Date();
    const T_remaining_ms = startDate.getTime() - now.getTime();

    const addMs = (base: Date, ms: number): Date => new Date(base.getTime() + ms);

    const records = [
      {
        type: 'COMMITMENT_REQUEST' as const,
        name: 'Commitment Request',
        dueDate: addMs(now, T_remaining_ms * 0.30),
        priority: 1,
        isHard: false,
      },
      {
        type: 'COMMITMENT_DEADLINE' as const,
        name: 'Commitment Deadline',
        dueDate: addMs(now, T_remaining_ms * 0.50),
        priority: 2,
        isHard: true,
      },
    ];

    const created: any[] = [];

    for (const r of records) {
      // Idempotent: skip if already exists
      const existing = await this.prisma.milestone.findFirst({
        where: { tripId, type: r.type },
      });
      if (existing) continue;

      const reminderAt = new Date(r.dueDate);
      reminderAt.setDate(reminderAt.getDate() - 3);

      const milestone = await this.prisma.milestone.create({
        data: {
          tripId,
          type: r.type,
          name: r.name,
          dueDate: r.dueDate,
          reminderAt,
          isHard: r.isHard,
          isManualOverride: false,
          isSkipped: false,
          isLocked: false,
          priority: r.priority,
        },
      });
      created.push(milestone);
    }

    // Write timeline events
    if (created.length > 0) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        select: { tripMasterId: true },
      });
      for (const milestone of created) {
        await timelineService.writeMilestoneToTimeline(
          {
            id: milestone.id,
            tripId: milestone.tripId,
            type: milestone.type,
            name: milestone.name,
            dueDate: milestone.dueDate,
          },
          trip?.tripMasterId
        );
      }
      await timelineService.upsertNeedsRefresh(tripId);
    }

    return created;
  }

  /**
   * Generate FINAL_PAYMENT_DUE milestone.
   * Called when trip moves to PLANNING or CONFIRMED status.
   *
   * Algorithm:
   *   FINAL_PAYMENT_DUE = now + T_remaining_ms × 0.75
   *   where T_remaining_ms = startDate.getTime() - Date.now()
   *
   * Idempotent: only creates if one doesn't already exist for this trip.
   */
  async generateFinalPaymentMilestone(tripId: string, startDate: Date): Promise<any | null> {
    const existing = await this.prisma.milestone.findFirst({
      where: { tripId, type: 'FINAL_PAYMENT_DUE' },
    });
    if (existing) return null;

    const now = new Date();
    const T_remaining_ms = startDate.getTime() - now.getTime();
    const dueDate = new Date(now.getTime() + T_remaining_ms * 0.75);
    const reminderAt = new Date(dueDate);
    reminderAt.setDate(reminderAt.getDate() - 3);

    const milestone = await this.prisma.milestone.create({
      data: {
        tripId,
        type: 'FINAL_PAYMENT_DUE',
        name: 'Final Payment Due',
        dueDate,
        reminderAt,
        isHard: true,
        isManualOverride: false,
        isSkipped: false,
        isLocked: false,
        priority: 3,
      },
    });

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { tripMasterId: true },
    });
    await timelineService.writeMilestoneToTimeline(
      {
        id: milestone.id,
        tripId: milestone.tripId,
        type: milestone.type,
        name: milestone.name,
        dueDate: milestone.dueDate,
      },
      trip?.tripMasterId
    );
    await timelineService.upsertNeedsRefresh(tripId);

    return milestone;
  }

  /**
   * Generate settlement milestones: SETTLEMENT_DUE and SETTLEMENT_COMPLETE.
   * Called when trip moves to HAPPENING status.
   *
   * Algorithm:
   *   SETTLEMENT_DUE     = endDate + 1 day
   *   SETTLEMENT_COMPLETE = endDate + 7 days
   *
   * Creates both milestones if they don't already exist for this trip.
   */
  async generateSettlementMilestones(tripId: string, endDate: Date): Promise<any[]> {
    const addDays = (base: Date, days: number): Date => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    const records = [
      {
        type: 'SETTLEMENT_DUE' as const,
        name: 'Settlement Due',
        dueDate: addDays(endDate, 1),
        priority: 4,
        isHard: true,
      },
      {
        type: 'SETTLEMENT_COMPLETE' as const,
        name: 'Settlement Complete',
        dueDate: addDays(endDate, 7),
        priority: 5,
        isHard: false,
      },
    ];

    const created: any[] = [];

    for (const r of records) {
      const existing = await this.prisma.milestone.findFirst({
        where: { tripId, type: r.type },
      });
      if (existing) continue;

      const reminderAt = new Date(r.dueDate);
      reminderAt.setDate(reminderAt.getDate() - 3);

      const milestone = await this.prisma.milestone.create({
        data: {
          tripId,
          type: r.type,
          name: r.name,
          dueDate: r.dueDate,
          reminderAt,
          isHard: r.isHard,
          isManualOverride: false,
          isSkipped: false,
          isLocked: false,
          priority: r.priority,
        },
      });
      created.push(milestone);
    }

    if (created.length > 0) {
      const trip = await this.prisma.trip.findUnique({
        where: { id: tripId },
        select: { tripMasterId: true },
      });
      for (const milestone of created) {
        await timelineService.writeMilestoneToTimeline(
          {
            id: milestone.id,
            tripId: milestone.tripId,
            type: milestone.type,
            name: milestone.name,
            dueDate: milestone.dueDate,
          },
          trip?.tripMasterId
        );
      }
      await timelineService.upsertNeedsRefresh(tripId);
    }

    return created;
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
   * Trigger on-demand action.
   * NOTE: SETTLEMENT_REMINDER and PAYMENT_REQUEST action types are no longer supported.
   * Settlement reminders are now sent via the Payments tab using reminderService.
   */
  async triggerOnDemandAction(
    _tripId: string,
    actionType: MilestoneActionType,
    _sentById: string,
    _recipientIds: string[],
    _message?: string
  ): Promise<void> {
    throw new Error(`Unsupported action type: ${actionType}. Settlement reminders are now sent via the Payments tab.`);
  }

  /**
   * Create a milestone of any type (COMMITMENT_REQUEST, COMMITMENT_DEADLINE,
   * FINAL_PAYMENT_DUE, SETTLEMENT_DUE, SETTLEMENT_COMPLETE, or CUSTOM).
   */
  async createMilestone(
    tripId: string,
    data: {
      name: string;
      type: MilestoneType;
      dueDate: Date;
      isHard?: boolean;
      priority?: number;
    }
  ): Promise<any> {
    const reminderAt = new Date(data.dueDate);
    reminderAt.setDate(reminderAt.getDate() - 3);

    const milestone = await this.prisma.milestone.create({
      data: {
        tripId,
        type: data.type,
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

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { tripMasterId: true },
    });

    await timelineService.writeMilestoneToTimeline(
      {
        id: milestone.id,
        tripId: milestone.tripId,
        type: milestone.type,
        name: milestone.name,
        dueDate: milestone.dueDate,
      },
      trip?.tripMasterId
    );
    await timelineService.upsertNeedsRefresh(tripId);

    return milestone;
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

    const milestone = await this.prisma.milestone.create({
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

    // Fetch tripMasterId for the timeline event
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      select: { tripMasterId: true },
    });

    await timelineService.writeMilestoneToTimeline(
      {
        id: milestone.id,
        tripId: milestone.tripId,
        type: milestone.type,
        name: milestone.name,
        dueDate: milestone.dueDate,
      },
      trip?.tripMasterId
    );
    await timelineService.upsertNeedsRefresh(tripId);

    return milestone;
  }

  /**
   * Delete a milestone and its timeline events
   */
  async deleteMilestone(milestoneId: string): Promise<void> {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { tripId: true },
    });

    if (milestone) {
      await timelineService.deleteMilestoneTimelineEvents(milestoneId);
      await timelineService.upsertNeedsRefresh(milestone.tripId);
    }

    await this.prisma.milestone.delete({ where: { id: milestoneId } });
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
    // Fetch the existing milestone to compare dueDate
    const existing = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
      select: { tripId: true, dueDate: true },
    });

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

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: updateData,
    });

    // If dueDate changed, sync the timeline event's effectiveDate
    if (
      existing &&
      data.dueDate !== undefined &&
      existing.dueDate.getTime() !== data.dueDate.getTime()
    ) {
      await timelineService.updateMilestoneTimelineEvent(milestoneId, {
        effectiveDate: data.dueDate,
      });
      await timelineService.upsertNeedsRefresh(existing.tripId);
    }

    return updated;
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

    // Update the existing MILESTONE timeline event in-place when completed
    if (status === 'COMPLETED') {
      try {
        const milestone = await this.prisma.milestone.findUnique({
          where: { id: milestoneId },
          select: { name: true, type: true, tripId: true },
        });
        if (milestone) {
          const icon = MILESTONE_ICON_MAP[milestone.type] ?? 'Star';
          await timelineService.updateMilestoneTimelineEvent(milestoneId, {
            title: milestone.name,
            icon,
          });
          await timelineService.upsertNeedsRefresh(milestone.tripId);
        }
      } catch (e) {
        console.error('Timeline update failed:', e);
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
