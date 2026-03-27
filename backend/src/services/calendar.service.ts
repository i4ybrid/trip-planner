import prisma from '@/lib/prisma';

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
function generateICal(events: CalendarEvent[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripPlanner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const event of events) {
    const startDate = event.allDay 
      ? event.startDate.split('T')[0].replace(/-/g, '')
      : event.startDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const endDate = event.allDay
      ? event.endDate.split('T')[0].replace(/-/g, '')
      : event.endDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const uid = `${event.id}@tripplanner.app`;
    
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${timestamp}`);
    lines.push(`DTSTART${event.allDay ? ';VALUE=DATE' : ''}:${startDate}`);
    lines.push(`DTEND${event.allDay ? ';VALUE=DATE' : ''}:${endDate}`);
    lines.push(`SUMMARY:${escapeICalText(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICalText(event.description)}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICalText(event.location)}`);
    }
    
    // Add trip name to description
    lines.push(`DESCRIPTION;ALTREP="TripPlanner:${event.tripName}":Trip: ${event.tripName}`);
    
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate Google Calendar URL
 */
function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${event.startDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}/${event.endDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
  });
  
  if (event.description) {
    params.append('details', event.description);
  }
  if (event.location) {
    params.append('location', event.location);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook Calendar URL
 */
function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const startDate = event.startDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endDate = event.endDate.replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  
  const params = new URLSearchParams({
    subject: event.title,
    startdt: startDate,
    enddt: endDate,
    body: event.description || '',
    location: event.location || '',
  });
  
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Get all calendar events for a trip
 */
export async function getTripCalendarEvents(tripId: string): Promise<CalendarEvent[]> {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      activities: {
        where: {
          startTime: { not: null },
        },
      },
    },
  });

  if (!trip) {
    return [];
  }

  const events: CalendarEvent[] = [];

  // Add trip start event
  if (trip.startDate) {
    events.push({
      id: `${tripId}-start`,
      title: `${trip.name} starts`,
      description: `Your trip "${trip.name}" begins today!`,
      startDate: trip.startDate.toISOString(),
      endDate: trip.startDate.toISOString(),
      allDay: true,
      type: 'trip_start',
      tripId: trip.id,
      tripName: trip.name,
      color: '#22c55e', // green
    });
  }

  // Add trip end event
  if (trip.endDate) {
    events.push({
      id: `${tripId}-end`,
      title: `${trip.name} ends`,
      description: `Your trip "${trip.name}" ends today.`,
      startDate: trip.endDate.toISOString(),
      endDate: trip.endDate.toISOString(),
      allDay: true,
      type: 'trip_end',
      tripId: trip.id,
      tripName: trip.name,
      color: '#ef4444', // red
    });
  }

  // Add activity events
  for (const activity of trip.activities) {
    if (activity.startTime) {
      const endTime = activity.endTime || new Date(activity.startTime.getTime() + 2 * 60 * 60 * 1000);
      
      events.push({
        id: activity.id,
        title: activity.title,
        description: activity.description || undefined,
        location: activity.location || undefined,
        startDate: activity.startTime.toISOString(),
        endDate: endTime.toISOString(),
        allDay: false,
        type: 'activity',
        tripId: trip.id,
        tripName: trip.name,
        color: getCategoryColor(activity.category),
      });
    }
  }

  return events;
}

/**
 * Get color based on activity category
 */
function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    accommodation: '#8b5cf6', // purple
    excursion: '#f59e0b', // amber
    restaurant: '#ef4444', // red
    transport: '#3b82f6', // blue
    activity: '#22c55e', // green
    other: '#6b7280', // gray
  };
  return colors[category] || colors.other;
}

export const calendarService = {
  getTripCalendarEvents,
  generateICal,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
};
