# TripPlanner - Notification & Calendar System Design

## 1. Overview

This document describes the Notification System and Calendar Export features for TripPlanner.

---

## 2. Calendar Export System

### 2.1 Supported Formats

| Format | Implementation | File Extension |
|--------|---------------|----------------|
| iCal | Standard .ics format | `.ics` |
| Google Calendar | URL scheme (`https://calendar.google.com/calendar/render?action=TEMPLATE&...`) | N/A |
| Outlook | URL scheme (`https://outlook.live.com/calendar/0/deeplink/compose?subject=...`) | N/A |

### 2.2 API Endpoints

```
GET /api/trips/:tripId/calendar
  - Returns: JSON array of calendar events

GET /api/trips/:tripId/calendar.ics
  - Returns: .ics file download

GET /api/trips/:tripId/calendar/google
  - Returns: Google Calendar URL (opens in browser)

GET /api/trips/:tripId/calendar/outlook
  - Returns: Outlook Calendar URL (opens in browser)

GET /api/trips/:tripId/calendar/events/:eventId
  - Returns: Single event details for calendar
```

### 2.3 Calendar Event Data Model

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  startDate: string;      // ISO 8601
  endDate: string;        // ISO 8601
  allDay: boolean;
  type: 'activity' | 'trip_start' | 'trip_end' | 'payment_due' | 'vote_deadline';
  tripId: string;
  tripName: string;
  color?: string;          // For calendar display
}
```

### 2.4 iCal Format

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TripPlanner//EN
BEGIN:VEVENT
UID:{eventId}@tripplanner.app
DTSTAMP:{timestamp}
DTSTART:{startDate}
DTEND:{endDate}
SUMMARY:{title}
DESCRIPTION:{description}
LOCATION:{location}
END:VEVENT
END:VCALENDAR
```

### 2.5 Frontend Implementation

**UI Components:**
- Trip Overview page: "Add to Calendar" dropdown button
- Activities page: Calendar icon per activity
- Timeline page: Export options

**Dropdown Options:**
1. 📅 Download iCal (.ics)
2. 🅶 Add to Google Calendar
3. 🅾 Add to Outlook Calendar

---

## 3. Notification System

### 3.1 Notification Types

| Type | Trigger | Email | Push | In-App |
|------|---------|-------|------|--------|
| `INVITE` | Someone invites you | ✅ | ✅ | ✅ |
| `VOTE` | New vote on activity | ✅ | ✅ | ✅ |
| `ACTIVITY` | Activity confirmed/cancelled | ✅ | ✅ | ✅ |
| `PAYMENT` | Payment requested | ✅ | ✅ | ✅ |
| `PAYMENT_DUE` | Payment deadline approaching | ✅ | ✅ | ✅ |
| `PAYMENT_RECEIVED` | Someone paid you | ✅ | ✅ | ✅ |
| `MESSAGE` | New chat message | ❌ | ✅ | ✅ |
| `DM_MESSAGE` | New direct message | ❌ | ✅ | ✅ |
| `FRIEND_REQUEST` | Friend request received | ✅ | ✅ | ✅ |
| `TRIP_STARTING` | Trip starts in X days | ✅ | ✅ | ✅ |
| `VOTE_DEADLINE` | Voting ends soon | ✅ | ✅ | ✅ |
| `MILESTONE` | Trip milestone reached | ✅ | ✅ | ✅ |

### 3.2 Notification Data Model

```typescript
interface Notification {
  id: string;
  userId: string;
  tripId?: string;
  type: NotificationType;
  title: string;
  body: string;
  actionType: 'trip' | 'payment' | 'vote' | 'message' | 'friend_request' | 'dm' | 'activity';
  actionId?: string;
  actionUrl: string;          // Deep link to relevant content
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  emailSent: boolean;
  pushSent: boolean;
  createdAt: string;
  scheduledFor?: string;      // For scheduled notifications
}
```

### 3.3 Notification Preferences

