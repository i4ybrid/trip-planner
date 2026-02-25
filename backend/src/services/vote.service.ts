import prisma from '@/lib/prisma';

export class VoteService {
  async castVote(activityId: string, userId: string, option: 'YES' | 'NO' | 'MAYBE') {
    // Check if vote already exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId,
        },
      },
    });

    if (existingVote) {
      return prisma.vote.update({
        where: {
          activityId_userId: {
            activityId,
            userId,
          },
        },
        data: { option },
      });
    }

    const vote = await prisma.vote.create({
      data: {
        activityId,
        userId,
        option,
      },
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

    // Get activity info for timeline
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { title: true, tripId: true },
    });

    if (activity) {
      await prisma.timelineEvent.create({
        data: {
          tripId: activity.tripId,
          eventType: 'vote_cast',
          description: `A vote was cast on "${activity.title}"`,
        },
      });
    }

    return vote;
  }

  async removeVote(activityId: string, userId: string) {
    return prisma.vote.delete({
      where: {
        activityId_userId: {
          activityId,
          userId,
        },
      },
    });
  }

  async getVotes(activityId: string) {
    return prisma.vote.findMany({
      where: { activityId },
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
  }

  async getUserVote(activityId: string, userId: string) {
    return prisma.vote.findUnique({
      where: {
        activityId_userId: {
          activityId,
          userId,
        },
      },
    });
  }
}

export const voteService = new VoteService();
