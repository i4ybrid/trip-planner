# API Reference

> Extracted from DESIGN.md Section 4. Complete REST API documentation for TripPlanner.

**Base URL:** `http://localhost:4000/api` (development)
**Auth:** Bearer token (JWT via NextAuth)

---

## Authentication

```
POST   /api/auth/[...nextauth]    NextAuth handlers
GET    /api/auth/session          Get current session
POST   /api/auth/signout          Sign out
```

---

## Users

```
GET    /api/users/me              Get current user profile
PATCH  /api/users/me              Update profile (name, avatar, payment handles)
POST   /api/users/me/avatar       Upload profile photo
DELETE /api/users/me/avatar       Remove profile photo
GET    /api/users/:id             Get user by ID (public info only)
```

### Update Profile
```
PATCH /api/users/me
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Sarah Chen",
  "phone": "+1-555-123-4567",
  "venmo": "@sarah-chen",
  "paypal": "sarah@example.com",
  "zelle": "555-123-4567",
  "cashapp": "$sarahchen"
}

Response (200 OK):
{
  "data": {
    "id": "user-123",
    "name": "Sarah Chen",
    "email": "sarah@example.com",
    "avatarUrl": "http://localhost:4000/uploads/avatar.jpg",
    "venmo": "@sarah-chen",
    ...
  }
}
```

---

## Trips

```
GET    /api/trips                 List user's trips
POST   /api/trips                 Create new trip
GET    /api/trips/:id             Get trip details
PATCH  /api/trips/:id             Update trip (name, dates, status)
DELETE /api/trips/:id             Delete trip
POST   /api/trips/:id/status      Change trip status
GET    /api/trips/:id/timeline    Get trip history log

GET    /api/trips/:id/calendar         Get calendar events
GET    /api/trips/:id/calendar.ics    Download iCal file
GET    /api/trips/:id/calendar/google  Get Google Calendar URL
GET    /api/trips/:id/calendar/outlook Get Outlook calendar URL
```

### Create Trip
```
POST /api/trips
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Hawaii Beach Trip",
  "description": "Annual friends trip",
  "destination": "Honolulu, Hawaii",
  "startDate": "2026-07-01T00:00:00Z",
  "endDate": "2026-07-07T00:00:00Z",
  "style": "OPEN"              // OPEN | MANAGED
}

Response (201 Created):
{
  "data": {
    "id": "trip-123",
    "name": "Hawaii Beach Trip",
    "status": "IDEA",
    "style": "OPEN",
    "tripMasterId": "user-123",
    ...
  }
}
```

### Change Trip Status
```
POST /api/trips/:id/status
Authorization: Bearer <token>

{ "status": "PLANNING" }   // IDEA→PLANNING triggers auto-milestone generation

Response (200 OK):
{ "data": { "id": "trip-123", "status": "PLANNING", "autoMilestonesGenerated": true } }
```

---

## Trip Members

```
GET    /api/trips/:id/members           List trip members
POST   /api/trips/:id/members            Add member (by user ID)
PATCH  /api/trips/:id/members/:userId   Update member role/status
DELETE /api/trips/:id/members/:userId   Remove member
```

### Add Member
```
POST /api/trips/:id/members
Authorization: Bearer <token>

{ "userId": "user-456" }

Response (201 Created):
{ "data": { "id": "member-789", "tripId": "trip-123", "userId": "user-456", "role": "MEMBER", "status": "CONFIRMED" } }
```

### Update Member Role
```
PATCH /api/trips/:id/members/:userId
Authorization: Bearer <token>

{ "role": "ORGANIZER" }  // MASTER, ORGANIZER, MEMBER, VIEWER
// or
{ "status": "REMOVED" }

Response (200 OK):
{ "data": { "id": "member-789", "role": "ORGANIZER" } }
```

---

## Invites

```
GET    /api/trips/:id/invites     List invites for trip
POST   /api/trips/:id/invites     Create invite
GET    /api/invites/pending        Get pending invites for current user
GET    /api/invites/:token         Accept invite (public)
POST   /api/invites/:token/accept Accept invite
POST   /api/invites/:token/decline Decline invite
DELETE /api/invites/:id           Revoke invite
```

### Create Invite
```
POST /api/trips/:id/invites
Authorization: Bearer <token>

{
  "email": "friend@example.com"   // optional
}

Response (201 Created):
{
  "data": {
    "id": "invite-123",
    "token": "uuid-invite-token",
    "code": "Hawaii2026",         // short shareable code
    "url": "https://tripplanner.app/invite/Hawaii2026",
    "expiresAt": "2026-04-01T00:00:00Z"
  }
}
```