```typescript
interface NotificationPreferences {
  // Channel preferences
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  
  // Type-specific preferences
  emailTripInvites: boolean;
  emailPaymentRequests: boolean;
  emailVotingReminders: boolean;
  emailTripReminders: boolean;
  emailMessages: boolean;
  emailFriendRequests: boolean;
  
  pushTripInvites: boolean;
  pushPaymentRequests: boolean;
  pushVotingReminders: boolean;
  pushTripReminders: boolean;
  pushMessages: boolean;
  pushFriendRequests: boolean;
  
  // Quiet hours
  quietHoursStart?: string;   // "22:00"
  quietHoursEnd?: string;     // "08:00"
  timezone: string;
}
```

### 3.4 Notification Actions

Every notification should provide:
1. **Primary Action**: Navigate to relevant content
2. **Secondary Action**: Mark as read
3. **Dismiss**: Remove notification
4. **Settings**: Link to notification preferences

### 3.5 Deep Link URLs

```
TripPlanner://trip/{tripId}
TripPlanner://trip/{tripId}/overview
TripPlanner://trip/{tripId}/activities
TripPlanner://trip/{tripId}/chat
TripPlanner://trip/{tripId}/payments
TripPlanner://trip/{tripId}/memories
TripPlanner://messages/{conversationId}
TripPlanner://friends
TripPlanner://settings/notifications
```

Web URLs (for email/push):
```
https://tripplanner.app/trip/{tripId}
https://tripplanner.app/trip/{tripId}/payments
https://tripplanner.app/messages/{conversationId}
https://tripplanner.app/friends
```

---

## 4. In-App Notification UI

### 4.1 Notification Bell

- Located in header/app bar
- Shows unread count badge
- Click opens notification panel

### 4.2 Notification Panel

```
┌─────────────────────────────────────┐
│ Notifications              [⚙️] [✓] │
├─────────────────────────────────────┤
│ [🔔] [📱] [✉️]                     │  <- Filter tabs
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 🟢 Pay Sarah for Dinner         │ │
│ │ You owe $25 for Dinner at Nobu  │ │
│ │ 2 minutes ago            [⋯]   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Mike voted YES on Surfing    │ │
│ │ Voting ends in 2 hours         │ │
│ │ 1 hour ago               [⋯]   │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ 🔵 Trip starts in 3 days!       │ │
│ │ Hawaii Beach Vacation           │ │
│ │ 3 hours ago             [⋯]    │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ [Mark all as read]                  │
└─────────────────────────────────────┘
```

### 4.3 Notification Item Actions

- **Click**: Navigate to actionUrl
- **Swipe Right**: Mark as read
- **Swipe Left**: Dismiss
- **⋯ Menu**: Settings, Dismiss, Mute this type

### 4.4 Notification Types Visual Indicators

| Type | Icon | Color |
|------|------|-------|
| INVITE | 📧 | Green |
| VOTE | 🗳️ | Blue |
| ACTIVITY | 📌 | Purple |
| PAYMENT | 💰 | Green |
| PAYMENT_DUE | ⚠️ | Orange |
| PAYMENT_RECEIVED | ✅ | Green |
| MESSAGE | 💬 | Blue |
| DM_MESSAGE | 💬 | Blue |
| FRIEND_REQUEST | 👋 | Green |
| TRIP_STARTING | 🌴 | Green |
| VOTE_DEADLINE | ⏰ | Orange |
| MILESTONE | 🎉 | Purple |

---

## 5. Push Notifications

### 5.1 Service Worker Integration

```typescript
// Service worker registration
async function registerPushNotifications() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    // Send subscription to server
    await api.savePushSubscription(subscription);
  }
}
```

### 5.2 Push Payload

```json
{
  "title": "New vote on Surfing Lesson",
  "body": "Mike voted YES",
  "icon": "/icons/notification-icon.png",
  "badge": "/icons/badge-icon.png",
  "tag": "vote-123",
  "data": {
    "url": "/trip/trip-1/activities",
    "notificationId": "notif-123",
    "type": "VOTE"
  },
  "actions": [
    { "action": "view", "title": "View" },
    { "action": "dismiss", "title": "Dismiss" }
  ]
}
```

---

## 6. Email Notifications

### 6.1 Email Templates

