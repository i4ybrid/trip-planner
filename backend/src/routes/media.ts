import { Router } from 'express';
import { MediaService } from '../services/media.service';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();
const mediaService = new MediaService(prisma);

// Get all media for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const type = req.query.type as 'image' | 'video' | undefined;
    const media = await mediaService.getTripMedia(req.params.tripId, type);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Upload media
router.post('/trip/:tripId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { type, url, thumbnailUrl, activityId, caption } = req.body;
    
    const media = await mediaService.createMedia({
      tripId: req.params.tripId,
      uploaderId: userId,
      type,
      url,
      thumbnailUrl,
      activityId,
      caption,
    });

    res.status(201).json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Get media by ID
router.get('/:id', async (req, res) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Update media (caption)
router.patch('/:id', async (req, res) => {
  try {
    const media = await mediaService.updateMedia(req.params.id, req.body);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// Delete media
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await mediaService.deleteMedia(req.params.id, userId);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get download URL
router.get('/:id/download', async (req, res) => {
  try {
    const media = await mediaService.getMediaById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const url = mediaService.generateDownloadUrl(media);
    res.json({ url });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get download URL' });
  }
});

// Get media for activity
router.get('/activity/:activityId', async (req, res) => {
  try {
    const media = await mediaService.getActivityMedia(req.params.activityId);
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity media' });
  }
});

export default router;
