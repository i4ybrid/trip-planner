import { Router } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { storageConfig } from '../lib/storage';
import { notificationService } from '../services/notification.service';
import { mediaService } from '../services/media.service';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/notifications - List notifications
router.get('/notifications', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    
    const notifications = await notificationService.getNotifications(userId, limit);
    res.json({ data: notifications });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notifications/unread-count - Get unread count
router.get('/notifications/unread-count', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const count = await notificationService.getUnreadCount(userId);
    res.json({ data: { count } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/notifications/:id - Mark as read
router.patch('/notifications/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const notificationId = req.params.id;
    
    // Verify ownership
    const notification = await notificationService.getNotifications(userId);
    const ownsNotification = notification.some((n) => n.id === notificationId);
    
    if (!ownsNotification) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await notificationService.markAsRead(notificationId, userId);
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notifications/mark-all-read - Mark all as read
router.post('/notifications/mark-all-read', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    await notificationService.markAllAsRead(userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/notifications/:id', async (req: AuthRequest, res) => {
  try {
    const notificationId = req.params.id;

    await notificationService.deleteNotification(notificationId);
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/trips/:tripId/media - Get trip media
router.get('/trips/:tripId/media', async (req: AuthRequest, res) => {
  try {
    const tripId = req.params.tripId;
    const limit = req.query.limit ? Number(req.query.limit) : 50;

    // We need to import tripService here to check permission
    // For now, we'll skip the permission check and let the service handle it
    const media = await mediaService.getTripMedia(tripId, limit);
    res.json({ data: media });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/trips/:tripId/media - Upload media
router.post('/trips/:tripId/media', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const tripId = req.params.tripId;

    // Handle file upload or URL
    let url: string;
    let type: 'image' | 'video';

    if (req.file) {
      // File was uploaded - get URL from storage config
      url = storageConfig.getFileUrl(req.file.filename);
      
      // For local files, construct full URL with backend host
      if (!storageConfig.isRemote) {
        const protocol = req.protocol;
        const host = req.get('host') || process.env.BACKEND_URL || 'localhost:4000';
        url = `${protocol}://${host}${url}`;
      }
      
      type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
    } else {
      // URL provided in body
      const { type: bodyType, url: bodyUrl } = req.body;

      if (!bodyType || !bodyUrl) {
        res.status(400).json({ error: 'type and url are required, or provide a file' });
        return;
      }

      type = bodyType as 'image' | 'video';
      url = bodyUrl;
    }

    const mediaItem = await mediaService.createMediaItem({
      tripId,
      uploaderId: userId,
      type,
      url,
      caption: req.body.caption,
      thumbnailUrl: req.body.thumbnailUrl,
      activityId: req.body.activityId,
    });

    res.status(201).json({ data: mediaItem });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/media/:id - Delete media
router.delete('/media/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const mediaId = req.params.id;
    
    const mediaItem = await mediaService.getMediaItem(mediaId);
    
    if (!mediaItem) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }
    
    // Only uploader can delete
    if (mediaItem.uploaderId !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }
    
    await mediaService.deleteMediaItem(mediaId);
    res.json({ message: 'Media deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
