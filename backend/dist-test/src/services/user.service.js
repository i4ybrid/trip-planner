"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
const prisma_1 = __importDefault(require("@/lib/prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("@/lib/logger");
class UserService {
    async getUserById(id) {
        try {
            return await prisma_1.default.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatarUrl: true,
                    phone: true,
                    city: true,
                    state: true,
                    country: true,
                    latitude: true,
                    longitude: true,
                    locationSource: true,
                    venmo: true,
                    paypal: true,
                    zelle: true,
                    cashapp: true,
                    createdAt: true,
                    settings: true,
                },
            });
        }
        catch (error) {
            logger_1.logger.warn('Extended user location fields are unavailable; falling back to base user profile select.', error);
            return prisma_1.default.user.findUnique({
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
    }
    async getUserByEmail(email) {
        return prisma_1.default.user.findUnique({
            where: { email },
        });
    }
    async createUser(data) {
        const passwordHash = data.password ? await bcryptjs_1.default.hash(data.password, 10) : undefined;
        return prisma_1.default.user.create({
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
    async createOAuthUser(data) {
        return prisma_1.default.user.create({
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
    async updateUser(userId, data) {
        try {
            return await prisma_1.default.user.update({
                where: { id: userId },
                data,
            });
        }
        catch (error) {
            const { city, state, country, latitude, longitude, locationSource, ...baseData } = data;
            if (city !== undefined || state !== undefined || country !== undefined || latitude !== undefined || longitude !== undefined || locationSource !== undefined) {
                logger_1.logger.warn('Extended user location fields are unavailable; saving base profile fields only.', error);
                return prisma_1.default.user.update({
                    where: { id: userId },
                    data: baseData,
                });
            }
            throw error;
        }
    }
    async updatePassword(userId, currentPassword, newPassword) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { passwordHash: true },
        });
        if (!user?.passwordHash) {
            throw new Error('User does not have a password');
        }
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            throw new Error('Current password is incorrect');
        }
        const passwordHash = await bcryptjs_1.default.hash(newPassword, 10);
        return prisma_1.default.user.update({
            where: { id: userId },
            data: { passwordHash },
        });
    }
    async verifyPassword(email, password) {
        const user = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (!user?.passwordHash) {
            return null;
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
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
    async getSettings(userId) {
        return prisma_1.default.settings.findUnique({
            where: { userId },
        });
    }
    async updateSettings(userId, data) {
        return prisma_1.default.settings.upsert({
            where: { userId },
            update: data,
            create: {
                userId,
                ...data,
            },
        });
    }
    async generatePasswordResetToken(email) {
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user || !user.passwordHash) {
            // Return dummy success to prevent email enumeration
            return { token: 'dummy', userId: 'dummy' };
        }
        const token = crypto_1.default.randomUUID();
        const tokenHash = await bcryptjs_1.default.hash(token, 10);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma_1.default.passwordResetToken.create({
            data: { email, tokenHash, expiresAt, userId: user.id },
        });
        return { token, userId: user.id };
    }
    async resetPassword(token, newPassword) {
        const tokens = await prisma_1.default.passwordResetToken.findMany({
            where: { usedAt: null, expiresAt: { gt: new Date() } },
            orderBy: { expiresAt: 'desc' },
        });
        for (const record of tokens) {
            const valid = await bcryptjs_1.default.compare(token, record.tokenHash);
            if (valid) {
                await prisma_1.default.user.update({
                    where: { id: record.userId },
                    data: { passwordHash: await bcryptjs_1.default.hash(newPassword, 10) },
                });
                await prisma_1.default.passwordResetToken.update({
                    where: { id: record.id },
                    data: { usedAt: new Date() },
                });
                return true;
            }
        }
        return false;
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
//# sourceMappingURL=user.service.js.map