import prisma from '@/lib/prisma';
import { ActivityCreateInput } from '@/types';

export class ActivityService {
  async createActivity(data: ActivityCreateInput) {
    const activity = await prisma.activity.create({
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
    await prisma.timelineEvent.create({
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
    return prisma.activity.findUnique({
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
    return prisma.activity.findMany({
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
    return prisma.activity.update({
      where: { id: activityId },
      data,
    });
  }

  async deleteActivity(activityId: string) {
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { tripId: true },
    });

    if (activity) {
      await prisma.timelineEvent.create({
        data: {
          tripId: activity.tripId,
          eventType: 'activity_removed',
          description: 'An activity was removed',
        },
      });
    }

    return prisma.activity.delete({
      where: { id: activityId },
    });
  }

  async getVoteCounts(activityId: string) {
    const votes = await prisma.vote.findMany({
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
