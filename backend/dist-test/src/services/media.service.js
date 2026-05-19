"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaService = exports.MediaService = void 0;
const prisma_1 = __importDefault(require("@/lib/prisma"));
const storage_1 = require("@/lib/storage");
class MediaService {
    async createMediaItem(data) {
        const mediaItem = await prisma_1.default.mediaItem.create({
            data,
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                activity: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        // Create timeline event
        await prisma_1.default.timelineEvent.create({
            data: {
                tripId: data.tripId,
                eventType: 'media_uploaded',
                description: `New ${data.type} was uploaded`,
                createdBy: data.uploaderId,
            },
        });
        return mediaItem;
    }
    async getTripMedia(tripId, limit = 50) {
        return prisma_1.default.mediaItem.findMany({
            where: { tripId },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                activity: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getMediaItem(id) {
        return prisma_1.default.mediaItem.findUnique({
            where: { id },
            include: {
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                activity: true,
            },
        });
    }
    async deleteMediaItem(id) {
        // First, get the media item to retrieve the URL
        const mediaItem = await this.getMediaItem(id);
        if (!mediaItem) {
            throw new Error('Media item not found');
        }
        // Delete the file from storage
        await storage_1.storageConfig.deleteFile(mediaItem.url);
        // Delete the database record
        return prisma_1.default.mediaItem.delete({
            where: { id },
        });
    }
    async updateMediaItem(id, data) {
        return prisma_1.default.mediaItem.update({
            where: { id },
            data,
        });
    }
}
exports.MediaService = MediaService;
exports.mediaService = new MediaService();
//# sourceMappingURL=media.service.js.map