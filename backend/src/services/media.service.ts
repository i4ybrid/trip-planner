import prisma from '@/lib/prisma';
import { storageConfig } from '@/lib/storage';

export class MediaService {
  async createMediaItem(data: {
    tripId: string;
    uploaderId: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    activityId?: string;
    caption?: string;
  }) {
    const mediaItem = await prisma.mediaItem.create({
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
    await prisma.timelineEvent.create({
      data: {
        tripId: data.tripId,
        eventType: 'media_uploaded',
        description: `New ${data.type} was uploaded`,
        createdBy: data.uploaderId,
      },
    });

    return mediaItem;
  }

  async getTripMedia(tripId: string, limit = 50) {
    return prisma.mediaItem.findMany({
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

  async getMediaItem(id: string) {
    return prisma.mediaItem.findUnique({
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

  async deleteMediaItem(id: string) {
    // First, get the media item to retrieve the URL
    const mediaItem = await this.getMediaItem(id);
    
    if (!mediaItem) {
      throw new Error('Media item not found');
    }
    
    // Delete the file from storage
    await storageConfig.deleteFile(mediaItem.url);
    
    // Delete the database record
    return prisma.mediaItem.delete({
      where: { id },
    });
  }

  async updateMediaItem(id: string, data: { caption?: string }) {
    return prisma.mediaItem.update({
      where: { id },
      data,
    });
  }
}

export const mediaService = new MediaService();