| Template | Subject | Frequency |
|----------|---------|-----------|
| Trip Invite | "You've been invited to {tripName}" | On event |
| Payment Request | "{payer} wants ${amount} for {title}" | On event |
| Vote Reminder | "Vote now: {activityName}" | 24h before deadline |
| Trip Reminder | "{tripName} starts in {days} days!" | 3 days, 1 day before |
| Friend Request | "{name} wants to be your friend" | On event |

### 6.2 Email Template Structure

```html
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: system-ui, sans-serif; }
    .header { background: #f5f5f5; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .button { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 6px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="{{logoUrl}}" alt="TripPlanner" height="40">
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>You're receiving this because you have email notifications enabled.</p>
      <p><a href="{{unsubscribeUrl}}">Manage notifications</a> | <a href="{{appUrl}}">Open TripPlanner</a></p>
    </div>
  </div>
</body>
</html>
```

---

## 7. Backend API Changes

### 7.1 New Endpoints

```
GET    /api/notifications                    # List notifications
GET    /api/notifications/:id                # Get single notification
PATCH  /api/notifications/:id                # Update notification (read, etc)
DELETE /api/notifications/:id                 # Delete notification
POST   /api/notifications/mark-all-read       # Mark all as read
POST   /api/notifications/subscribe-push       # Save push subscription
DELETE /api/notifications/unsubscribe-push    # Remove push subscription

GET    /api/trips/:tripId/calendar           # Get calendar events
GET    /api/trips/:tripId/calendar.ics        # Download iCal
GET    /api/trips/:tripId/calendar/google     # Get Google Calendar URL
GET    /api/trips/:tripId/calendar/outlook     # Get Outlook Calendar URL
```

### 7.2 Database Changes

**Add to Notifications table:**
- `email_sent BOOLEAN DEFAULT FALSE`
- `push_sent BOOLEAN DEFAULT FALSE`
- `scheduled_for TIMESTAMP (nullable)`

**New table for Push Subscriptions:**
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);
```

---

## 8. Frontend Pages

### 8.1 Notification Settings Page

Route: `/settings/notifications`

Sections:
1. **Channel Preferences**
   - Email notifications toggle
   - Push notifications toggle
   - In-app notifications toggle

2. **Notification Types**
   - Grouped by category (Trips, Payments, Social)
   - Per-type toggles

3. **Quiet Hours**
   - Start time picker
   - End time picker
   - Timezone selector

### 8.2 Notification History Page

Route: `/notifications`

Features:
- Filter by type (All, Unread, Trip, Payment, Social)
- Sort by date
- Bulk actions (mark all read)
- Pagination

---

## 9. Implementation Priority

### Phase 1: Core (This Implementation)
1. ✅ Calendar export (iCal, Google, Outlook)
2. ✅ In-app notifications (bell, panel, list)
3. ✅ Notification preferences UI
4. ✅ Backend API for notifications
5. ✅ E2E tests

### Phase 2: External Notifications
1. Push notifications (WebPush)
2. Email notifications (SendGrid)
3. Service worker setup

### Phase 3: Advanced
1. Quiet hours enforcement
2. Notification batching
3. Email template customization

---

## 10. Files to Create/Modify

### Backend
- `backend/src/routes/notifications.ts` - Extended
- `backend/src/routes/calendar.ts` - NEW
- `backend/src/services/notification.service.ts` - Enhanced
- `backend/src/services/calendar.service.ts` - NEW
- `backend/src/lib/push.ts` - NEW (WebPush)
- `backend/src/lib/email.ts` - NEW (SendGrid templates)
- `backend/prisma/schema.prisma` - Add columns

### Frontend
- `frontend/src/app/settings/notifications/page.tsx` - NEW
- `frontend/src/app/notifications/page.tsx` - NEW
- `frontend/src/components/notification-bell.tsx` - NEW
- `frontend/src/components/notification-panel.tsx` - NEW
- `frontend/src/components/notification-item.tsx` - NEW
- `frontend/src/components/calendar-export.tsx` - NEW
- `frontend/src/services/api.ts` - Add calendar methods

---

*Document Version: 1.0*
*Created: March 2026*
*Author: Project Manager + Tech Lead*
