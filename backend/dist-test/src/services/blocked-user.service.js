"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockedUserService = exports.BlockedUserService = void 0;
const prisma_1 = __importDefault(require("@/lib/prisma"));
class BlockedUserService {
    async getBlockedUsers(userId) {
        return prisma_1.default.blockedUser.findMany({
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
    async blockUser(userId, blockedId) {
        if (userId === blockedId) {
            throw new Error('Cannot block yourself');
        }
        const existing = await prisma_1.default.blockedUser.findUnique({
            where: {
                userId_blockedId: { userId, blockedId },
            },
        });
        if (existing) {
            throw new Error('User is already blocked');
        }
        const block = await prisma_1.default.blockedUser.create({
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
    async unblockUser(userId, blockedId) {
        const existing = await prisma_1.default.blockedUser.findUnique({
            where: {
                userId_blockedId: { userId, blockedId },
            },
        });
        if (!existing) {
            throw new Error('User is not blocked');
        }
        return prisma_1.default.blockedUser.delete({
            where: { id: existing.id },
        });
    }
    async isBlocked(userId, blockedId) {
        const block = await prisma_1.default.blockedUser.findUnique({
            where: {
                userId_blockedId: { userId, blockedId },
            },
        });
        return !!block;
    }
    async isBlockedEitherDirection(userId1, userId2) {
        const block = await prisma_1.default.blockedUser.findFirst({
            where: {
                OR: [
                    { userId: userId1, blockedId: userId2 },
                    { userId: userId2, blockedId: userId1 },
                ],
            },
        });
        return !!block;
    }
    async cleanupOnBlock(userId, blockedId) {
        await prisma_1.default.$transaction([
            prisma_1.default.friend.deleteMany({
                where: {
                    OR: [
                        { userId, friendId: blockedId },
                        { userId: blockedId, friendId: userId },
                    ],
                },
            }),
            prisma_1.default.friendRequest.deleteMany({
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
exports.BlockedUserService = BlockedUserService;
exports.blockedUserService = new BlockedUserService();
//# sourceMappingURL=blocked-user.service.js.map