### Accept/Decline Invite (Public)
```
GET /api/invites/:token
Response (200 OK):
{
  "data": {
    "trip": { "id": "trip-123", "name": "Hawaii Trip", ... },
    "invite": { "status": "PENDING", "expiresAt": "..." },
    "tripStyle": "OPEN"            // OPEN or MANAGED
  }
}

POST /api/invites/:token/accept
Response (200 OK): Redirects to trip dashboard

POST /api/invites/:token/decline
Response (200 OK): { "data": { "status": "DECLINED" } }
```

---

## Activities

```
GET    /api/trips/:id/activities  List activities
POST   /api/trips/:id/activities  Propose activity
PATCH  /api/activities/:id        Update activity
DELETE /api/activities/:id        Remove activity
```

### Propose Activity
```
POST /api/trips/:id/activities
Authorization: Bearer <token>

{
  "title": "Surfing Lessons",
  "description": "Beginner-friendly group lesson",
  "location": "Waikiki Beach",
  "startTime": "2026-07-02T10:00:00Z",
  "endTime": "2026-07-02T12:00:00Z",
  "cost": 150.00,
  "currency": "USD",
  "category": "excursion"    // accommodation, excursion, restaurant, transport, activity, other
}

Response (201 Created):
{ "data": { "id": "activity-123", "title": "Surfing Lessons", ... } }
```

---

## Voting

```
GET    /api/activities/:id/votes   Get votes for activity
POST   /api/activities/:id/votes   Cast vote  { "option": "YES" | "NO" | "MAYBE" }
DELETE /api/activities/:id/votes   Remove vote
```

---

## Messages (Trip Chat & DMs)

**Trip Messages:**
```
GET    /api/trips/:id/messages           Get trip chat history (paginated)
POST   /api/trips/:id/messages           Send trip message
PATCH  /api/messages/:id                 Edit message
DELETE /api/messages/:id                 Delete message (soft delete)
POST   /api/messages/:id/reactions       Add/remove emoji reaction
POST   /api/messages/:id/read            Mark message as read
```

**Pagination Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 30 | Number of messages (max: 100) |
| `before` | ISO 8601 | — | Fetch messages older than this timestamp |

```
GET /api/trips/:id/messages?limit=30&before=2026-02-28T12:00:00Z

Response:
{
  "data": [
    {
      "id": "msg-123",
      "tripId": "trip-456",
      "senderId": "user-789",
      "content": "Hello everyone!",
      "messageType": "TEXT",
      "mentions": [],
      "reactions": {"👍": ["user-1"]},
      "sender": { "id": "user-789", "name": "John Doe", "avatarUrl": "..." },
      "createdAt": "2026-02-28T10:30:00Z"
    }
  ]
}
```

**Send Message:**
```
POST /api/trips/:id/messages
Authorization: Bearer <token>

{
  "content": "Can't wait for this trip!",
  "mentions": ["user-456", "user-789"],   // optional
  "messageType": "TEXT"                    // TEXT | IMAGE | VIDEO | SYSTEM
}

Response (201 Created):
{ "data": { "id": "msg-124", ... } }
```

**Add Reaction:**
```
POST /api/messages/:id/reactions
{ "emoji": "👍" }
```

---

## Direct Messages

```
GET    /api/dm/conversations              List DM conversations
POST   /api/dm/conversations              Start new DM conversation
GET    /api/dm/conversations/:id          Get DM messages (paginated)
POST   /api/dm/conversations/:id/messages Send DM message
PATCH  /api/dm/messages/:id              Edit DM
DELETE /api/dm/messages/:id               Delete DM
POST   /api/dm/messages/:id/reactions     Add/remove emoji reaction
```

### Start DM Conversation
```
POST /api/dm/conversations
{ "participantId": "user-456" }

Response (201 Created):
{ "data": { "id": "conv-123", "participant1": "user-me", "participant2": "user-456" } }
```

---

## Media

```
GET    /api/trips/:id/media       List media items
POST   /api/trips/:id/media       Upload media (multipart/form-data)
DELETE /api/media/:id             Delete media
```

### Upload Media
```
POST /api/trips/:tripId/media
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <binary>
caption: "Sunset at the beach"   // optional

Response (201 Created):
{
  "data": {
    "id": "media-123",
    "type": "image",
    "url": "http://localhost:4000/uploads/abc-123.webp",
    "caption": "Sunset at the beach",
    "createdAt": "2026-02-25T10:30:00Z"
  }
}
```

