import { getPrisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from '@/services/notification.service';
import { NotificationCategory, NotificationReferenceType } from '@prisma/client';

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
        trip: { select: { id: true, name: true } },
        sentBy: { select: { id: true, name: true } },
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
        trip: { select: { id: true, name: true, description: true, coverImage: true } },
        sentBy: { select: { id: true, name: true } },
      },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: { trip: true },
    });

    if (!invite) { throw new Error('Invite not found'); }
    if (invite.status !== 'PENDING') { throw new Error(`Invite has already been ${invite.status.toLowerCase()}`); }
    if (invite.expiresAt < new Date()) {
      await this.revokeInvite(invite.id);
      throw new Error('Invite has expired');
    }

    const existingMember = await this.prisma.tripMember.findUnique({
      where: { tripId_userId: { tripId: invite.tripId, userId } },
    });
    if (existingMember && existingMember.status === 'CONFIRMED') { throw new Error('You are already a member of this trip'); }

    const newMemberStatus = invite.trip.style === 'OPEN' ? 'CONFIRMED' : 'INVITED';

    await this.prisma.tripMember.upsert({
      where: { tripId_userId: { tripId: invite.tripId, userId } },
      update: { status: newMemberStatus, role: 'MEMBER' },
      create: { tripId: invite.tripId, userId, role: 'MEMBER', status: newMemberStatus },
    });

    await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'ACCEPTED' },
    });

    await this.prisma.timelineEvent.create({
      data: {
        tripId: invite.tripId,
        eventType: 'member_joined',
        description: newMemberStatus === 'CONFIRMED' ? 'A new member joined via invite' : 'A new member request is pending approval',
        createdBy: userId,
      },
    });

    // Notify trip creator/sender about invite accepted
    if (newMemberStatus === 'CONFIRMED') {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
      await notificationService.createNotification({
        userId: invite.sentById,
        category: NotificationCategory.INVITE,
        title: 'Invite Accepted',
        body: `${user?.name || 'Someone'} accepted your invite to "${invite.trip.name}"`,
        referenceId: invite.tripId,
        referenceType: NotificationReferenceType.TRIP,
        link: `/trip/${invite.tripId}`,
      });
    }

    return { ...invite.trip, memberStatus: newMemberStatus };
  }

  async declineInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: { trip: { select: { name: true } } },
    });
    if (!invite) { throw new Error('Invite not found'); }

    const updated = await this.prisma.invite.update({
      where: { id: invite.id },
      data: { status: 'DECLINED' as any },
    });

    // Notify trip creator/sender about invite declined
    await notificationService.createNotification({
      userId: invite.sentById,
      category: NotificationCategory.INVITE,
      title: 'Invite Declined',
      body: `Someone declined the invite to "${invite.trip.name}"`,
      referenceId: invite.tripId,
      referenceType: NotificationReferenceType.TRIP,
      link: `/trip/${invite.tripId}`,
    });

    return updated;
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
      include: { channels: true, sentBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async expireInvites(tripId: string) {
    return this.prisma.invite.updateMany({
      where: { tripId, expiresAt: { lte: new Date() }, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });
  }

  async getPendingInvitesByEmail(email: string) {
    return this.prisma.invite.findMany({
      where: { email: email.toLowerCase(), status: 'PENDING', expiresAt: { gte: new Date() } },
      include: {
        trip: { select: { id: true, name: true, description: true, coverImage: true, style: true } },
        sentBy: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingInvitesByUserId(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return [];
    return this.getPendingInvitesByEmail(user.email);
  }
}

export const inviteService = new InviteService();
