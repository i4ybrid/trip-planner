import { getPrisma } from '@/lib/prisma';
import {
  EventSearchInput,
  PublicEventCreateInput,
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

function milesBetween(
  start: { latitude: number; longitude: number },
  end: { latitude: number; longitude: number }
): number {
  const earthRadiusMiles = 3958.8;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(end.latitude - start.latitude);
  const deltaLon = toRadians(end.longitude - start.longitude);
  const lat1 = toRadians(start.latitude);
  const lat2 = toRadians(end.latitude);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMiles * c;
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

  async searchMyEvents(userId: string, input: EventSearchInput) {
    const query = input.query?.trim();
    const where: any = {
      members: {
        some: {
          userId,
          status: { not: 'DECLINED' },
        },
      },
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { destination: { contains: query, mode: 'insensitive' } },
      ];
    }

    return this.prisma.trip.findMany({
      where,
      take: input.limit || 8,
      orderBy: { updatedAt: 'desc' },
      include: {
        tripMaster: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { members: true, activities: true } },
      },
    });
  }

  async searchPublicEvents(userId: string, input: EventSearchInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
      },
    });

    const query = input.query?.trim();
    const location = {
      city: normalizeText(input.city) || normalizeText(user?.city),
      state: normalizeText(input.state) || normalizeText(user?.state),
      country: normalizeText(input.country) || normalizeText(user?.country) || 'US',
      latitude: input.latitude ?? (user?.latitude != null ? Number(user.latitude) : undefined),
      longitude: input.longitude ?? (user?.longitude != null ? Number(user.longitude) : undefined),
    };

    const where: any = {
      status: 'PUBLISHED',
      promotionEndsAt: { gte: new Date() },
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { venueName: { contains: query, mode: 'insensitive' } },
        { city: { contains: query, mode: 'insensitive' } },
        { state: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (location.country) {
      where.country = { equals: location.country, mode: 'insensitive' };
    }

    const candidates = await this.prisma.publicEvent.findMany({
      where,
      take: Math.max((input.limit || 8) * 4, 20),
      orderBy: [{ startDate: 'asc' }, { updatedAt: 'desc' }],
      include: this.defaultInclude(),
    });

    const regionFiltered = candidates
      .map((event: any) => {
        const eventLat = event.latitude != null ? Number(event.latitude) : undefined;
        const eventLng = event.longitude != null ? Number(event.longitude) : undefined;
        const hasDistance = location.latitude != null && location.longitude != null && eventLat != null && eventLng != null;
        const distanceMiles = hasDistance
          ? milesBetween(
              { latitude: location.latitude!, longitude: location.longitude! },
              { latitude: eventLat!, longitude: eventLng! }
            )
          : null;

        const cityMatch = location.city
          ? event.city?.toLowerCase() === location.city.toLowerCase()
          : true;
        const stateMatch = location.state
          ? event.state?.toLowerCase() === location.state.toLowerCase()
          : true;

        return {
          event,
          distanceMiles,
          isRegionalMatch: distanceMiles != null
            ? distanceMiles <= event.regionRadiusMiles
            : cityMatch && stateMatch,
        };
      })
      .filter((item: any) => item.isRegionalMatch)
      .sort((a: any, b: any) => {
        if (a.distanceMiles == null && b.distanceMiles == null) return 0;
        if (a.distanceMiles == null) return 1;
        if (b.distanceMiles == null) return -1;
        return a.distanceMiles - b.distanceMiles;
      })
      .slice(0, input.limit || 8)
      .map((item: any) => ({
        ...item.event,
        distanceMiles: item.distanceMiles,
      }));

    return regionFiltered;
  }

  async searchEvents(userId: string, input: EventSearchInput) {
    const scope = input.scope || 'all';
    const [myEvents, publicEvents] = await Promise.all([
      scope === 'public' ? Promise.resolve([]) : this.searchMyEvents(userId, input),
      scope === 'my' ? Promise.resolve([]) : this.searchPublicEvents(userId, input),
    ]);

    return { myEvents, publicEvents };
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
