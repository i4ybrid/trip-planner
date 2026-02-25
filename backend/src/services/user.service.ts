import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

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
}

export const userService = new UserService();
