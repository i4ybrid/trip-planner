import { PrismaClient, MediaItem } from '@prisma/client';

export type { MediaItem };

export interface CreateMediaInput {
  tripId: string;
  uploaderId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  activityId?: string;
  caption?: string;
}

export interface UpdateMediaInput {
  caption?: string;
}

export class MediaService {
  constructor(private prisma: PrismaClient) {}

  async createMedia(input: CreateMediaInput): Promise<MediaItem> {
    return this.prisma.mediaItem.create({
      data: {
        tripId: input.tripId,
        uploaderId: input.uploaderId,
        type: input.type,
        url: input.url,
        thumbnailUrl: input.thumbnailUrl,
        activityId: input.activityId,
        caption: input.caption,
      },
    });
  }

  async getMediaById(mediaId: string): Promise<MediaItem | null> {
    return this.prisma.mediaItem.findUnique({
      where: { id: mediaId },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async getTripMedia(tripId: string, type?: 'image' | 'video'): Promise<MediaItem[]> {
    return this.prisma.mediaItem.findMany({
      where: {
        tripId,
        ...(type ? { type } : {}),
      },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMedia(mediaId: string, input: UpdateMediaInput): Promise<MediaItem> {
    return this.prisma.mediaItem.update({
      where: { id: mediaId },
      data: input,
    });
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.prisma.mediaItem.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    const member = await this.prisma.tripMember.findFirst({
      where: {
        tripId: media.tripId,
        userId,
        role: { in: ['MASTER', 'ORGANIZER'] },
      },
    });

    if (media.uploaderId !== userId && !member) {
      throw new Error('Not authorized to delete this media');
    }

    await this.prisma.mediaItem.delete({
      where: { id: mediaId },
    });
  }

  async getActivityMedia(activityId: string): Promise<MediaItem[]> {
    return this.prisma.mediaItem.findMany({
      where: { activityId },
      include: {
        uploader: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  generateDownloadUrl(media: MediaItem): string {
    return media.url;
  }
}
