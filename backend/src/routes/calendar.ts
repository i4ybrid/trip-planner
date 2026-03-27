import { Router } from 'express';
import { authMiddleware } from '@/middleware/auth';
import { calendarService } from '@/services/calendar.service';

const router = Router();

/**
 * GET /api/trips/:tripId/calendar
 * Get calendar events for a trip as JSON
 */
router.get('/trips/:tripId/calendar', authMiddleware, async (req: any, res: any) => {
  try {
    const { tripId } = req.params;
    
    const events = await calendarService.getTripCalendarEvents(tripId);
    
    res.json({ data: events });
  } catch (error: any) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch calendar events' });
  }
});

/**
 * GET /api/trips/:tripId/calendar.ics
 * Download calendar events as iCal file
 */
router.get('/trips/:tripId/calendar.ics', authMiddleware, async (req: any, res: any) => {
  try {
    const { tripId } = req.params;
    
    const events = await calendarService.getTripCalendarEvents(tripId);
    const icsContent = calendarService.generateICal(events);
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="trip-calendar-${tripId}.ics"`);
    res.send(icsContent);
  } catch (error: any) {
    console.error('Error generating iCal:', error);
    res.status(500).json({ error: error.message || 'Failed to generate iCal file' });
  }
});

/**
 * GET /api/trips/:tripId/calendar/google
 * Get Google Calendar URL for trip events
 */
router.get('/trips/:tripId/calendar/google', authMiddleware, async (req: any, res: any) => {
  try {
    const { tripId } = req.params;
    
    const events = await calendarService.getTripCalendarEvents(tripId);
    
    if (events.length === 0) {
      return res.json({ data: { url: null, message: 'No events to add' } });
    }
    
    // For multiple events, create individual URLs or a combined approach
    // Google Calendar supports single events via URL, so we'll return the first event's URL
    // For full calendar integration, a browser redirect approach is needed
    const firstEvent = events[0];
    const googleUrl = calendarService.generateGoogleCalendarUrl(firstEvent);
    
    res.json({ 
      data: { 
        url: googleUrl,
        eventCount: events.length,
        message: `Add ${events.length} event(s) to Google Calendar`
      } 
    });
  } catch (error: any) {
    console.error('Error generating Google Calendar URL:', error);
    res.status(500).json({ error: error.message || 'Failed to generate Google Calendar link' });
  }
});

/**
 * GET /api/trips/:tripId/calendar/outlook
 * Get Outlook Calendar URL for trip events
 */
router.get('/trips/:tripId/calendar/outlook', authMiddleware, async (req: any, res: any) => {
  try {
    const { tripId } = req.params;
    
    const events = await calendarService.getTripCalendarEvents(tripId);
    
    if (events.length === 0) {
      return res.json({ data: { url: null, message: 'No events to add' } });
    }
    
    const firstEvent = events[0];
    const outlookUrl = calendarService.generateOutlookCalendarUrl(firstEvent);
    
    res.json({ 
      data: { 
        url: outlookUrl,
        eventCount: events.length,
        message: `Add ${events.length} event(s) to Outlook Calendar`
      } 
    });
  } catch (error: any) {
    console.error('Error generating Outlook Calendar URL:', error);
    res.status(500).json({ error: error.message || 'Failed to generate Outlook Calendar link' });
  }
});

/**
 * GET /api/trips/:tripId/calendar/events/:eventId
 * Get a single calendar event
 */
router.get('/trips/:tripId/calendar/events/:eventId', authMiddleware, async (req: any, res: any) => {
  try {
    const { tripId, eventId } = req.params;
    
    const events = await calendarService.getTripCalendarEvents(tripId);
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({ data: event });
  } catch (error: any) {
    console.error('Error fetching calendar event:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch calendar event' });
  }
});

/**
 * GET /api/trips/:tripId/calendar/events/:eventId/ics
 * Download single event as iCal
 */
router.get('/trips/:tripId/calendar/events/:eventId/ics', authMiddleware, async (req: any, res: any) => {
  try {
    const { tripId, eventId } = req.params;
    
    const events = await calendarService.getTripCalendarEvents(tripId);
    const event = events.find(e => e.id === eventId);
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const icsContent = calendarService.generateICal([event]);
    
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.id}.ics"`);
    res.send(icsContent);
  } catch (error: any) {
    console.error('Error generating iCal:', error);
    res.status(500).json({ error: error.message || 'Failed to generate iCal file' });
  }
});

export default router;
