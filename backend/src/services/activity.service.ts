import { getPrisma } from '@/lib/prisma';
import { ActivityCreateInput } from '@/types';

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

    // Create timeline event
    await this.prisma.timelineEvent.create({
      data: {
        tripId: data.tripId,
        eventType: 'activity_added',
        description: `${activity.title} was added by the proposer`,
        createdBy: data.proposedBy,
      },
    });

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

  async updateActivity(activityId: string, data: Partial<ActivityCreateInput>) {
    return this.prisma.activity.update({
      where: { id: activityId },
      data,
    });
  }

  async deleteActivity(activityId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { tripId: true },
    });

    if (activity) {
      await this.prisma.timelineEvent.create({
        data: {
          tripId: activity.tripId,
          eventType: 'activity_removed',
          description: 'An activity was removed',
        },
      });
    }

    return this.prisma.activity.delete({
      where: { id: activityId },
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
