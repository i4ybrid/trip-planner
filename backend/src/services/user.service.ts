import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export class UserService {
  async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        phone: true,
        venmo: true,
        paypal: true,
        zelle: true,
        cashapp: true,
        createdAt: true,
        settings: true,
      },
    });
  }

  async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(data: {
    email: string;
    name: string;
    password?: string;
    avatarUrl?: string;
    phone?: string;
  }) {
    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        avatarUrl: data.avatarUrl,
        phone: data.phone,
        settings: {
          create: {},
        },
      },
      include: {
        settings: true,
      },
    });
  }

  async createOAuthUser(data: {
    email: string;
    name: string;
    avatarUrl?: string;
    provider: string;
    providerId?: string;
  }) {
    return prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        settings: {
          create: {},
        },
      },
      include: {
        settings: true,
      },
    });
  }

  async updateUser(userId: string, data: {
    name?: string;
    avatarUrl?: string;
    phone?: string;
    venmo?: string;
    paypal?: string;
    zelle?: string;
    cashapp?: string;
  }) {
    return prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      throw new Error('User does not have a password');
    }

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async verifyPassword(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user?.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    };
  }

  async getSettings(userId: string) {
    return prisma.settings.findUnique({
      where: { userId },
    });
  }

  async updateSettings(userId: string, data: {
    friendRequestSource?: 'ANYONE' | 'TRIP_MEMBERS';
    emailTripInvites?: boolean;
    emailPaymentRequests?: boolean;
    emailVotingReminders?: boolean;
    emailTripReminders?: boolean;
    emailMessages?: boolean;
    pushTripInvites?: boolean;
    pushPaymentRequests?: boolean;
    pushVotingReminders?: boolean;
    pushTripReminders?: boolean;
    pushMessages?: boolean;
    inAppAll?: boolean;
  }) {
    return prisma.settings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async generatePasswordResetToken(email: string): Promise<{ token: string; userId: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Return dummy success to prevent email enumeration
      return { token: 'dummy', userId: 'dummy' };
    }

    const token = crypto.randomUUID();
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: { email, tokenHash, expiresAt, userId: user.id },
    });

    return { token, userId: user.id };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const tokens = await prisma.passwordResetToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'desc' },
    });

    for (const record of tokens) {
      const valid = await bcrypt.compare(token, record.tokenHash);
      if (valid) {
        await prisma.user.update({
          where: { id: record.userId },
          data: { passwordHash: await bcrypt.hash(newPassword, 10) },
        });
        await prisma.passwordResetToken.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        });
        return true;
      }
    }
    return false;
  }
}

export const userService = new UserService();
