"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("@/middleware/auth");
const public_event_service_1 = require("@/services/public-event.service");
const validations_1 = require("@/lib/validations");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
function parseDate(value) {
    return value ? new Date(value) : undefined;
}
// GET /api/public-events/browse - Browse promoted public events by city and/or state
router.get('/public-events/browse', async (req, res) => {
    try {
        const params = validations_1.browsePublicEventsSchema.parse(req.query);
        const results = await public_event_service_1.publicEventService.browsePublicEvents({
            city: params.city,
            state: params.state,
            country: params.country,
            limit: params.limit,
        });
        res.json({ data: results });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// GET /api/public-events - List promoted public events
router.get('/public-events', async (req, res) => {
    try {
        const params = validations_1.browsePublicEventsSchema.parse(req.query);
        const results = await public_event_service_1.publicEventService.browsePublicEvents({
            city: params.city,
            state: params.state,
            country: params.country,
            limit: params.limit,
        });
        res.json({ data: results });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// GET /api/public-events/locations - City autocomplete for browse controls
router.get('/public-events/locations', async (req, res) => {
    try {
        const city = typeof req.query.city === 'string' ? req.query.city : '';
        const limit = req.query.limit ? Number(req.query.limit) : 8;
        const results = await public_event_service_1.publicEventService.listBrowseLocations(city, limit);
        res.json({ data: results });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/public-events - Create organizer-managed public event draft
router.post('/public-events', async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = validations_1.createPublicEventSchema.parse(req.body);
        const event = await public_event_service_1.publicEventService.createPublicEvent(userId, {
            ...data,
            startDate: new Date(data.startDate),
            endDate: parseDate(data.endDate),
        });
        res.status(201).json({ data: event });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(500).json({ error: error.message });
    }
});
// GET /api/public-events/:id - View published event, or organizer draft
router.get('/public-events/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const event = await public_event_service_1.publicEventService.getPublicEventForUser(req.params.id, userId);
        if (!event) {
            res.status(404).json({ error: 'Public event not found' });
            return;
        }
        res.json({ data: event });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// PATCH /api/public-events/:id - Organizer edits event details
router.patch('/public-events/:id', async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = validations_1.updatePublicEventSchema.parse(req.body);
        const event = await public_event_service_1.publicEventService.updatePublicEvent(req.params.id, userId, {
            ...data,
            startDate: parseDate(data.startDate),
            endDate: parseDate(data.endDate),
        });
        res.json({ data: event });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(error.message === 'Unauthorized' ? 403 : 500).json({ error: error.message });
    }
});
// POST /api/public-events/:id/promotion-checkout - Create paid regional promotion checkout
router.post('/public-events/:id/promotion-checkout', async (req, res) => {
    try {
        const userId = req.user.userId;
        const data = validations_1.createPublicEventPromotionSchema.parse(req.body);
        const payment = await public_event_service_1.publicEventService.createPromotionCheckout(req.params.id, userId, data);
        res.status(201).json({ data: payment });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            res.status(400).json({ error: 'Validation error', details: error.errors });
            return;
        }
        res.status(error.message === 'Unauthorized' ? 403 : 500).json({ error: error.message });
    }
});
// POST /api/public-events/:id/promotion-payments/:paymentId/confirm
// Development/provider callback endpoint: marks promotion paid and publishes the event.
router.post('/public-events/:id/promotion-payments/:paymentId/confirm', async (req, res) => {
    try {
        const userId = req.user.userId;
        const payment = await public_event_service_1.publicEventService.confirmPromotionPayment(req.params.id, userId, req.params.paymentId);
        res.json({ data: payment });
    }
    catch (error) {
        res.status(error.message === 'Unauthorized' ? 403 : 400).json({ error: error.message });
    }
});
// POST /api/public-events/:id/publish - Publish only when an active paid promotion exists
router.post('/public-events/:id/publish', async (req, res) => {
    try {
        const userId = req.user.userId;
        const event = await public_event_service_1.publicEventService.publishPublicEvent(req.params.id, userId);
        res.json({ data: event });
    }
    catch (error) {
        res.status(error.message === 'Unauthorized' ? 403 : 400).json({ error: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=public-events.js.map