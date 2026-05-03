import { EventLocationInput, PublicEventBrowseInput } from '@/types';

function normalizeText(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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

export function normalizeEventLocation(input: PublicEventBrowseInput = {}): EventLocationInput {
  return {
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    country: normalizeText(input.country) || 'US',
  };
}

export class EventService {
  buildPublicEventBrowseWhere(location: EventLocationInput) {
    const where: any = {
      status: 'PUBLISHED',
      promotionEndsAt: { gte: new Date() },
    };

    if (location.country) {
      where.country = { equals: location.country, mode: 'insensitive' };
    }

    if (location.state) {
      where.state = { equals: location.state, mode: 'insensitive' };
    } else if (location.city) {
      where.city = { contains: location.city, mode: 'insensitive' };
    }

    return where;
  }

  applyPublicBrowseOrdering<T extends {
    city?: string | null;
    latitude?: unknown;
    longitude?: unknown;
  }>(events: T[], location: EventLocationInput): Array<T & { distanceMiles: number | null }> {
    const normalizedCity = location.city?.toLowerCase();

    return events
      .map((event) => {
        const eventLat = event.latitude != null ? Number(event.latitude) : undefined;
        const eventLng = event.longitude != null ? Number(event.longitude) : undefined;
        const hasDistance =
          location.latitude != null &&
          location.longitude != null &&
          eventLat != null &&
          eventLng != null;
        const distanceMiles = hasDistance
          ? milesBetween(
              { latitude: location.latitude!, longitude: location.longitude! },
              { latitude: eventLat!, longitude: eventLng! }
            )
          : null;
        const cityScore = normalizedCity && event.city?.toLowerCase() === normalizedCity ? 0 : 1;

        return {
          ...event,
          distanceMiles,
          cityScore,
        };
      })
      .sort((a: any, b: any) => {
        if (a.distanceMiles != null && b.distanceMiles != null) {
          return a.distanceMiles - b.distanceMiles;
        }
        if (a.distanceMiles != null) return -1;
        if (b.distanceMiles != null) return 1;
        if (a.cityScore !== b.cityScore) return a.cityScore - b.cityScore;
        return String(a.city || '').localeCompare(String(b.city || ''));
      })
      .map(({ cityScore: _cityScore, ...event }: any) => event);
  }
}

export const eventService = new EventService();
