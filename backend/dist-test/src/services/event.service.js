"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventService = exports.EventService = void 0;
exports.normalizeEventLocation = normalizeEventLocation;
function normalizeText(value) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
}
function milesBetween(start, end) {
    const earthRadiusMiles = 3958.8;
    const toRadians = (value) => (value * Math.PI) / 180;
    const deltaLat = toRadians(end.latitude - start.latitude);
    const deltaLon = toRadians(end.longitude - start.longitude);
    const lat1 = toRadians(start.latitude);
    const lat2 = toRadians(end.latitude);
    const a = Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMiles * c;
}
function normalizeEventLocation(input = {}) {
    return {
        city: normalizeText(input.city),
        state: normalizeText(input.state),
        country: normalizeText(input.country) || 'US',
    };
}
class EventService {
    buildPublicEventBrowseWhere(location) {
        const where = {
            status: 'PUBLISHED',
            promotionEndsAt: { gte: new Date() },
        };
        if (location.country) {
            where.country = { equals: location.country, mode: 'insensitive' };
        }
        if (location.state) {
            where.state = { equals: location.state, mode: 'insensitive' };
        }
        else if (location.city) {
            where.city = { contains: location.city, mode: 'insensitive' };
        }
        return where;
    }
    applyPublicBrowseOrdering(events, location) {
        const normalizedCity = location.city?.toLowerCase();
        return events
            .map((event) => {
            const eventLat = event.latitude != null ? Number(event.latitude) : undefined;
            const eventLng = event.longitude != null ? Number(event.longitude) : undefined;
            const hasDistance = location.latitude != null &&
                location.longitude != null &&
                eventLat != null &&
                eventLng != null;
            const distanceMiles = hasDistance
                ? milesBetween({ latitude: location.latitude, longitude: location.longitude }, { latitude: eventLat, longitude: eventLng })
                : null;
            const cityScore = normalizedCity && event.city?.toLowerCase() === normalizedCity ? 0 : 1;
            return {
                ...event,
                distanceMiles,
                cityScore,
            };
        })
            .sort((a, b) => {
            if (a.distanceMiles != null && b.distanceMiles != null) {
                return a.distanceMiles - b.distanceMiles;
            }
            if (a.distanceMiles != null)
                return -1;
            if (b.distanceMiles != null)
                return 1;
            if (a.cityScore !== b.cityScore)
                return a.cityScore - b.cityScore;
            return String(a.city || '').localeCompare(String(b.city || ''));
        })
            .map(({ cityScore: _cityScore, ...event }) => event);
    }
}
exports.EventService = EventService;
exports.eventService = new EventService();
//# sourceMappingURL=event.service.js.map