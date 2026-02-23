import { Router } from 'express';
import { MediaService } from '../services/media.service';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/error-handler';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();
const mediaService = new MediaService(prisma);

// Get all media for a trip
router.get('/', asyncHandler(async (req, res) => {
  const tripId = req.params.tripId;
  const type = req.query.type as 'image' | 'video' | undefined;
  const media = await mediaService.getTripMedia(tripId, type);
  res.json(media);
}));

// Upload media
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  const tripId = req.params.tripId;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, url, thumbnailUrl, activityId, caption } = req.body;
  
  const media = await mediaService.createMedia({
    tripId,
    uploaderId: userId,
    type,
    url,
    thumbnailUrl,
    activityId,
    caption,
  });

  res.status(201).json(media);
}));

// Get media by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);
  if (!media) {
    return res.status(404).json({ error: 'Media not found' });
  }
  res.json(media);
}));

// Update media (caption)
router.patch('/:id', asyncHandler(async (req, res) => {
  const media = await mediaService.updateMedia(req.params.id, req.body);
  res.json(media);
}));

// Delete media
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await mediaService.deleteMedia(req.params.id, userId);
  res.status(204).send();
}));

// Get download URL
router.get('/:id/download', asyncHandler(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);
  if (!media) {
    return res.status(404).json({ error: 'Media not found' });
  }

  const url = mediaService.generateDownloadUrl(media);
  res.json({ url });
}));

// Get media for activity
router.get('/activity/:activityId', asyncHandler(async (req, res) => {
  const media = await mediaService.getActivityMedia(req.params.activityId);
  res.json(media);
}));

export default router;

