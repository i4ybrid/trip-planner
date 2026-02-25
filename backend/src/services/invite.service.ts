import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export class InviteService {
  async createInvite(data: {
    tripId: string;
    email?: string;
    phone?: string;
    expiresAt: Date;
    sentById: string;
    channels?: string[];
  }) {
    const token = uuidv4();

    const invite = await prisma.invite.create({
      data: {
        tripId: data.tripId,
        token,
        email: data.email,
        phone: data.phone,
        expiresAt: data.expiresAt,
        sentById: data.sentById,
        channels: {
          create: data.channels?.map((channel) => ({ channel })) || [],
        },
      },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      ...invite,
      inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`,
    };
  }

  async getInviteByToken(token: string) {
    return prisma.invite.findUnique({
      where: { token },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { trip: true },
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new Error(`Invite has already been ${invite.status.toLowerCase()}`);
    }

    if (invite.expiresAt < new Date()) {
      await this.revokeInvite(invite.id);
      throw new Error('Invite has expired');
    }

    // Add user to trip
    await prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: invite.tripId,
          userId,
        },
      },
      update: {
        status: 'CONFIRMED',
        role: 'MEMBER',
      },
      create: {
        tripId: invite.tripId,
        userId,
        role: 'MEMBER',
        status: 'CONFIRMED',
      },
    });

    // Update invite status
    await prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        tripId: invite.tripId,
        eventType: 'member_joined',
        description: 'A new member joined via invite',
        createdBy: userId,
      },
    });

    return invite.trip;
  }

  async declineInvite(token: string) {
    const invite = await prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    return prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'DECLINED' as any },
    });
  }

  async revokeInvite(inviteId: string) {
    return prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });
  }

  async getTripInvites(tripId: string) {
    return prisma.invite.findMany({
      where: { tripId },
      include: {
        channels: true,
        sentBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async expireInvites(tripId: string) {
    return prisma.invite.updateMany({
      where: {
        tripId,
        expiresAt: {
          lte: new Date(),
        },
        status: 'PENDING',
      },
      data: {
        status: 'EXPIRED',
      },
    });
  }
}

export const inviteService = new InviteService();
