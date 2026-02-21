import { PrismaClient, Activity, Vote } from '@prisma/client';

export type { Activity, Vote };

export type ActivityCategory = 
  | 'restaurant'
  | 'hotel'
  | 'attraction'
  | 'transport'
  | 'activity'
  | 'other';

export type ActivityStatus = 'OPEN' | 'CLOSED' | 'BOOKED';

export interface CreateActivityInput {
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  cost?: number;
  currency?: string;
  category: ActivityCategory;
  proposedBy: string;
  votingEndsAt?: Date;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  cost?: number;
  currency?: string;
  votingEndsAt?: Date;
}

export class ActivityService {
  constructor(private prisma: PrismaClient) {}

  async createActivity(data: CreateActivityInput): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        tripId: data.tripId,
        title: data.title,
        description: data.description,
        location: data.location,
        startTime: data.startTime,
        endTime: data.endTime,
        cost: data.cost ? Number(data.cost) : null,
        currency: data.currency || 'USD',
        category: data.category,
        proposedBy: data.proposedBy,
        votingEndsAt: data.votingEndsAt,
        status: 'OPEN',
      },
    });
  }

  async getActivityById(activityId: string): Promise<Activity | null> {
    return this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        votes: true,
        proposer: true,
      },
    });
  }

  async getTripActivities(tripId: string): Promise<Activity[]> {
    return this.prisma.activity.findMany({
      where: { tripId },
      include: {
        votes: true,
        proposer: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateActivity(activityId: string, data: UpdateActivityInput): Promise<Activity> {
    const updateData: any = { ...data };
    if (data.cost !== undefined) {
      updateData.cost = data.cost ? Number(data.cost) : null;
    }
    
    return this.prisma.activity.update({
      where: { id: activityId },
      data: updateData,
    });
  }

  async setVotingDeadline(activityId: string, votingEndsAt: Date): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { votingEndsAt },
    });
  }

  async closeVoting(activityId: string): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { status: 'CLOSED' },
    });
  }

  async markAsBooked(activityId: string): Promise<Activity> {
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { status: 'BOOKED' },
    });
  }

  async isVotingOpen(activityId: string): Promise<boolean> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.status !== 'OPEN') {
      return false;
    }

    if (activity.votingEndsAt && new Date() > activity.votingEndsAt) {
      return false;
    }

    return true;
  }

  async processVotingDeadline(activityId: string): Promise<{ winner: string | null; wasProcessed: boolean }> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity || activity.status !== 'OPEN') {
      return { winner: null, wasProcessed: false };
    }

    if (activity.votingEndsAt && new Date() > activity.votingEndsAt) {
      const winner = await this.getWinningOption(activityId);
      await this.closeVoting(activityId);
      return { winner, wasProcessed: true };
    }

    return { winner: null, wasProcessed: false };
  }

  async getExpiredActivities(): Promise<Activity[]> {
    return this.prisma.activity.findMany({
      where: {
        status: 'OPEN',
        votingEndsAt: {
          lt: new Date(),
        },
      },
    });
  }

  async processAllDeadlines(): Promise<number> {
    const expiredActivities = await this.getExpiredActivities();
    
    for (const activity of expiredActivities) {
      await this.processVotingDeadline(activity.id);
    }

    return expiredActivities.length;
  }

  async deleteActivity(activityId: string): Promise<void> {
    await this.prisma.activity.delete({
      where: { id: activityId },
    });
  }

  async vote(activityId: string, userId: string, option: string): Promise<Vote> {
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        activityId_userId: { activityId, userId },
      },
    });

    if (existingVote) {
      return this.prisma.vote.update({
        where: { id: existingVote.id },
        data: { option },
      });
    }

    return this.prisma.vote.create({
      data: {
        activityId,
        userId,
        option,
      },
    });
  }

  async removeVote(activityId: string, userId: string): Promise<void> {
    await this.prisma.vote.delete({
      where: {
        activityId_userId: { activityId, userId },
      },
    });
  }

  async getVoteCounts(activityId: string): Promise<Record<string, number>> {
    const votes = await this.prisma.vote.findMany({
      where: { activityId },
    });

    const counts: Record<string, number> = {};
    votes.forEach((vote) => {
      counts[vote.option] = (counts[vote.option] || 0) + 1;
    });

    return counts;
  }

  async getWinningOption(activityId: string): Promise<string | null> {
    const counts = await this.getVoteCounts(activityId);
    
    if (Object.keys(counts).length === 0) {
      return null;
    }

    return Object.entries(counts).reduce((a, b) => 
      b[1] > a[1] ? b : a
    )[0];
  }

  async getUserVote(activityId: string, userId: string): Promise<Vote | null> {
    return this.prisma.vote.findUnique({
      where: {
        activityId_userId: { activityId, userId },
      },
    });
  }

  async hasVoted(activityId: string, userId: string): Promise<boolean> {
    const vote = await this.getUserVote(activityId, userId);
    return vote !== null;
  }

  async createBookingFromWinner(activityId: string, bookedByUserId: string, confirmationNum?: string): Promise<any> {
    const activity = await this.getActivityById(activityId);
    
    if (!activity) {
      throw new Error('Activity not found');
    }

    if (activity.status === 'BOOKED') {
      throw new Error('Activity is already booked');
    }

    const winner = await this.getWinningOption(activityId);
    if (!winner || winner !== 'yes') {
      throw new Error('Cannot book activity that did not win');
    }

    const booking = await this.prisma.booking.create({
      data: {
        tripId: activity.tripId,
        activityId: activity.id,
        bookedBy: bookedByUserId,
        confirmationNum,
        status: 'CONFIRMED',
        notes: `${activity.title}: $${activity.cost || 0}`,
      },
    });

    await this.markAsBooked(activityId);

    return booking;
  }
}
