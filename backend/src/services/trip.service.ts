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

  async addTripMemberByInvite(tripId: string, userId: string, role = 'MEMBER') {
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
    const member = await prisma.tripMember.update({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
      data: {
        status: 'REMOVED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await prisma.timelineEvent.create({
      data: {
        tripId,
        eventType: 'member_removed',
        description: `${member.user.name} was removed from the trip`,
      },
    });

    return member;
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

  async canInvite(tripId: string, userId: string): Promise<{ canInvite: boolean; reason?: string }> {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { style: true },
    });

    if (!trip) {
      return { canInvite: false, reason: 'Trip not found' };
    }

    const member = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (!member || member.status !== 'CONFIRMED') {
      return { canInvite: false, reason: 'You are not a member of this trip' };
    }

    if (member.role === 'MASTER') {
      return { canInvite: true };
    }

    if (trip.style === 'OPEN' && (member.role === 'ORGANIZER' || member.role === 'MEMBER')) {
      return { canInvite: true };
    }

    if (trip.style === 'MANAGED') {
      return { canInvite: false, reason: 'Only organizers can invite members to this trip' };
    }

    return { canInvite: false, reason: 'You do not have permission to invite members' };
  }

  async canManageMember(requesterId: string, targetId: string, tripId: string): Promise<{ canManage: boolean; reason?: string }> {
    const requester = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: requesterId,
        },
      },
    });

    const target = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: targetId,
        },
      },
    });

    if (!requester || requester.status !== 'CONFIRMED') {
      return { canManage: false, reason: 'You are not a member of this trip' };
    }

    if (!target || target.status === 'REMOVED') {
      return { canManage: false, reason: 'Target member not found' };
    }

    if (requester.role === 'MASTER') {
      return { canManage: true };
    }

    if (requester.role === 'ORGANIZER') {
      if (target.role === 'MASTER' || target.role === 'ORGANIZER') {
        return { canManage: false, reason: 'Organizers cannot manage other organizers or the master' };
      }
      return { canManage: true };
    }

    return { canManage: false, reason: 'You do not have permission to manage members' };
  }

  async canPromoteToOrganizer(requesterId: string, tripId: string): Promise<{ canPromote: boolean; reason?: string }> {
    const requester = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: requesterId,
        },
      },
    });

    if (!requester || requester.status !== 'CONFIRMED') {
      return { canPromote: false, reason: 'You are not a member of this trip' };
    }

    if (requester.role !== 'MASTER') {
      return { canPromote: false, reason: 'Only the trip master can promote members to organizers' };
    }

    return { canPromote: true };
  }

  async addTripMember(tripId: string, userId: string, invitedById: string, role = 'MEMBER') {
    const existingMember = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
    });

    if (existingMember && existingMember.status !== 'REMOVED') {
      throw new Error('User is already a member of this trip');
    }

    // Check trip style to determine initial status
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { style: true },
    });

    // OPEN trips auto-confirm members, MANAGED trips require approval
    const memberStatus = trip?.style === 'OPEN' ? 'CONFIRMED' : 'INVITED';

    const member = await prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId,
          userId,
        },
      },
      update: {
        role: role as any,
        status: memberStatus,
        invitedById,
      },
      create: {
        tripId,
        userId,
        role: role as any,
        status: memberStatus,
        invitedById,
      },
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
    });

    await prisma.timelineEvent.create({
      data: {
        tripId,
        eventType: 'member_joined',
        description: memberStatus === 'CONFIRMED' 
          ? `${member.user.name} joined the trip`
          : `${member.user.name} requested to join the trip`,
        createdBy: userId,
      },
    });

    return member;
  }
}

export const tripService = new TripService();
