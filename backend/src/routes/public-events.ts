import { Router } from 'express';
import { authMiddleware, AuthRequest } from '@/middleware/auth';
import { publicEventService } from '@/services/public-event.service';
import {
  createPublicEventPromotionSchema,
  createPublicEventSchema,
  searchEventsSchema,
  updatePublicEventSchema,
} from '@/lib/validations';

const router = Router();

router.use(authMiddleware);

function parseDate(value?: string): Date | undefined {
  return value ? new Date(value) : undefined;
}

// GET /api/search/events - Universal event search across my events and promoted public events
router.get('/search/events', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const params = searchEventsSchema.parse(req.query);

    const results = await publicEventService.searchEvents(userId, {
      query: params.q,
      scope: params.scope,
      city: params.city,
      state: params.state,
      country: params.country,
      latitude: params.latitude,
      longitude: params.longitude,
      limit: params.limit,
    });

    res.json({ data: results });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/public-events - Search/list promoted public events
router.get('/public-events', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const params = searchEventsSchema.parse({ ...req.query, scope: 'public' });
    const results = await publicEventService.searchPublicEvents(userId, {
      query: params.q,
      city: params.city,
      state: params.state,
      country: params.country,
      latitude: params.latitude,
      longitude: params.longitude,
      limit: params.limit,
    });

    res.json({ data: results });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/public-events - Create organizer-managed public event draft
router.post('/public-events', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const data = createPublicEventSchema.parse(req.body);
    const event = await publicEventService.createPublicEvent(userId, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: parseDate(data.endDate),
    });

    res.status(201).json({ data: event });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message });
  }
});

// GET /api/public-events/:id - View published event, or organizer draft
router.get('/public-events/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const event = await publicEventService.getPublicEventForUser(req.params.id, userId);

    if (!event) {
      res.status(404).json({ error: 'Public event not found' });
      return;
    }

    res.json({ data: event });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/public-events/:id - Organizer edits event details
router.patch('/public-events/:id', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const data = updatePublicEventSchema.parse(req.body);
    const event = await publicEventService.updatePublicEvent(req.params.id, userId, {
      ...data,
      startDate: parseDate(data.startDate),
      endDate: parseDate(data.endDate),
    });

    res.json({ data: event });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(error.message === 'Unauthorized' ? 403 : 500).json({ error: error.message });
  }
});

// POST /api/public-events/:id/promotion-checkout - Create paid regional promotion checkout
router.post('/public-events/:id/promotion-checkout', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const data = createPublicEventPromotionSchema.parse(req.body);
    const payment = await publicEventService.createPromotionCheckout(req.params.id, userId, data);

    res.status(201).json({ data: payment });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({ error: 'Validation error', details: error.errors });
      return;
    }
    res.status(error.message === 'Unauthorized' ? 403 : 500).json({ error: error.message });
  }
});

// POST /api/public-events/:id/promotion-payments/:paymentId/confirm
// Development/provider callback endpoint: marks promotion paid and publishes the event.
router.post('/public-events/:id/promotion-payments/:paymentId/confirm', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const payment = await publicEventService.confirmPromotionPayment(req.params.id, userId, req.params.paymentId);
    res.json({ data: payment });
  } catch (error: any) {
    res.status(error.message === 'Unauthorized' ? 403 : 400).json({ error: error.message });
  }
});

// POST /api/public-events/:id/publish - Publish only when an active paid promotion exists
router.post('/public-events/:id/publish', async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const event = await publicEventService.publishPublicEvent(req.params.id, userId);
    res.json({ data: event });
  } catch (error: any) {
    res.status(error.message === 'Unauthorized' ? 403 : 400).json({ error: error.message });
  }
});

export default router;
