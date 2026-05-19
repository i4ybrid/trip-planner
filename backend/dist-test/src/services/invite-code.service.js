"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteCodeService = exports.InviteCodeService = void 0;
const prisma_1 = __importDefault(require("@/lib/prisma"));
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
class InviteCodeService {
    async getInviteCodes(userId) {
        return prisma_1.default.inviteCode.findMany({
            where: {
                createdBy: userId,
                usedAt: null,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async generateInviteCode(userId, daysUntilExpiry = 7) {
        let code;
        let attempts = 0;
        const maxAttempts = 10;
        do {
            code = generateCode();
            const existing = await prisma_1.default.inviteCode.findUnique({
                where: { code },
            });
            if (!existing)
                break;
            attempts++;
        } while (attempts < maxAttempts);
        if (attempts >= maxAttempts) {
            throw new Error('Failed to generate unique code');
        }
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysUntilExpiry);
        return prisma_1.default.inviteCode.create({
            data: {
                code,
                createdBy: userId,
                expiresAt,
            },
        });
    }
    async useInviteCode(code, userId) {
        const inviteCode = await prisma_1.default.inviteCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!inviteCode) {
            throw new Error('Invalid invite code');
        }
        if (inviteCode.usedAt) {
            throw new Error('This invite code has already been used');
        }
        if (inviteCode.usedBy) {
            throw new Error('This invite code has already been used');
        }
        if (new Date() > inviteCode.expiresAt) {
            throw new Error('This invite code has expired');
        }
        if (inviteCode.createdBy === userId) {
            throw new Error('You cannot use your own invite code');
        }
        const result = await prisma_1.default.$transaction(async (tx) => {
            await tx.inviteCode.update({
                where: { id: inviteCode.id },
                data: {
                    usedAt: new Date(),
                    usedBy: userId,
                },
            });
            const existingFriendship = await tx.friend.findFirst({
                where: {
                    OR: [
                        { userId: inviteCode.createdBy, friendId: userId },
                        { userId: userId, friendId: inviteCode.createdBy },
                    ],
                },
            });
            let friendshipCreated = false;
            if (!existingFriendship) {
                await tx.friend.createMany({
                    data: [
                        { userId: inviteCode.createdBy, friendId: userId },
                        { userId: userId, friendId: inviteCode.createdBy },
                    ],
                });
                friendshipCreated = true;
            }
            return {
                friendId: inviteCode.createdBy,
                friendshipCreated,
            };
        });
        return result;
    }
    async revokeInviteCode(inviteCodeId, userId) {
        const inviteCode = await prisma_1.default.inviteCode.findUnique({
            where: { id: inviteCodeId },
        });
        if (!inviteCode) {
            throw new Error('Invite code not found');
        }
        if (inviteCode.createdBy !== userId) {
            throw new Error('Unauthorized');
        }
        if (inviteCode.usedAt) {
            throw new Error('Cannot revoke an already used invite code');
        }
        return prisma_1.default.inviteCode.delete({
            where: { id: inviteCodeId },
        });
    }
    async validateInviteCode(code) {
        const inviteCode = await prisma_1.default.inviteCode.findUnique({
            where: { code: code.toUpperCase() },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        if (!inviteCode) {
            return { valid: false, reason: 'invalid' };
        }
        if (inviteCode.usedAt || inviteCode.usedBy) {
            return { valid: false, reason: 'already_used' };
        }
        if (new Date() > inviteCode.expiresAt) {
            return { valid: false, reason: 'expired' };
        }
        return { valid: true, inviteCode };
    }
}
exports.InviteCodeService = InviteCodeService;
exports.inviteCodeService = new InviteCodeService();
//# sourceMappingURL=invite-code.service.js.map