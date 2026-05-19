import { EventLocationInput, PublicEventBrowseInput } from '@/types';
export declare function normalizeEventLocation(input?: PublicEventBrowseInput): EventLocationInput;
export declare class EventService {
    buildPublicEventBrowseWhere(location: EventLocationInput): any;
    applyPublicBrowseOrdering<T extends {
        city?: string | null;
        latitude?: unknown;
        longitude?: unknown;
    }>(events: T[], location: EventLocationInput): Array<T & {
        distanceMiles: number | null;
    }>;
}
export declare const eventService: EventService;
//# sourceMappingURL=event.service.d.ts.map