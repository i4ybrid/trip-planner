export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    location?: string;
    startDate: string;
    endDate: string;
    allDay: boolean;
    type: 'activity' | 'trip_start' | 'trip_end' | 'payment_due' | 'vote_deadline';
    tripId: string;
    tripName: string;
    color?: string;
}
/**
 * Generate iCal format string from calendar events
 */
declare function generateICal(events: CalendarEvent[]): string;
/**
 * Generate Google Calendar URL
 */
declare function generateGoogleCalendarUrl(event: CalendarEvent): string;
/**
 * Generate Outlook Calendar URL
 */
declare function generateOutlookCalendarUrl(event: CalendarEvent): string;
/**
 * Get all calendar events for a trip
 */
export declare function getTripCalendarEvents(tripId: string): Promise<CalendarEvent[]>;
export declare const calendarService: {
    getTripCalendarEvents: typeof getTripCalendarEvents;
    generateICal: typeof generateICal;
    generateGoogleCalendarUrl: typeof generateGoogleCalendarUrl;
    generateOutlookCalendarUrl: typeof generateOutlookCalendarUrl;
};
export {};
//# sourceMappingURL=calendar.service.d.ts.map