**File limits:** 50MB per file. Images compressed to WebP on backend.

---

## Friends

```
GET    /api/friends               List friends
POST   /api/friends               Add friend (by user ID)  { "friendId": "user-123" }
DELETE /api/friends/:id           Remove friend
GET    /api/friend-requests       List pending requests
POST   /api/friend-requests       Send friend request  { "receiverId": "user-123" }
PATCH  /api/friend-requests/:id   Accept/decline  { "status": "ACCEPTED" | "DECLINED" }
DELETE /api/friend-requests/:id   Cancel request
```

---

## Payments (BillSplits)

```
GET    /api/trips/:id/payments     List bill splits
POST   /api/trips/:id/payments     Create bill split
GET    /api/payments/:id           Get bill split details
PATCH  /api/payments/:id           Update bill split
DELETE /api/payments/:id          Delete bill split

GET    /api/payments/:id/members   Get members & their split amounts
POST   /api/payments/:id/members/:userId/paid   Mark member as paid
DELETE /api/payments/:id/members/:userId         Remove member from bill split
POST   /api/payments/:id/confirm   Confirm payment received (by payer)
```

### Create Bill Split
```
POST /api/trips/:tripId/payments
Authorization: Bearer <token>

{
  "title": "Dinner at Nobu",
  "description": "Amazing sushi dinner",
  "amount": 250.00,
  "splitType": "EQUAL",           // EQUAL | SHARES | PERCENTAGE | MANUAL
  "paidBy": "user-123",           // User who paid
  "dueDate": "2026-03-01T00:00:00Z",
  "members": [                    // Optional: specify member splits on create
    { "userId": "user-123", "dollarAmount": 125.00 },
    { "userId": "user-456", "dollarAmount": 125.00 }
  ]
}

Response (201 Created):
{ "data": { "id": "bill-123", "title": "Dinner at Nobu", "status": "PENDING", ... } }
```

### Update Bill Split
```
PATCH /api/payments/:id
// Any combination of: title, description, amount, paidBy, splitType, members[]
// Note: members[] replaces ALL existing member splits

{ "splitType": "SHARES", "members": [{ "userId": "user-123", "shares": 2 }] }
```

### Mark Member as Paid
```
POST /api/payments/:id/members/:userId/paid
{
  "paymentMethod": "VENMO",       // VENMO | PAYPAL | ZELLE | CASHAPP | CASH | OTHER
  "transactionId": "abc123"       // optional
}

Response (200 OK):
{ "data": { "userId": "user-456", "status": "PAID", "paymentMethod": "VENMO", "paidAt": "..." } }
```

### Confirm Payment Received
```
POST /api/payments/:id/confirm
Response (200 OK): { "data": { "id": "bill-123", "status": "CONFIRMED" } }
```

---

## Timeline

```
GET /api/trips/:id/timeline     Get trip history log (events that happened)

Response:
{
  "data": [
    {
      "id": "event-123",
      "tripId": "trip-456",
      "eventType": "member_joined",
      "description": "Sarah Chen joined the trip",
      "createdBy": "user-789",
      "createdAt": "2026-02-20T10:00:00Z"
    }
  ]
}
```

---

## Notifications

```
GET    /api/notifications                      List user's notifications (paginated)
GET    /api/notifications/:id                Get single notification
PATCH  /api/notifications/:id                Mark as read
DELETE /api/notifications/:id                Delete notification
POST   /api/notifications/mark-all-read      Mark all as read
POST   /api/notifications/subscribe-push     Subscribe to push notifications
DELETE /api/notifications/unsubscribe-push   Unsubscribe from push notifications
```

### List Notifications
```
GET /api/notifications?limit=20&before=2026-02-28T12:00:00Z

Response:
{
  "data": [
    {
      "id": "notif-123",
      "type": "TRIP_INVITE",
      "title": "You've been invited to Hawaii Trip",
      "body": "Sarah Chen invited you to join",
      "read": false,
      "actionType": "invite",
      "actionId": "invite-token-xyz",
      "actionUrl": "/invites/pending",
      "tripId": "trip-456",
      "createdAt": "2026-02-28T10:00:00Z"
    }
  ]
}
```

### Mark as Read
```
PATCH /api/notifications/:id
Response (200 OK): { "data": { "id": "notif-123", "read": true } }
```

