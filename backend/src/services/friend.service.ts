import prisma from '@/lib/prisma';

export class FriendService {
  async getFriends(userId: string) {
    const friends = await prisma.friend.findMany({
      where: { userId },
      include: {
        friend: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return friends;
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    // Check if already friends
    const existingFriend = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId },
        ],
      },
    });

    if (existingFriend) {
      throw new Error('Already friends with this user');
    }

    // Check if request already exists
    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

    // Check user settings for friend request permissions
    const receiverSettings = await prisma.settings.findUnique({
      where: { userId: receiverId },
      select: { friendRequestSource: true },
    });

    if (receiverSettings?.friendRequestSource === 'TRIP_MEMBERS') {
      // Check if they share a trip
      const sharedTrip = await prisma.tripMember.findFirst({
        where: {
          userId: senderId,
          trip: {
            members: {
              some: {
                userId: receiverId,
              },
            },
          },
        },
      });

      if (!sharedTrip) {
        throw new Error('This user only accepts friend requests from trip members');
      }
    }

    return prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getFriendRequests(userId: string) {
    const [sent, received] = await Promise.all([
      prisma.friendRequest.findMany({
        where: { senderId: userId, status: 'PENDING' },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.friendRequest.findMany({
        where: { receiverId: userId, status: 'PENDING' },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return { sent, received };
  }

  async acceptFriendRequest(requestId: string) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Friend request has already been responded to');
    }

    // Create friendship (bidirectional)
    await prisma.friend.create({
      data: {
        userId: request.senderId,
        friendId: request.receiverId,
      },
    });

    await prisma.friend.create({
      data: {
        userId: request.receiverId,
        friendId: request.senderId,
      },
    });

    // Update request status
    return prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });
  }

  async declineFriendRequest(requestId: string) {
    return prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    });
  }

  async cancelFriendRequest(requestId: string) {
    return prisma.friendRequest.delete({
      where: { id: requestId },
    });
  }

  async removeFriend(userId: string, friendId: string) {
    await prisma.friend.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    return { success: true };
  }
}

export const friendService = new FriendService();
