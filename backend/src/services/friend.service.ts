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

  async getRelationship(userId: string, otherUserId: string): Promise<string> {
    const [friendship, pendingSent, pendingReceived, blockedByMe, blockedByThem] = await Promise.all([
      prisma.friend.findFirst({
        where: {
          OR: [
            { userId, friendId: otherUserId },
            { userId: otherUserId, friendId: userId },
          ],
        },
      }),
      prisma.friendRequest.findFirst({
        where: { senderId: userId, receiverId: otherUserId, status: 'PENDING' },
      }),
      prisma.friendRequest.findFirst({
        where: { senderId: otherUserId, receiverId: userId, status: 'PENDING' },
      }),
      prisma.blockedUser.findUnique({
        where: { userId_blockedId: { userId, blockedId: otherUserId } },
      }),
      prisma.blockedUser.findUnique({
        where: { userId_blockedId: { userId: otherUserId, blockedId: userId } },
      }),
    ]);

    if (friendship) return 'friends';
    if (pendingSent) return 'request_sent';
    if (pendingReceived) return 'request_received';
    if (blockedByMe || blockedByThem) return 'blocked';
    return 'none';
  }

  async sendFriendRequest(senderId: string, receiverId: string) {
    const existingBlock = await prisma.blockedUser.findFirst({
      where: {
        OR: [
          { userId: senderId, blockedId: receiverId },
          { userId: receiverId, blockedId: senderId },
        ],
      },
    });

    if (existingBlock) {
      throw new Error('Unable to send friend request');
    }

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

    const receiverSettings = await prisma.settings.findUnique({
      where: { userId: receiverId },
      select: { friendRequestSource: true },
    });

    if (receiverSettings?.friendRequestSource === 'TRIP_MEMBERS') {
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

    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, avatarUrl: true },
    });

    const request = await prisma.friendRequest.create({
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

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'FRIEND_REQUEST',
        title: 'New Friend Request',
        body: `${sender?.name} sent you a friend request`,
        actionType: 'friend_request',
        actionId: request.id,
        actionUrl: '/friends?tab=pending',
        read: false,
        priority: 'normal',
      },
    });

    return request;
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
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Friend request has already been responded to');
    }

    await prisma.$transaction([
      prisma.friend.create({
        data: {
          userId: request.senderId,
          friendId: request.receiverId,
        },
      }),
      prisma.friend.create({
        data: {
          userId: request.receiverId,
          friendId: request.senderId,
        },
      }),
      prisma.friendRequest.update({
        where: { id: requestId },
        data: {
          status: 'ACCEPTED',
          respondedAt: new Date(),
        },
      }),
      prisma.notification.create({
        data: {
          userId: request.senderId,
          type: 'FRIEND_REQUEST',
          title: 'Friend Request Accepted',
          body: `${request.receiver.name} accepted your friend request`,
          actionType: 'friend_accepted',
          actionId: requestId,
          actionUrl: '/friends',
          read: false,
          priority: 'normal',
        },
      }),
    ]);

    return prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true },
        },
        receiver: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async declineFriendRequest(requestId: string) {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!request) {
      throw new Error('Friend request not found');
    }

    const updated = await prisma.friendRequest.update({
      where: { id: requestId },
      data: {
        status: 'DECLINED',
        respondedAt: new Date(),
      },
    });

    await prisma.notification.create({
      data: {
        userId: request.senderId,
        type: 'FRIEND_REQUEST',
        title: 'Friend Request Declined',
        body: `${request.receiver.name} declined your friend request`,
        actionType: 'friend_declined',
        actionId: requestId,
        read: false,
        priority: 'low',
      },
    });

    return updated;
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