### Mark All as Read
```
POST /api/notifications/mark-all-read
Response (200 OK): { "data": { "count": 5 } }
```

### Push Subscription
```
POST /api/notifications/subscribe-push
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": { "p256dh": "...", "auth": "..." }
  }
}

DELETE /api/notifications/unsubscribe-push
```

---

## WebSocket Events

### Connection
Client connects with auth token. Server validates and joins user to their personal room.

### Event Reference

#### Notification Events
- `notification:new` — `{ notification: {...} }` — sent to user room when a new notification is created

#### Message Events
- `message:new` — `{ message: {...} }` — sent to trip room when a chat message is sent
- `message:edit` — `{ messageId, content }` — sent to trip room when a message is edited
- `message:delete` — `{ messageId }` — sent to trip room when a message is deleted

#### Friend Events
- `friend:request` — `{ fromUserId, toUserId }` — sent to user room
- `friend:accepted` — `{ fromUserId, toUserId }` — sent to user room
- `friend:declined` — `{ fromUserId, toUserId }` — sent to user room

#### Timeline Events (trip room)
- `timeline:event` — `{ eventType, actorId, targetId, metadata, createdAt }` — sent to `trip:${tripId}` room
- Event types: `MEMBER_JOINED`, `MEMBER_INVITE_DECLINED`, `MEMBER_REMOVED`, `ROLE_CHANGED`, `JOIN_REQUEST_SENT`, `JOIN_REQUEST_APPROVED`, `JOIN_REQUEST_DENIED`, `ACTIVITY_PROPOSED`, `ACTIVITY_CONFIRMED`, `VOTE_CAST`, `VOTE_RETACTED`

### Rooms
- `user:${userId}` — personal notifications, messages, friend events
- `trip:${tripId}` — all trip-scoped events (messages, timeline)

---

## Settings

```
GET    /api/settings               Get user settings
PATCH  /api/settings               Update settings
POST   /api/settings/password      Change password
```

### Update Settings
```
PATCH /api/settings
{
  "friendRequestSource": "TRIP_MEMBERS",
  "emailTripInvites": true,
  "pushPaymentRequests": false,
  ...
}
```

---

## Milestones

```
POST   /api/trips/:id/milestones              Create milestone (manual)
GET    /api/trips/:id/milestones              List milestones
PATCH  /api/milestones/:id                    Update milestone (date, lock, skip)
POST   /api/trips/:id/milestones/actions      Trigger on-demand action
GET    /api/trips/:id/milestones/progress     Get member progress
POST   /api/trips/:id/milestones/generate-default  Generate default milestones
```

### Create Milestone
```
POST /api/trips/:id/milestones
{
  "name": "Booking Deadline",
  "type": "CUSTOM",              // only CUSTOM can be manually created
  "dueDate": "2026-03-15T00:00:00Z",
  "isHard": true,
  "priority": 5
}

Response (201 Created):
{ "data": { "id": "ms-123", "name": "Booking Deadline", "type": "CUSTOM", ... } }
```

### Generate Default Milestones
```
POST /api/trips/:id/milestones/generate-default
// Uses TODAY as baseline (not trip creation date)
// Requires: MASTER or ORGANIZER role
// Requires: trip must have a startDate

Response (201 Created):
{ "data": [{ "id": "ms-1", "type": "COMMITMENT_REQUEST", ... }, ...] }
```

### Update Milestone
```
PATCH /api/milestones/:id
// Any combination of: name (CUSTOM only), dueDate, isLocked, isSkipped, isHard, priority

{ "isSkipped": true }
```

### Trigger On-Demand Action
```
POST /api/trips/:id/milestones/actions
{
  "actionType": "PAYMENT_REQUEST",       // PAYMENT_REQUEST | SETTLEMENT_REMINDER
  "milestoneId": "ms-123",
  "recipientIds": ["user-456", "user-789"],  // or omit for all
  "message": "Please send payment ASAP"
}
```

### Get Milestone Progress
```
GET /api/trips/:id/milestones/progress

Response:
{
  "data": [
    {
      "milestoneId": "ms-123",
      "totalMembers": 4,
      "completedCount": 2,
      "completions": [
        { "userId": "user-123", "status": "COMPLETED", "completedAt": "..." },
        { "userId": "user-456", "status": "COMPLETED", "completedAt": "..." }
      ]
    }
  ]
}
```

---

*Extracted from DESIGN.md Section 4 — API Endpoints*
*For the complete technical design, see [DESIGN.md](../DESIGN.md)*
