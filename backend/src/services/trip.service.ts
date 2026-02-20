import { PrismaClient, Trip, TripMember, User } from '@prisma/client';

export type { PrismaClient, Trip, TripMember, User };

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  IDEA: ['PLANNING', 'CANCELLED'],
  PLANNING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

export class TripService {
  constructor(private prisma: PrismaClient) {}

  async createTrip(
    userId: string,
    data: {
      name: string;
      description?: string;
      destination?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Trip> {
    const trip = await this.prisma.trip.create({
      data: {
        name: data.name,
        description: data.description,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        tripMasterId: userId,
        status: 'IDEA',
      },
    });

    await this.prisma.tripMember.create({
      data: {
        tripId: trip.id,
        userId: userId,
        role: 'MASTER',
        status: 'CONFIRMED',
      },
    });

    return trip;
  }

  async getUserTrips(userId: string): Promise<(TripMember & { trip: Trip })[]> {
    return this.prisma.tripMember.findMany({
      where: { userId },
      include: { trip: true },
    });
  }

  async getTripById(tripId: string): Promise<Trip | null> {
    return this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        members: {
          include: { user: true },
        },
        activities: true,
      },
    });
  }

  async changeStatus(tripId: string, newStatus: string): Promise<Trip> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    const allowedTransitions = VALID_STATUS_TRANSITIONS[trip.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${trip.status} to ${newStatus}`
      );
    }

    return this.prisma.trip.update({
      where: { id: tripId },
      data: { status: newStatus as any },
    });
  }

  async addMember(
    tripId: string,
    userId: string,
    role: 'MASTER' | 'ORGANIZER' | 'MEMBER' | 'VIEWER' = 'MEMBER'
  ): Promise<TripMember> {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new Error('Cannot add members to a completed trip');
    }

    return this.prisma.tripMember.create({
      data: {
        tripId,
        userId,
        role,
        status: 'INVITED',
      },
    });
  }

  async removeMember(tripId: string, userId: string): Promise<void> {
    await this.prisma.tripMember.delete({
      where: {
        tripId_userId: { tripId, userId },
      },
    });
  }

  async updateTrip(
    tripId: string,
    data: Partial<Pick<Trip, 'name' | 'description' | 'destination' | 'startDate' | 'endDate' | 'coverImage'>>
  ): Promise<Trip> {
    return this.prisma.trip.update({
      where: { id: tripId },
      data,
    });
  }

  async deleteTrip(tripId: string): Promise<void> {
    await this.prisma.trip.delete({
      where: { id: tripId },
    });
  }
}
