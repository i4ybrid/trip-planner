"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.friendService = exports.FriendService = void 0;
const prisma_1 = __importDefault(require("@/lib/prisma"));
const socket_1 = require("@/lib/socket");
class FriendService {
    async getFriends(userId) {
        const friends = await prisma_1.default.friend.findMany({
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
    async getRelationship(userId, otherUserId) {
        const [friendship, pendingSent, pendingReceived, blockedByMe, blockedByThem] = await Promise.all([
            prisma_1.default.friend.findFirst({
                where: {
                    OR: [
                        { userId, friendId: otherUserId },
                        { userId: otherUserId, friendId: userId },
                    ],
                },
            }),
            prisma_1.default.friendRequest.findFirst({
                where: { senderId: userId, receiverId: otherUserId, status: 'PENDING' },
            }),
            prisma_1.default.friendRequest.findFirst({
                where: { senderId: otherUserId, receiverId: userId, status: 'PENDING' },
            }),
            prisma_1.default.blockedUser.findUnique({
                where: { userId_blockedId: { userId, blockedId: otherUserId } },
            }),
            prisma_1.default.blockedUser.findUnique({
                where: { userId_blockedId: { userId: otherUserId, blockedId: userId } },
            }),
        ]);
        if (friendship)
            return 'friends';
        if (pendingSent)
            return 'request_sent';
        if (pendingReceived)
            return 'request_received';
        if (blockedByMe || blockedByThem)
            return 'blocked';
        return 'none';
    }
    async sendFriendRequest(senderId, receiverId) {
        const existingBlock = await prisma_1.default.blockedUser.findFirst({
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
        const existingFriend = await prisma_1.default.friend.findFirst({
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
        const existingRequest = await prisma_1.default.friendRequest.findFirst({
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
        const receiverSettings = await prisma_1.default.settings.findUnique({
            where: { userId: receiverId },
            select: { friendRequestSource: true },
        });
        if (receiverSettings?.friendRequestSource === 'TRIP_MEMBERS') {
            const sharedTrip = await prisma_1.default.tripMember.findFirst({
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
        const sender = await prisma_1.default.user.findUnique({
            where: { id: senderId },
            select: { name: true, avatarUrl: true },
        });
        const request = await prisma_1.default.friendRequest.create({
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
        await prisma_1.default.notification.create({
            data: {
                userId: receiverId,
                category: 'FRIEND',
                title: 'New Friend Request',
                body: `${sender?.name} sent you a friend request`,
                referenceId: request.id,
                referenceType: 'FRIEND_REQUEST',
                link: '/friends?tab=pending',
            },
        });
        // WebSocket Phase 2: push friend request to connected receiver
        const manager = (0, socket_1.getConnectionManager)();
        const receiverSocket = manager.get(receiverId);
        if (receiverSocket) {
            receiverSocket.to(`user:${receiverId}`).emit('friend:request', request);
        }
        return request;
    }
    async getFriendRequests(userId) {
        const [sent, received] = await Promise.all([
            prisma_1.default.friendRequest.findMany({
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
            prisma_1.default.friendRequest.findMany({
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
    async acceptFriendRequest(requestId) {
        const request = await prisma_1.default.friendRequest.findUnique({
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
        await prisma_1.default.$transaction([
            prisma_1.default.friend.create({
                data: {
                    userId: request.senderId,
                    friendId: request.receiverId,
                },
            }),
            prisma_1.default.friend.create({
                data: {
                    userId: request.receiverId,
                    friendId: request.senderId,
                },
            }),
            prisma_1.default.friendRequest.update({
                where: { id: requestId },
                data: {
                    status: 'ACCEPTED',
                    respondedAt: new Date(),
                },
            }),
            prisma_1.default.notification.create({
                data: {
                    userId: request.senderId,
                    category: 'FRIEND',
                    title: 'Friend Request Accepted',
                    body: `${request.receiver.name} accepted your friend request`,
                    referenceId: requestId,
                    referenceType: 'FRIEND_REQUEST',
                    link: '/friends',
                },
            }),
        ]);
        // WebSocket Phase 2: push friend accepted to connected sender
        const manager = (0, socket_1.getConnectionManager)();
        const senderSocket = manager.get(request.senderId);
        if (senderSocket) {
            senderSocket.to(`user:${request.senderId}`).emit('friend:accepted', { requestId, friend: request.receiver });
        }
        return prisma_1.default.friendRequest.findUnique({
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
    async declineFriendRequest(requestId) {
        const request = await prisma_1.default.friendRequest.findUnique({
            where: { id: requestId },
            include: {
                sender: true,
                receiver: true,
            },
        });
        if (!request) {
            throw new Error('Friend request not found');
        }
        const updated = await prisma_1.default.friendRequest.update({
            where: { id: requestId },
            data: {
                status: 'DECLINED',
                respondedAt: new Date(),
            },
        });
        await prisma_1.default.notification.create({
            data: {
                userId: request.senderId,
                category: 'FRIEND',
                title: 'Friend Request Declined',
                body: `${request.receiver.name} declined your friend request`,
                referenceId: requestId,
                referenceType: 'FRIEND_REQUEST',
            },
        });
        // WebSocket Phase 2: push friend declined to connected sender
        const manager = (0, socket_1.getConnectionManager)();
        const senderSocket = manager.get(request.senderId);
        if (senderSocket) {
            senderSocket.to(`user:${request.senderId}`).emit('friend:declined', { requestId });
        }
        return updated;
    }
    async cancelFriendRequest(requestId) {
        return prisma_1.default.friendRequest.delete({
            where: { id: requestId },
        });
    }
    async removeFriend(userId, friendId) {
        await prisma_1.default.friend.deleteMany({
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
exports.FriendService = FriendService;
exports.friendService = new FriendService();
//# sourceMappingURL=friend.service.js.map