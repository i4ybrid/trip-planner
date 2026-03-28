import { getPrisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export class InviteService {
  private prisma = getPrisma();
  async createInvite(data: {
    tripId: string;
    email?: string;
    phone?: string;
    expiresAt: Date;
    sentById: string;
    channels?: string[];
  }) {
    const token = uuidv4();

    const invite = await this.prisma.invite.create({
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
    return this.prisma.invite.findUnique({
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
    const invite = await this.prisma.invite.findUnique({
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

    // Check if user is already a member
    const existingMember = await this.prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId: invite.tripId,
          userId,
        },
      },
    });

    if (existingMember && existingMember.status === 'CONFIRMED') {
      throw new Error('You are already a member of this trip');
    }

    // Determine status based on trip style:
    // OPEN trips auto-confirm members, MANAGED trips require approval
    const newMemberStatus = invite.trip.style === 'OPEN' ? 'CONFIRMED' : 'INVITED';

    // Add user to trip
    await this.prisma.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId: invite.tripId,
          userId,
        },
      },
      update: {
        status: newMemberStatus,
        role: 'MEMBER',
      },
      create: {
        tripId: invite.tripId,
        userId,
        role: 'MEMBER',
        status: newMemberStatus,
      },
    });

    // Update invite status
    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    // Create timeline event
    await this.prisma.timelineEvent.create({
      data: {
        tripId: invite.tripId,
        eventType: 'member_joined',
        description: newMemberStatus === 'CONFIRMED'
          ? 'A new member joined via invite'
          : 'A new member request is pending approval',
        createdBy: userId,
      },
    });

    return {
      ...invite.trip,
      memberStatus: newMemberStatus,
    };
  }

  async declineInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    return this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'DECLINED' as any },
    });
  }

  async revokeInvite(inviteId: string) {
    return this.prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });
  }

  async getTripInvites(tripId: string) {
    return this.prisma.invite.findMany({
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
    return this.prisma.invite.updateMany({
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

  async getPendingInvitesByEmail(email: string) {
    return this.prisma.invite.findMany({
      where: {
        email: email.toLowerCase(),
        status: 'PENDING',
        expiresAt: {
          gte: new Date(),
        },
      },
      include: {
        trip: {
          select: {
            id: true,
            name: true,
            description: true,
            coverImage: true,
            style: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingInvitesByUserId(userId: string) {
    // Get user email to find invites sent to their email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user) {
      return [];
    }

    return this.getPendingInvitesByEmail(user.email);
  }
}

export const inviteService = new InviteService();
