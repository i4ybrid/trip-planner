# Timeline Engine — Feature Proposal

## Context

The app currently has an **Activity Feed** (real-time via Socket.io, ephemeral) and a **Timeline tab** (static, no content). We want to build a proper **Timeline Engine** that persists meaningful trip events and surfaces them in the Timeline tab on the trip page, as well as in an **Activity Feed** widget (e.g., in the trip sidebar or overview).

---

## Design Decisions (Final)

### 1. Invite Visibility — All Members See "X was Invited" Events

**Decision: YES** — All members see when someone is invited. This creates accountability and keeps organizers honest. Visibility is tied to membership level.

### 2. Public Timeline Access (Non-Members)

**Decision: NO** — Non-members can only see:
- Trip overview (name, dates, destination, public description)
- Trip activities (public activities list)

They CANNOT see the Timeline tab or any member-level events.

### 3. Feed Unification — Activity Feed + Timeline as One

**Decision: NO** — Keep them separate:
- **Activity Feed**: Real-time, ephemeral (socket.io), shown in sidebar/overview widget. Users can dismiss it.
- **Timeline**: Persistent, paginated, chronological record. Lives on the `/trip/[id]/timeline` tab.

### 4. Real-Time Updates

**Decision: Phase 1 = Polling** (use existing pattern in codebase). Do not implement Socket.io for timeline events in Phase 1. The Timeline tab polls for new events on mount and on visibility change.

### 5. Decline / Withdrawn Events

**Decision: YES** — Log and display:
- "X declined the invitation"
- "Y withdrew their join request"

These are meaningful signal events for organizers.

---

## Events NOT to Log

The following events are **explicitly excluded** from the timeline:
- `MEMBER_INVITED` — do not log individual invite events
- Trip status changes (IDEA→PLANNING, etc.) — no events logged for status transitions

---

## Final Event Catalog

### Member Events (Phase 1)

| Event | Trigger | Who Triggered | Who Sees It |
|-------|---------|---------------|-------------|
| `MEMBER_JOINED` | Member confirmed (accepted invite or joined OPEN trip) | The member | All members |
| `MEMBER_INVITE_DECLINED` | Invitee declines invite | The invitee | All members |
| `MEMBER_REMOVED` | Organizer removes a member | The organizer | All members |
| `MEMBER_JOIN_WITHDRAWN` | Requester withdraws their join request | The requester | All members |
| `ROLE_CHANGED` | Member promoted/demoted (ORGANIZER↔MEMBER, etc.) | The promoter | All members |
| `JOIN_REQUEST_SENT` | Member requests to join a MANAGED trip | The requester | All members |
| `JOIN_REQUEST_APPROVED` | Organizer approves a join request | The organizer | The requester + all members |
| `JOIN_REQUEST_DENIED` | Organizer denies a join request | The organizer | The requester + all members |

### Trip & Activity Events (Phase 2)

| Event | Trigger | Who Triggered | Who Sees It |
|-------|---------|---------------|-------------|
| `TRIP_CREATED` | Trip created | Creator | All members |
| `TRIP_DATES_CHANGED` | Start/end dates updated | Organizer | All members |
| `TRIP_LOCATION_CHANGED` | Destination updated | Organizer | All members |
| `SETTLEMENT_COMPLETED` | All payments settled | System | All members |
| `PAYMENT_CONFIRMED` | A BillSplitMember payment confirmed | Creator | All members |
| `ACTIVITY_ADDED` | New activity added to trip | Any member | All members |
| `MILESTONE_COMPLETED` | A milestone reached | System | All members |

---

## Prisma Schema

```prisma
model TripTimelineEvent {
  id          String   @id @default(cuid())
  tripId      String
  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  eventType   String   // e.g., "MEMBER_JOINED", "TRIP_CREATED"
  metadata    Json?    // { memberId, role, amount, activityId, ... }

  // Actor = who triggered the event (null for system events)
  actorId     String?
  actor       User?    @relation(fields: [actorId], references: [id])

  createdAt   DateTime @default(now())

  @@index([tripId, createdAt])
  @@index([tripId, eventType])
}
```

---

## Backend

### emitTimelineEvent(tripId, eventType, metadata?, actorId?)

Centralized service function that:
1. Creates a `TripTimelineEvent` record
2. Returns the created event

### Service Method Emitters (Phase 1)

