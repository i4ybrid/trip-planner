import prisma from '@/lib/prisma';

export class BlockedUserService {
  async getBlockedUsers(userId: string) {
    return prisma.blockedUser.findMany({
      where: { userId },
      include: {
        blocked: {
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

  async blockUser(userId: string, blockedId: string) {
    if (userId === blockedId) {
      throw new Error('Cannot block yourself');
    }

    const existing = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: { userId, blockedId },
      },
    });

    if (existing) {
      throw new Error('User is already blocked');
    }

    const block = await prisma.blockedUser.create({
      data: {
        userId,
        blockedId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    await this.cleanupOnBlock(userId, blockedId);

    return block;
  }

  async unblockUser(userId: string, blockedId: string) {
    const existing = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: { userId, blockedId },
      },
    });

    if (!existing) {
      throw new Error('User is not blocked');
    }

    return prisma.blockedUser.delete({
      where: { id: existing.id },
    });
  }

  async isBlocked(userId: string, blockedId: string): Promise<boolean> {
    const block = await prisma.blockedUser.findUnique({
      where: {
        userId_blockedId: { userId, blockedId },
      },
    });
    return !!block;
  }

  async isBlockedEitherDirection(userId1: string, userId2: string): Promise<boolean> {
    const block = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: userId1, blockedId: userId2 },
          { userId: userId2, blockedId: userId1 },
        ],
      },
    });
    return !!block;
  }

  private async cleanupOnBlock(userId: string, blockedId: string) {
    await prisma.$transaction([
      prisma.friend.deleteMany({
        where: {
          OR: [
            { userId, friendId: blockedId },
            { userId: blockedId, friendId: userId },
          ],
        },
      }),
      prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: blockedId },
            { senderId: blockedId, receiverId: userId },
          ],
        },
      }),
    ]);
  }
}

export const blockedUserService = new BlockedUserService();
