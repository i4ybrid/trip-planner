"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteService = exports.VoteService = void 0;
const prisma_1 = __importDefault(require("@/lib/prisma"));
class VoteService {
    async castVote(activityId, userId, option) {
        // Check if vote already exists
        const existingVote = await prisma_1.default.vote.findUnique({
            where: {
                activityId_userId: {
                    activityId,
                    userId,
                },
            },
        });
        if (existingVote) {
            return prisma_1.default.vote.update({
                where: {
                    activityId_userId: {
                        activityId,
                        userId,
                    },
                },
                data: { option },
            });
        }
        const vote = await prisma_1.default.vote.create({
            data: {
                activityId,
                userId,
                option,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        // Get activity info for timeline
        const activity = await prisma_1.default.activity.findUnique({
            where: { id: activityId },
            select: { title: true, tripId: true },
        });
        if (activity) {
            await prisma_1.default.timelineEvent.create({
                data: {
                    tripId: activity.tripId,
                    eventType: 'vote_cast',
                    description: `A vote was cast on "${activity.title}"`,
                },
            });
        }
        return vote;
    }
    async removeVote(activityId, userId) {
        return prisma_1.default.vote.delete({
            where: {
                activityId_userId: {
                    activityId,
                    userId,
                },
            },
        });
    }
    async getVotes(activityId) {
        return prisma_1.default.vote.findMany({
            where: { activityId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }
    async getUserVote(activityId, userId) {
        return prisma_1.default.vote.findUnique({
            where: {
                activityId_userId: {
                    activityId,
                    userId,
                },
            },
        });
    }
}
exports.VoteService = VoteService;
exports.voteService = new VoteService();
//# sourceMappingURL=vote.service.js.map