| Service | Method | Event Emitted |
|---------|--------|---------------|
| `tripMember.service.ts` | `confirmJoin()` | `MEMBER_JOINED` |
| `tripMember.service.ts` | `declineInvite()` | `MEMBER_INVITE_DECLINED` |
| `tripMember.service.ts` | `removeMember()` | `MEMBER_REMOVED` |
| `tripMember.service.ts` | `withdrawJoinRequest()` | `MEMBER_JOIN_WITHDRAWN` |
| `tripMember.service.ts` | `updateRole()` | `ROLE_CHANGED` |
| `tripMember.service.ts` | `createJoinRequest()` | `JOIN_REQUEST_SENT` |
| `tripMember.service.ts` | `approveJoinRequest()` | `JOIN_REQUEST_APPROVED` |
| `tripMember.service.ts` | `denyJoinRequest()` | `JOIN_REQUEST_DENIED` |

**Phase 2 emitters:**
| Service | Method | Event Emitted |
|---------|--------|---------------|
| `trip.service.ts` | `create()` | `TRIP_CREATED` |
| `trip.service.ts` | `updateDates()` | `TRIP_DATES_CHANGED` |
| `trip.service.ts` | `updateLocation()` | `TRIP_LOCATION_CHANGED` |
| `settlement.service.ts` | `complete()` | `SETTLEMENT_COMPLETED` |
| `payment.service.ts` | `confirmPayment()` | `PAYMENT_CONFIRMED` |
| `activity.service.ts` | `create()` | `ACTIVITY_ADDED` |
| `milestone.service.ts` | `complete()` | `MILESTONE_COMPLETED` |

### API Endpoints

```
GET  /api/trips/:tripId/timeline?cursor=&limit=20  → { events[], nextCursor }
GET  /api/trips/:tripId/timeline/event-types         → { eventTypes[] }  (for filters)
```

---

## Frontend

### Timeline Tab Page

`frontend/src/app/trip/[id]/timeline/page.tsx`

- Polls `GET /api/trips/:tripId/timeline` on mount + on `visibilitychange`
- Renders `<TimelineEventCard>` list (newest first)
- Infinite scroll (load more on scroll-to-bottom)
- Filter bar: "All" | "Members" | "Activities" | "Payments"

### TimelineEventCard Component

Each event card shows:
- **Icon**: per-event-type icon (see below)
- **Primary text**: "{Actor} {action} {target}" e.g., "Alex declined the invitation"
- **Timestamp**: relative ("2h ago") + absolute on hover
- **Metadata**: e.g., new role on ROLE_CHANGED, amount on PAYMENT_CONFIRMED

### Event Icons (suggested)

| Event | Icon |
|-------|------|
| `MEMBER_JOINED` | 👤 + |
| `MEMBER_INVITE_DECLINED` | 🚪👤 |
| `MEMBER_REMOVED` | 🚫 |
| `MEMBER_JOIN_WITHDRAWN` | 🔙 |
| `ROLE_CHANGED` | ⭐ |
| `JOIN_REQUEST_SENT` | 📩 |
| `JOIN_REQUEST_APPROVED` | ✅ |
| `JOIN_REQUEST_DENIED` | ❌ |
| `TRIP_CREATED` | 🎉 |
| `TRIP_DATES_CHANGED` | 📅 |
| `TRIP_LOCATION_CHANGED` | 📍 |
| `SETTLEMENT_COMPLETED` | 🏁 |
| `PAYMENT_CONFIRMED` | 💰 |
| `ACTIVITY_ADDED` | 🎯 |
| `MILESTONE_COMPLETED` | 🏆 |

---

## Phases

### Phase 1: Member Events Only
- `TripTimelineEvent` Prisma model
- `emitTimelineEvent()` service
- Backend: wire all member-event emitters in `tripMember.service.ts`
- `GET /api/trips/:tripId/timeline` endpoint
- Frontend: Timeline tab with polling, event cards, no filters

### Phase 2: Trip & Activity Events
- Wire remaining emitters in trip/activity/settlement/payment/milestone services
- Add filter bar (All | Members | Activities | Payments)
- Add metadata rendering (amounts, activity names, etc.)

---

## Open Questions (RESOLVED)

1. ✅ Invite visibility — all members see invite events
2. ✅ Non-members — no timeline access
3. ✅ Feed unification — keep separate
4. ✅ Real-time — Phase 1 polling only
5. ✅ Decline/withdrawn events — include both
