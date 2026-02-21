import { PrismaClient, Invite } from '@prisma/client';

export type { Invite };

export interface CreateInviteInput {
  tripId: string;
  email?: string;
  phone?: string;
  sentById: string;
  expiresInHours?: number;
}

export interface InviteChannelInput {
  channel: 'email' | 'sms';
  externalId?: string;
}

export class InviteService {
  constructor(private prisma: PrismaClient) {}

  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  async createInvite(input: CreateInviteInput): Promise<Invite> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + (input.expiresInHours || 72));

    return this.prisma.invite.create({
      data: {
        tripId: input.tripId,
        token: this.generateToken(),
        email: input.email,
        phone: input.phone,
        sentById: input.sentById,
        expiresAt,
      },
    });
  }

  async getInviteByToken(token: string): Promise<Invite | null> {
    return this.prisma.invite.findUnique({
      where: { token },
      include: {
        trip: true,
        sentBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getTripInvites(tripId: string): Promise<Invite[]> {
    return this.prisma.invite.findMany({
      where: { tripId },
      include: {
        sentBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(token: string, userId: string): Promise<void> {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new Error('Invite not found');
    }

    if (invite.status !== 'PENDING') {
      throw new Error('Invite already processed');
    }

    if (new Date() > invite.expiresAt) {
      throw new Error('Invite has expired');
    }

    await this.prisma.$transaction([
      this.prisma.invite.update({
        where: { token },
        data: { status: 'ACCEPTED' },
      }),
      this.prisma.tripMember.create({
        data: {
          tripId: invite.tripId,
          userId,
          role: 'MEMBER',
          status: 'CONFIRMED',
        },
      }),
    ]);
  }

  async declineInvite(token: string): Promise<void> {
    await this.prisma.invite.update({
      where: { token },
      data: { status: 'DECLINED' as const },
    });
  }

  async revokeInvite(inviteId: string): Promise<void> {
    await this.prisma.invite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' as const },
    });
  }

  async addInviteChannel(inviteId: string, channel: InviteChannelInput): Promise<void> {
    await this.prisma.inviteChannel.create({
      data: {
        inviteId,
        channel: channel.channel,
        externalId: channel.externalId,
      },
    });
  }

  async isInviteValid(token: string): Promise<boolean> {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) return false;
    if (invite.status !== 'PENDING') return false;
    if (new Date() > invite.expiresAt) return false;

    return true;
  }
}
