import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MediaService } from './media.service';

const mockPrisma = {
  mediaItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  tripMember: {
    findFirst: vi.fn(),
  },
};

const mockPrismaClient = mockPrisma as any;

describe('MediaService', () => {
  let mediaService: MediaService;

  beforeEach(() => {
    vi.resetAllMocks();
    mediaService = new MediaService(mockPrismaClient);
  });

  describe('createMedia', () => {
    it('should create media with all fields', async () => {
      const mediaData = {
        tripId: 'trip-1',
        uploaderId: 'user-1',
        type: 'image' as const,
        url: 'https://example.com/image.jpg',
        caption: 'Beautiful sunset',
      };

      mockPrisma.mediaItem.create.mockResolvedValue({
        id: 'media-1',
        ...mediaData,
        thumbnailUrl: null,
        activityId: null,
        createdAt: new Date(),
      });

      const result = await mediaService.createMedia(mediaData);

      expect(result.url).toBe('https://example.com/image.jpg');
      expect(result.caption).toBe('Beautiful sunset');
      expect(mockPrisma.mediaItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tripId: 'trip-1',
          uploaderId: 'user-1',
          type: 'image',
          url: 'https://example.com/image.jpg',
        }),
      });
    });
  });

  describe('getTripMedia', () => {
    it('should return all media for a trip', async () => {
      const media = [
        { id: 'media-1', tripId: 'trip-1', type: 'image' },
        { id: 'media-2', tripId: 'trip-1', type: 'video' },
      ];
      mockPrisma.mediaItem.findMany.mockResolvedValue(media);

      const result = await mediaService.getTripMedia('trip-1');

      expect(result).toHaveLength(2);
      expect(mockPrisma.mediaItem.findMany).toHaveBeenCalledWith({
        where: { tripId: 'trip-1' },
        include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by type when specified', async () => {
      mockPrisma.mediaItem.findMany.mockResolvedValue([]);

      await mediaService.getTripMedia('trip-1', 'image');

      expect(mockPrisma.mediaItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tripId: 'trip-1', type: 'image' },
        })
      );
    });
  });

  describe('updateMedia', () => {
    it('should update caption', async () => {
      mockPrisma.mediaItem.update.mockResolvedValue({
        id: 'media-1',
        caption: 'Updated caption',
      } as any);

      const result = await mediaService.updateMedia('media-1', { caption: 'Updated caption' });

      expect(result.caption).toBe('Updated caption');
      expect(mockPrisma.mediaItem.update).toHaveBeenCalledWith({
        where: { id: 'media-1' },
        data: { caption: 'Updated caption' },
      });
    });
  });

  describe('getMediaById', () => {
    it('should return media by id with uploader', async () => {
      const media = {
        id: 'media-1',
        url: 'https://example.com/image.jpg',
        uploader: { id: 'user-1', name: 'John', avatarUrl: null },
      };
      mockPrisma.mediaItem.findUnique.mockResolvedValue(media as any);

      const result = await mediaService.getMediaById('media-1');

      expect(result).toEqual(media);
      expect(mockPrisma.mediaItem.findUnique).toHaveBeenCalledWith({
        where: { id: 'media-1' },
        include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
      });
    });

    it('should return null for non-existent media', async () => {
      mockPrisma.mediaItem.findUnique.mockResolvedValue(null);

      const result = await mediaService.getMediaById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('deleteMedia', () => {
    it('should delete own media', async () => {
      mockPrisma.mediaItem.findUnique.mockResolvedValue({
        id: 'media-1',
        uploaderId: 'user-1',
        tripId: 'trip-1',
      });
      mockPrisma.mediaItem.delete.mockResolvedValue({} as any);

      await mediaService.deleteMedia('media-1', 'user-1');

      expect(mockPrisma.mediaItem.delete).toHaveBeenCalledWith({
        where: { id: 'media-1' },
      });
    });

    it('should allow organizer to delete any media', async () => {
      mockPrisma.mediaItem.findUnique.mockResolvedValue({
        id: 'media-1',
        uploaderId: 'user-1',
        tripId: 'trip-1',
      });
      mockPrisma.tripMember.findFirst.mockResolvedValue({
        userId: 'user-2',
        role: 'ORGANIZER',
      });
      mockPrisma.mediaItem.delete.mockResolvedValue({} as any);

      await mediaService.deleteMedia('media-1', 'user-2');

      expect(mockPrisma.mediaItem.delete).toHaveBeenCalled();
    });

    it('should throw when non-owner tries to delete', async () => {
      mockPrisma.mediaItem.findUnique.mockResolvedValue({
        id: 'media-1',
        uploaderId: 'user-1',
        tripId: 'trip-1',
      });
      mockPrisma.tripMember.findFirst.mockResolvedValue(null);

      await expect(
        mediaService.deleteMedia('media-1', 'user-3')
      ).rejects.toThrow('Not authorized to delete this media');
    });

    it('should throw when media not found', async () => {
      mockPrisma.mediaItem.findUnique.mockResolvedValue(null);

      await expect(
        mediaService.deleteMedia('media-1', 'user-1')
      ).rejects.toThrow('Media not found');
    });
  });

  describe('getActivityMedia', () => {
    it('should return media for an activity', async () => {
      const media = [{ id: 'media-1', activityId: 'activity-1' }];
      mockPrisma.mediaItem.findMany.mockResolvedValue(media);

      const result = await mediaService.getActivityMedia('activity-1');

      expect(result).toHaveLength(1);
      expect(mockPrisma.mediaItem.findMany).toHaveBeenCalledWith({
        where: { activityId: 'activity-1' },
        include: { uploader: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('generateDownloadUrl', () => {
    it('should return the media URL', () => {
      const media = { id: 'media-1', url: 'https://example.com/image.jpg' } as any;

      const result = mediaService.generateDownloadUrl(media);

      expect(result).toBe('https://example.com/image.jpg');
    });
  });
});
