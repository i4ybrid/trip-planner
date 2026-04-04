import { getPrisma } from '@/lib/prisma';
import { ActivityCreateInput, ActivityUpdateInput } from '@/types';
import { timelineService } from '@/services/timeline.service';
import { billSplitService } from '@/services/billSplit.service';

export class ActivityService {
  private prisma = getPrisma();

  async createActivity(data: ActivityCreateInput) {
    const activity = await this.prisma.activity.create({
      data,
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Write timeline events for the new activity
    await timelineService.writeActivityEvents(activity);

    return activity;
  }

  async getActivityById(activityId: string) {
    return this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        votes: {
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
        mediaItems: true,
      },
    });
  }

  async getTripActivities(tripId: string) {
    return this.prisma.activity.findMany({
      where: { tripId },
      include: {
        proposer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            votes: true,
            mediaItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateActivity(activityId: string, data: ActivityUpdateInput) {
    // Fetch current activity to detect category changes
    const current = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { tripId: true, category: true },
    });

    const updated = await this.prisma.activity.update({
      where: { id: activityId },
      data,
    });

    if (!current) return updated;

    // Build updates for the timeline event
    const eventUpdates: { title?: string; effectiveDate?: Date; icon?: string } = {};
    if (data.title !== undefined) eventUpdates.title = data.title;
    if (data.startTime !== undefined) eventUpdates.effectiveDate = data.startTime;

    // Update ACTIVITY_START
    await timelineService.updateActivityTimelineEvent(
      activityId,
      'ACTIVITY_START',
      eventUpdates
    );

    // Handle accommodation category changes
    const newCategory = data.category ?? current.category;
    const wasAccommodation = current.category === 'accommodation';
    const isAccommodation = newCategory === 'accommodation';

    if (!wasAccommodation && isAccommodation) {
      // Newly accommodation → INSERT ACTIVITY_END
      await timelineService.writeActivityEvents(updated);
    } else if (wasAccommodation && !isAccommodation) {
      // No longer accommodation → DELETE ACTIVITY_END event
      await this.prisma.timelineEvent.deleteMany({
        where: { activityId, kind: 'ACTIVITY_END' },
      });
    } else if (wasAccommodation && isAccommodation) {
      // Still accommodation → update ACTIVITY_END
      await timelineService.updateActivityTimelineEvent(
        activityId,
        'ACTIVITY_END',
        { title: data.title, effectiveDate: data.endTime }
      );
    }

    await timelineService.upsertNeedsRefresh(updated.tripId);
    return updated;
  }

  async deleteActivity(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { tripId: true },
    });

    if (activity) {
      // Emit activity_removed event
      await timelineService.emitTimelineEvent({
        tripId: activity.tripId,
        eventType: 'activity_removed',
        description: 'An activity was removed',
      });

      // Delete associated timeline events
      await timelineService.deleteActivityTimelineEvents(activityId);
      await timelineService.upsertNeedsRefresh(activity.tripId);
    }

    return this.prisma.activity.delete({
      where: { id: activityId },
    });
  }

  async confirmActivity(activityId: string, userId: string, tripId: string) {
    const activity = await this.prisma.activity.update({
      where: { id: activityId },
      data: { status: 'CONFIRMED', confirmedAt: new Date(), confirmedBy: userId },
    });

    // Emit activity_booked timeline event
    await timelineService.emitTimelineEvent({
      tripId: activity.tripId,
      eventType: 'activity_booked',
      actorId: userId,
      description: `confirmed "${activity.title}"`,
      metadata: {
        activityId: activity.id,
        title: activity.title,
        category: activity.category,
        cost: activity.cost ? String(activity.cost) : null,
        costType: activity.costType,
      },
      effectiveDate: new Date(),
    });
    await timelineService.upsertNeedsRefresh(activity.tripId);

    // Auto-create BillSplit if activity has a cost > 0
    if (activity.cost && activity.cost.gt(0)) {
      try {
        const confirmedMembers = await this.prisma.tripMember.findMany({
          where: { tripId, status: 'CONFIRMED' },
          select: { userId: true },
        });

        let members: { userId: string; dollarAmount: number }[] = [];
        const costAmount = activity.cost.toNumber();

        if (activity.costType === 'FIXED') {
          // Only the payer owes the full amount
          members = confirmedMembers.map((m) => ({
            userId: m.userId,
            dollarAmount: m.userId === activity.proposedBy ? costAmount : 0,
          }));
        } else {
          // PER_PERSON: divide equally among all confirmed members
          const perPerson = costAmount / confirmedMembers.length;
          members = confirmedMembers.map((m) => ({
            userId: m.userId,
            dollarAmount: perPerson,
          }));
        }

        await billSplitService.createBillSplit({
          tripId,
          title: activity.title,
          amount: costAmount,
          currency: activity.currency,
          costType: activity.costType,
          activityId: activity.id,
          paidBy: activity.proposedBy,
          createdBy: userId,
          splitType: 'EQUAL',
          members,
        });
      } catch (err) {
        console.error('Failed to create BillSplit for confirmed activity:', err);
      }
    }

    return activity;
  }

  async rejectActivity(activityId: string, userId: string) {
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { status: 'REJECTED', rejectedAt: new Date(), rejectedBy: userId },
    });
  }

  async getVoteCounts(activityId: string) {
    const votes = await this.prisma.vote.findMany({
      where: { activityId },
      select: { option: true },
    });

    return {
      yes: votes.filter((v) => v.option === 'YES').length,
      no: votes.filter((v) => v.option === 'NO').length,
      maybe: votes.filter((v) => v.option === 'MAYBE').length,
      total: votes.length,
    };
  }
}

export const activityService = new ActivityService();
