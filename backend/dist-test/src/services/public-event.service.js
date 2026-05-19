"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicEventService = exports.PublicEventService = void 0;
const prisma_1 = require("@/lib/prisma");
const event_service_1 = require("@/services/event.service");
const DEFAULT_PROMOTION_AMOUNT = 49;
const DEFAULT_PROMOTION_DAYS = 30;
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
function normalizeText(value) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}
class PublicEventService {
    prisma = (0, prisma_1.getPrisma)();
    async createPublicEvent(organizerId, data) {
        return this.prisma.publicEvent.create({
            data: {
                ...data,
                organizerId,
                country: data.country || 'US',
                regionRadiusMiles: data.regionRadiusMiles || 50,
            },
            include: this.defaultInclude(),
        });
    }
    async getPublicEventForUser(publicEventId, userId) {
        const event = await this.prisma.publicEvent.findUnique({
            where: { id: publicEventId },
            include: this.defaultInclude(),
        });
        if (!event)
            return null;
        if (event.status === 'PUBLISHED' || event.organizerId === userId)
            return event;
        return null;
    }
    async updatePublicEvent(publicEventId, organizerId, data) {
        await this.assertOrganizer(publicEventId, organizerId);
        return this.prisma.publicEvent.update({
            where: { id: publicEventId },
            data,
            include: this.defaultInclude(),
        });
    }
    async createPromotionCheckout(publicEventId, organizerId, data) {
        const event = await this.assertOrganizer(publicEventId, organizerId);
        const startsAt = new Date();
        const endsAt = addDays(startsAt, data.durationDays || DEFAULT_PROMOTION_DAYS);
        const payment = await this.prisma.publicEventPromotionPayment.create({
            data: {
                publicEventId,
                organizerId,
                amount: data.amount || DEFAULT_PROMOTION_AMOUNT,
                currency: data.currency || event.currency || 'USD',
                provider: process.env.PUBLIC_EVENT_PAYMENT_PROVIDER || 'mock',
                status: 'PENDING',
                regionCity: normalizeText(data.regionCity) || event.city,
                regionState: normalizeText(data.regionState) || event.state,
                regionCountry: normalizeText(data.regionCountry) || event.country || 'US',
                regionRadiusMiles: data.regionRadiusMiles || event.regionRadiusMiles || 50,
                startsAt,
                endsAt,
            },
        });
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const checkoutUrl = `${frontendUrl}/public-events/${publicEventId}/promotion?payment=${payment.id}`;
        const updatedPayment = await this.prisma.publicEventPromotionPayment.update({
            where: { id: payment.id },
            data: {
                checkoutUrl,
                providerCheckoutId: `mock_public_event_${payment.id}`,
            },
        });
        await this.prisma.publicEvent.update({
            where: { id: publicEventId },
            data: {
                status: 'PENDING_PAYMENT',
                regionRadiusMiles: data.regionRadiusMiles || event.regionRadiusMiles || 50,
            },
        });
        return updatedPayment;
    }
    async confirmPromotionPayment(publicEventId, organizerId, paymentId) {
        const event = await this.assertOrganizer(publicEventId, organizerId);
        const payment = await this.prisma.publicEventPromotionPayment.findFirst({
            where: { id: paymentId, publicEventId, organizerId },
        });
        if (!payment) {
            throw new Error('Promotion payment not found');
        }
        if (payment.status === 'CANCELLED' || payment.status === 'REFUNDED') {
            throw new Error('Promotion payment can no longer be confirmed');
        }
        const updatedPayment = await this.prisma.publicEventPromotionPayment.update({
            where: { id: paymentId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        });
        await this.prisma.publicEvent.update({
            where: { id: publicEventId },
            data: {
                status: 'PUBLISHED',
                publishedAt: event.publishedAt || new Date(),
                promotionStartsAt: payment.startsAt,
                promotionEndsAt: payment.endsAt,
                regionRadiusMiles: payment.regionRadiusMiles,
            },
        });
        return updatedPayment;
    }
    async publishPublicEvent(publicEventId, organizerId) {
        await this.assertOrganizer(publicEventId, organizerId);
        const now = new Date();
        const paidPromotion = await this.prisma.publicEventPromotionPayment.findFirst({
            where: {
                publicEventId,
                organizerId,
                status: 'PAID',
                endsAt: { gte: now },
            },
            orderBy: { endsAt: 'desc' },
        });
        if (!paidPromotion) {
            throw new Error('Public events require an active paid promotion before publishing');
        }
        return this.prisma.publicEvent.update({
            where: { id: publicEventId },
            data: {
                status: 'PUBLISHED',
                publishedAt: now,
                promotionStartsAt: paidPromotion.startsAt,
                promotionEndsAt: paidPromotion.endsAt,
                regionRadiusMiles: paidPromotion.regionRadiusMiles,
            },
            include: this.defaultInclude(),
        });
    }
    async browsePublicEvents(input) {
        const location = (0, event_service_1.normalizeEventLocation)(input);
        if (location.city &&
            location.state &&
            (location.latitude == null || location.longitude == null)) {
            const referenceEvent = await this.prisma.publicEvent.findFirst({
                where: {
                    status: 'PUBLISHED',
                    promotionEndsAt: { gte: new Date() },
                    country: { equals: location.country || 'US', mode: 'insensitive' },
                    state: { equals: location.state, mode: 'insensitive' },
                    city: { equals: location.city, mode: 'insensitive' },
                    latitude: { not: null },
                    longitude: { not: null },
                },
                select: { latitude: true, longitude: true },
            });
            if (referenceEvent?.latitude != null && referenceEvent.longitude != null) {
                location.latitude = Number(referenceEvent.latitude);
                location.longitude = Number(referenceEvent.longitude);
            }
        }
        const candidates = await this.prisma.publicEvent.findMany({
            where: event_service_1.eventService.buildPublicEventBrowseWhere(location),
            take: Math.max((input.limit || 8) * 4, 20),
            orderBy: [{ startDate: 'asc' }, { updatedAt: 'desc' }],
            include: this.defaultInclude(),
        });
        const orderedEvents = event_service_1.eventService.applyPublicBrowseOrdering(candidates, location);
        return orderedEvents
            .slice(0, input.limit || 8)
            .map((event) => ({
            ...event,
            distanceMiles: event.distanceMiles,
        }));
    }
    async listBrowseLocations(city, limit = 8) {
        const normalizedCity = normalizeText(city);
        if (!normalizedCity || normalizedCity.length < 2) {
            return [];
        }
        const locations = await this.prisma.publicEvent.findMany({
            where: {
                status: 'PUBLISHED',
                promotionEndsAt: { gte: new Date() },
                city: { contains: normalizedCity, mode: 'insensitive' },
            },
            distinct: ['city', 'state', 'country'],
            select: {
                city: true,
                state: true,
                country: true,
                latitude: true,
                longitude: true,
            },
            orderBy: [{ city: 'asc' }, { state: 'asc' }],
            take: limit,
        });
        return locations.map((location) => ({
            city: location.city,
            state: location.state,
            country: location.country,
            latitude: location.latitude != null ? Number(location.latitude) : null,
            longitude: location.longitude != null ? Number(location.longitude) : null,
        }));
    }
    async assertOrganizer(publicEventId, organizerId) {
        const event = await this.prisma.publicEvent.findUnique({
            where: { id: publicEventId },
        });
        if (!event) {
            throw new Error('Public event not found');
        }
        if (event.organizerId !== organizerId) {
            throw new Error('Unauthorized');
        }
        return event;
    }
    defaultInclude() {
        return {
            organizer: {
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                },
            },
            promotionPayments: {
                orderBy: { createdAt: 'desc' },
                take: 3,
            },
        };
    }
}
exports.PublicEventService = PublicEventService;
exports.publicEventService = new PublicEventService();
//# sourceMappingURL=public-event.service.js.map