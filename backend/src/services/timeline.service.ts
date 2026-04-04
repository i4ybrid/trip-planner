import { getPrisma } from '@/lib/prisma';
import { getSocketIO } from '@/lib/socket';
import { RefreshState, TimelineEventKind } from '@prisma/client';

export interface EmitTimelineEventInput {
  tripId: string;
  eventType: string; // SCREAMING_SNAKE_CASE
  actorId?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  description?: string;
  effectiveDate?: Date;
}

const MILESTONE_ICON_MAP: Record<string, string> = {
  COMMITMENT_REQUEST: 'Handshake',
  COMMITMENT_DEADLINE: 'Clock',
  FINAL_PAYMENT_DUE: 'DollarSign',
  CUSTOM: 'Star',
};

function getActivityIcon(category: string): string {
  const map: Record<string, string> = {
    accommodation: 'Home',
    dining: 'UtensilsCrossed',
    activity: 'MapPin',
    transport: 'Car',
    flight: 'Plane',
  };
  return map[category] ?? 'Calendar';
}

export class TimelineService {
  // Use a getter so getPrisma() is resolved at method-call time (after setPrisma/forks)
  private get prisma() { return getPrisma(); }

  async emitTimelineEvent(input: EmitTimelineEventInput): Promise<void> {
    const event = await this.prisma.timelineEvent.create({
      data: {
        tripId: input.tripId,
        eventType: input.eventType,
        description: input.description,
        actorId: input.actorId,
        targetId: input.targetId,
        metadata: input.metadata ?? undefined,
        effectiveDate: input.effectiveDate ?? undefined,
      },
    });

    // Emit to connected clients in the trip room
    const io = getSocketIO();
    if (io) {
      io.to(`trip:${input.tripId}`).emit('timeline:event', event);
    }
  }

  /**
   * Upsert TripTimelineUIState, setting needsRefresh = RefreshState.TRUE.
   * Called after any write operation so the timeline UI knows to refresh.
   */
  async upsertNeedsRefresh(tripId: string): Promise<void> {
    await this.prisma.tripTimelineUIState.upsert({
      where: { tripId },
      update: { needsRefresh: RefreshState.TRUE },
      create: { tripId, cachedEventIds: '[]', needsRefresh: RefreshState.TRUE },
    });
  }

  /**
   * Write a MILESTONE TimelineEvent for the given milestone, then call upsertNeedsRefresh.
   */
  async writeMilestoneToTimeline(
    milestone: {
      id: string;
      tripId: string;
      type: string;
      name: string;
      dueDate: Date;
      isLocked?: boolean;
      isHard?: boolean;
      isSkipped?: boolean;
      isManualOverride?: boolean;
      priority?: number;
    },
    tripMasterId?: string | null
  ): Promise<void> {
    const icon = MILESTONE_ICON_MAP[milestone.type] ?? 'Star';

    // INSERT TimelineEvent
    const event = await this.prisma.timelineEvent.create({
      data: {
        tripId: milestone.tripId,
        kind: TimelineEventKind.MILESTONE,
        sourceType: 'MILESTONE',
        sourceId: milestone.id,
        effectiveDate: milestone.dueDate,
        icon,
        title: milestone.name,
        actorId: tripMasterId ?? undefined,
        meta: JSON.stringify({
          type: milestone.type,
          isLocked: milestone.isLocked ?? false,
          isHard: milestone.isHard ?? true,
          isSkipped: milestone.isSkipped ?? false,
          isManualOverride: milestone.isManualOverride ?? false,
          priority: milestone.priority ?? 10,
        }),
      },
    });

    // Emit real-time event to timeline UI
    const io = getSocketIO();
    if (io) {
      io.to(`trip:${milestone.tripId}`).emit('timeline:event', event);
    }

    await this.upsertNeedsRefresh(milestone.tripId);
  }

