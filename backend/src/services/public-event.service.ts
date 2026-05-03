import { getPrisma } from '@/lib/prisma';
import { eventService, normalizeEventLocation } from '@/services/event.service';
import {
  PublicEventBrowseInput,
  PublicEventCreateInput,
  PublicEventLocationSuggestion,
  PublicEventPromotionInput,
  PublicEventUpdateInput,
} from '@/types';

const DEFAULT_PROMOTION_AMOUNT = 49;
const DEFAULT_PROMOTION_DAYS = 30;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function normalizeText(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export class PublicEventService {
  private prisma = getPrisma();

  async createPublicEvent(organizerId: string, data: PublicEventCreateInput) {
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

  async getPublicEventForUser(publicEventId: string, userId: string) {
    const event = await this.prisma.publicEvent.findUnique({
      where: { id: publicEventId },
      include: this.defaultInclude(),
    });

    if (!event) return null;
    if (event.status === 'PUBLISHED' || event.organizerId === userId) return event;
    return null;
  }

  async updatePublicEvent(publicEventId: string, organizerId: string, data: PublicEventUpdateInput) {
    await this.assertOrganizer(publicEventId, organizerId);

    return this.prisma.publicEvent.update({
      where: { id: publicEventId },
      data,
      include: this.defaultInclude(),
    });
  }

  async createPromotionCheckout(
    publicEventId: string,
    organizerId: string,
    data: PublicEventPromotionInput
  ) {
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

  async confirmPromotionPayment(publicEventId: string, organizerId: string, paymentId: string) {
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

  async publishPublicEvent(publicEventId: string, organizerId: string) {
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

  async browsePublicEvents(input: PublicEventBrowseInput) {
    const location = normalizeEventLocation(input);

    if (
      location.city &&
      location.state &&
      (location.latitude == null || location.longitude == null)
    ) {
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
      where: eventService.buildPublicEventBrowseWhere(location),
      take: Math.max((input.limit || 8) * 4, 20),
      orderBy: [{ startDate: 'asc' }, { updatedAt: 'desc' }],
      include: this.defaultInclude(),
    });

    const orderedEvents = eventService.applyPublicBrowseOrdering(candidates, location);

    return orderedEvents
      .slice(0, input.limit || 8)
      .map((event: any) => ({
        ...event,
        distanceMiles: event.distanceMiles,
      }));
  }

  async listBrowseLocations(city: string, limit = 8): Promise<PublicEventLocationSuggestion[]> {
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

  private async assertOrganizer(publicEventId: string, organizerId: string) {
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

  private defaultInclude() {
    return {
      organizer: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
        },
      },
      promotionPayments: {
        orderBy: { createdAt: 'desc' as const },
        take: 3,
      },
    };
  }
}

export const publicEventService = new PublicEventService();
