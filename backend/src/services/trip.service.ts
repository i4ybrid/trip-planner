import prisma from '@/lib/prisma';
import { TripCreateInput, TripUpdateInput } from '@/types';
import { TripStatus } from '@prisma/client';

// Valid status transitions
const VALID_TRANSITIONS: Record<TripStatus, TripStatus[]> = {
  IDEA: ['PLANNING', 'CANCELLED'],
  PLANNING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['HAPPENING', 'CANCELLED'],
  HAPPENING: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class TripService {
  async createTrip(userId: string, data: TripCreateInput) {
    return prisma.trip.create({
      data: {
        ...data,
        tripMasterId: userId,
        members: {
          create: {
            userId,
            role: 'MASTER',
            status: 'CONFIRMED',
          },
        },
      },
      include: {
        tripMaster: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getTripById(tripId: string) {
    return prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        tripMaster: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            activities: true,
            members: true,
            messages: true,
            mediaItems: true,
          },
        },
      },
    });
  }

  async getUserTrips(userId: string) {
    return prisma.trip.findMany({
      where: {
        members: {
          some: {
            userId,
            status: {
              not: 'DECLINED',
            },
          },
        },
      },
      include: {
        tripMaster: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          where: { userId },
          select: {
            role: true,
            status: true,
          },
        },
        _count: {
          select: {
            activities: true,
            members: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async updateTrip(tripId: string, data: TripUpdateInput) {
    return prisma.trip.update({
      where: { id: tripId },
      data,
      include: {
        tripMaster: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async deleteTrip(tripId: string) {
    return prisma.trip.delete({
      where: { id: tripId },
    });
  }

  async changeTripStatus(tripId: string, newStatus: TripStatus) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { status: true },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const validTransitions = VALID_TRANSITIONS[trip.status];
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${trip.status} to ${newStatus}`);
    }

    // Create timeline event for status change
    await prisma.timelineEvent.create({
      data: {
        tripId,
        eventType: 'status_changed',
        description: `Trip status changed from ${trip.status} to ${newStatus}`,
      },
    });

    return prisma.trip.update({
      where: { id: tripId },
      data: { status: newStatus },
    });
  }

  async getTripTimeline(tripId: string, limit = 50) {
    return prisma.timelineEvent.findMany({
      where: { tripId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getTripMembers(tripId: string) {
    return prisma.tripMember.findMany({
      where: { tripId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            venmo: true,
            paypal: true,
            zelle: true,
            cashapp: true,
          },
        },
      },
    });
  }

  async addTripMember(tripId: string, userId: string, role = 'MEMBER') {
    return prisma.tripMember.create({
      data: {
        tripId,
        userId,
        role: role as any,
        status: 'CONFIRMED',
      },
    });
  }

  async updateTripMember(tripId: string, userId: string, data: { role?: string; status?: string }) {
    return prisma.tripMember.update({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
      data: {
        role: data.role as any,
        status: data.status as any,
      },
    });
  }

  async removeTripMember(tripId: string, userId: string) {
    return prisma.tripMember.delete({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });
  }

  async checkMemberPermission(tripId: string, userId: string, requiredRoles: string[] = []) {
    const member = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!member) {
      return { hasPermission: false, role: null };
    }

    if (member.status !== 'CONFIRMED') {
      return { hasPermission: false, role: member.role };
    }

    if (requiredRoles.length > 0 && !requiredRoles.includes(member.role)) {
      return { hasPermission: false, role: member.role };
    }

    return { hasPermission: true, role: member.role };
  }
}

export const tripService = new TripService();
