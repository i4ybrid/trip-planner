import { PrismaClient, User } from '@prisma/client';

export type { User };

export interface CreateUserInput {
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  phone?: string;
  venmo?: string;
  paypal?: string;
  zelle?: string;
}

export class UserService {
  constructor(private prisma: PrismaClient) {}

  async createUser(data: CreateUserInput): Promise<User> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
        phone: data.phone,
      },
    });
  }

  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getUsersByIds(userIds: string[]): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { id: { in: userIds } },
    });
  }

  async updateUser(userId: string, data: UpdateUserInput): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
    });
  }

  async getFriends(userId: string): Promise<User[]> {
    const memberships = await this.prisma.tripMember.findMany({
      where: {
        userId,
        status: 'CONFIRMED',
      },
      include: {
        trip: {
          include: {
            members: {
              where: {
                status: 'CONFIRMED',
                userId: { not: userId },
              },
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    const friendIds = new Set<string>();
    memberships.forEach((m) => {
      m.trip.members.forEach((tm) => {
        friendIds.add(tm.userId);
      });
    });

    return this.prisma.user.findMany({
      where: { id: { in: Array.from(friendIds) } },
    });
  }
}