  /**
   * Write ACTIVITY_START and optionally ACTIVITY_END TimelineEvents for an activity.
   */
  async writeActivityEvents(activity: {
    id: string;
    tripId: string;
    title: string;
    category: string;
    startTime: Date | null;
    endTime?: Date | null;
    createdAt: Date;
  }): Promise<void> {
    // Emit activity_added event (always, regardless of startTime)
    await this.emitTimelineEvent({
      tripId: activity.tripId,
      eventType: 'activity_added',
      description: `${activity.title} was added`,
      metadata: { activityId: activity.id, category: activity.category },
    });

    const icon = getActivityIcon(activity.category);
    // Use startTime if set, otherwise fall back to createdAt so the event appears in timeline
    const effectiveDate = activity.startTime ?? activity.createdAt;

    // INSERT ACTIVITY_START
    const startEvent = await this.prisma.timelineEvent.create({
      data: {
        tripId: activity.tripId,
        kind: TimelineEventKind.ACTIVITY_START,
        sourceType: 'ACTIVITY',
        sourceId: activity.id,
        activityId: activity.id,
        effectiveDate,
        icon,
        title: activity.title,
        meta: JSON.stringify({ category: activity.category }),
      },
    });

    const io = getSocketIO();
    if (io) {
      io.to(`trip:${activity.tripId}`).emit('timeline:event', startEvent);
    }

    // If accommodation, also INSERT ACTIVITY_END
    if (activity.category === 'accommodation' && activity.endTime) {
      const endEvent = await this.prisma.timelineEvent.create({
        data: {
          tripId: activity.tripId,
          kind: TimelineEventKind.ACTIVITY_END,
          sourceType: 'ACTIVITY',
          sourceId: activity.id,
          activityId: activity.id,
          effectiveDate: activity.endTime,
          icon: 'home',
          title: activity.title,
          meta: JSON.stringify({ category: 'accommodation' }),
        },
      });

      if (io) {
        io.to(`trip:${activity.tripId}`).emit('timeline:event', endEvent);
      }
    }

    await this.upsertNeedsRefresh(activity.tripId);
  }

  /**
   * Delete all TimelineEvents for an activity (ACTIVITY_START and ACTIVITY_END).
   */
  async deleteActivityTimelineEvents(activityId: string): Promise<void> {
    await this.prisma.timelineEvent.deleteMany({
      where: { activityId },
    });
  }

  /**
   * Delete all TimelineEvents for a milestone.
   */
  async deleteMilestoneTimelineEvents(milestoneId: string): Promise<void> {
    await this.prisma.timelineEvent.deleteMany({
      where: {
        sourceType: 'MILESTONE',
        sourceId: milestoneId,
      },
    });
  }

  /**
   * Update a MILESTONE TimelineEvent in-place (title, icon, and/or effectiveDate).
   */
  async updateMilestoneTimelineEvent(
    milestoneId: string,
    updates: { title?: string; icon?: string; effectiveDate?: Date }
  ): Promise<void> {
    const data: Record<string, any> = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.icon !== undefined) data.icon = updates.icon;
    if (updates.effectiveDate !== undefined) data.effectiveDate = updates.effectiveDate;

    if (Object.keys(data).length === 0) return;

    await this.prisma.timelineEvent.updateMany({
      where: { sourceType: 'MILESTONE', sourceId: milestoneId },
      data,
    });
  }

  /**
   * Update an ACTIVITY_START or ACTIVITY_END TimelineEvent in-place.
   */
  async updateActivityTimelineEvent(
    activityId: string,
    kind: 'ACTIVITY_START' | 'ACTIVITY_END',
    updates: { title?: string; effectiveDate?: Date; icon?: string }
  ): Promise<void> {
    const data: Record<string, any> = {};
    if (updates.title !== undefined) data.title = updates.title;
    if (updates.effectiveDate !== undefined) data.effectiveDate = updates.effectiveDate;
    if (updates.icon !== undefined) data.icon = updates.icon;

    if (Object.keys(data).length === 0) return;

    await this.prisma.timelineEvent.updateMany({
      where: { activityId, kind: kind as TimelineEventKind },
      data,
    });
  }

  /**
   * Recalculate the UISubset: past = most recent 10 events before now,
   * future = all events from now onward, merged and sorted DESC.
   */
  async recalculateUISubset(tripId: string): Promise<void> {
    const now = new Date();

    const allEvents = await this.prisma.timelineEvent.findMany({
      where: { tripId },
      orderBy: { effectiveDate: 'desc' },
    });

    const past = allEvents
      .filter((e) => e.effectiveDate < now)
      .slice(0, 10);

    const future = allEvents.filter((e) => e.effectiveDate >= now);

    const merged = [...past, ...future].sort(
      (a, b) => b.effectiveDate.getTime() - a.effectiveDate.getTime()
    );

    const cachedEventIds = JSON.stringify(merged.map((e) => e.id));

    await this.prisma.tripTimelineUIState.upsert({
      where: { tripId },
      update: { cachedEventIds, needsRefresh: RefreshState.FALSE },
      create: { tripId, cachedEventIds, needsRefresh: RefreshState.FALSE },
    });
  }
}

export const timelineService = new TimelineService();
