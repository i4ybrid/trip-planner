import { PrismaClient, MediaItem } from '@prisma/client';

export type { MediaItem };

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  timeOffset?: number; // seconds into the video
  quality?: number;
}

export class ThumbnailService {
  constructor(private prisma: PrismaClient) {}

  async generateThumbnail(mediaId: string, options: ThumbnailOptions = {}): Promise<string> {
    const media = await this.prisma.mediaItem.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    if (media.type !== 'video') {
      throw new Error('Media is not a video');
    }

    const { width = 640, height = 360, timeOffset = 1, quality = 75 } = options;

    // In production, this would:
    // 1. Use FFmpeg to extract a frame
    // 2. Or use AWS MediaConvert
    // 3. Or use Cloudinary/Imgix transformations
    
    // For now, return a placeholder URL with transformation params
    // In production, replace with actual thumbnail generation
    const thumbnailUrl = this.generatePlaceholderThumbnail(media.url, {
      width,
      height,
      timeOffset,
      quality,
    });

    await this.prisma.mediaItem.update({
      where: { id: mediaId },
      data: { thumbnailUrl },
    });

    return thumbnailUrl;
  }

  private generatePlaceholderThumbnail(
    videoUrl: string, 
    options: ThumbnailOptions
  ): string {
    const { width = 640, height = 360, timeOffset = 1 } = options;
    
    // If using a service like Cloudinary:
    // return `https://res.cloudinary.com/demo/video/upload/so_${timeOffset},w_${width},h_${height}/video.jpg`;
    
    // For now, return a placeholder
    return `https://picsum.photos/${width}/${height}?random=${Date.now()}`;
  }

  async processAllVideoThumbnails(): Promise<number> {
    const videos = await this.prisma.mediaItem.findMany({
      where: {
        type: 'video',
        thumbnailUrl: null,
      },
    });

    for (const video of videos) {
      try {
        await this.generateThumbnail(video.id);
      } catch (error) {
        console.error(`Failed to generate thumbnail for ${video.id}:`, error);
      }
    }

    return videos.length;
  }

  getThumbnailUrl(media: MediaItem): string {
    if (media.thumbnailUrl) {
      return media.thumbnailUrl;
    }
    
    // Return a placeholder for videos without thumbnails
    if (media.type === 'video') {
      return 'https://picsum.photos/640/360?random=video';
    }
    
    return media.url;
  }
}
