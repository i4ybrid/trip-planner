# TripPlanner — Technical Design

> **📚 Detailed Docs:** [DATABASE.md](./docs/DATABASE.md) · [API.md](./docs/API.md) · [USE_CASES.md](./docs/USE_CASES.md) · [TEST_CASES.md](./docs/TEST_CASES.md)

---

## Overview

Collaborative trip planning app for groups. Tech: Next.js 14 · Express · PostgreSQL/Prisma · Socket.io · NextAuth.js · Vitest · Playwright

### Trip Status Flow

```
IDEA ────→ PLANNING ────→ CONFIRMED ────→ HAPPENING ────→ COMPLETED
  │            │              │               │
  └────────────┴──────────────┴───────────────┴───→ CANCELLED
```

**Valid Transitions (enforced server-side):**
| From | Allowed Next States |
|------|---------------------|
| `IDEA` | `PLANNING`, `CANCELLED` |
| `PLANNING` | `CONFIRMED`, `CANCELLED` |
| `CONFIRMED` | `HAPPENING`, `CANCELLED` |
| `HAPPENING` | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | _(terminal — no transitions)_ |
| `CANCELLED` | _(terminal — no transitions)_ |

**Role Requirement:** Only `MASTER` and `ORGANIZER` can change a trip's status. The `POST /api/trips/:id/status` endpoint calls `checkMemberPermission(tripId, userId, ['MASTER', 'ORGANIZER'])` before allowing the transition.

**Endpoint:** `POST /api/trips/:id/status` — accepts `{ status: 'NEW_STATUS' }`

**Service:** `tripService.changeTripStatus(tripId, newStatus)` validates the transition against `VALID_TRANSITIONS`, creates a `status_changed` timeline event, and (for `IDEA → PLANNING`) auto-generates default milestones if the trip has a `startDate`. Each auto-generated milestone is written to the timeline via the write-through pattern (see Timeline section).

**Note on BillSplits:** The BillSplits payment flow (Create → Members mark PAID → Creator confirms → CONFIRMED) is a **per-expense BillSplit status**, not a trip-level status. BillSplits track individual expense settlement state independently of where the trip is in its lifecycle.

### Member Roles
`MASTER` (full) · `ORGANIZER` (manage) · `MEMBER` (vote/chat) · `VIEWER` (view)

**Invite acceptance flow:** When a user is invited to a trip, they are created with the `VIEWER` role — read-only access. When they accept the invitation, they are promoted from `VIEWER` → `MEMBER`, gaining full trip access (voting, chat, expenses, etc.).

**Invite button visibility:**
- For `OPEN` trips: the invite button is shown only to users who are already members of the trip.
- For `CLOSED` trips: the invite button is shown only to users with `MASTER` or `ORGANIZER` role.

### Invite Flow

There are two paths for inviting someone to a trip:

**Path 1 — Email Invite (new or existing user):**
1. Organizer fills in an email address in the invite modal (or selects a friend) and clicks "Invite"
2. `POST /api/trips/:tripId/invites/email` is called, which:
   - Creates a pending `Invite` record (status: `PENDING`)
   - Sends a notification to the invitee with a link to `/invites/pending`
   - Does **not** create any `TripMember` record at this stage
3. Invitee receives the notification → navigates to `/invites/pending`
4. Invitee clicks **Accept** → `acceptInvite()` is called server-side:
   - Creates `TripMember` with role `VIEWER`
   - Immediately promotes role to `MEMBER`
   - Marks invite as `ACCEPTED`
5. Invitee clicks **Reject** → `declineInvite()` marks invite as `DECLINED`, no `TripMember` is created

**Path 2 — Join Code (OPEN trips only):**
1. User visits `/invites/code/[code]` for an `OPEN` trip with no login required
2. `POST /invites/code/use` creates them directly as `MEMBER` (no pending invite step)

**Key invariants:**
- No user is ever added as `MEMBER` without going through the accept flow (except Path 2 for OPEN trips)
- A user cannot be invited twice to the same trip (pending invite must be resolved first)
- Confirmed members cannot be re-invited

### Trip Styles
`OPEN` — join immediately · `MANAGED` — requires approval

### Trip Date/Time Defaults

Trip `startTime` and `endTime` are optional at creation:

- If omitted at creation: `startTime` defaults to `12:00 AM`, `endTime` defaults to `11:59 PM`
- Frontend uses `normalizeDateForSubmit()` to prepare dates before API calls
- Backend uses `normalizeDate()` to normalize incoming dates (fills in defaults for missing time components)

---

## Pages
| Route | Tab |
|-------|-----|
| `/trip/[id]/overview` | Overview (default) — displays trip details, member list, activities, and expense summary. (Note: milestones are shown in Timeline tab, not Overview.) |
| `/trip/[id]/activities` | Activities & voting |
| `/trip/[id]/timeline` | Timeline tab. Shows 10 most-recent past + all upcoming events from `timeline-summary` endpoint. Toggle to History view. |
| `/trip/[id]/history` | History tab. Full chronological event log (all events, oldest-first) from `timeline` endpoint. Filterable by event kind. |
| `/trip/[id]/chat` | Group chat |
| `/trip/[id]/payments` | Expenses & settlements |
| `/trip/[id]/memories` | Photos/videos |
| `/invites/pending` | Pending invitations — displays outstanding trip invitations for the logged-in user, with a badge showing the total invitation count. Accepting an invitation promotes the user from `VIEWER` → `MEMBER`. |

---

## Real-time Events (WebSocket)

TripPlanner uses Socket.io for real-time event delivery:

- **Connection**: Authenticated via session token on connect
- **Rooms**: Each user joins `user:${userId}` room. Each trip has a `trip:${tripId}` room
- **Notification bell**: The notification bell in the UI displays an unread count badge when there are unread notifications. New notifications appear in the dropdown in real-time via WebSocket — when the user opens the dropdown, unread notifications are automatically marked as read.
- **Notification push**: Notifications created server-side are pushed to the user's room immediately
- **Chat**: Messages are pushed to the trip room in real-time when sent
- **Timeline**: Trip-scoped events (votes, proposals, member changes) are pushed to the trip room

## Timeline

The timeline is a unified, authoritative log of everything that happens on a trip — member events, activity milestones, payment events, and trip status changes. It is the canonical source for the Timeline and History views.

### Architecture — Three Layers

| Layer | What | Driven by |
|-------|------|----------|
| **Source tables** | `timeline_events`, `milestones`, `activities` | Real actions (user creates activity, member joins, etc.) |
| **Timeline canonical store** | `timeline_events` (all events including milestone inserts) | Written to on milestone/activity create/delete |
| **UI subset cache** | `TripTimelineUIState.cachedEventIds` | Invalidated on any event; recalculated on first UI fetch |

### Data Model

#### `TimelineEvent` — Redesigned (2026-03-31)

```prisma
enum TimelineEventKind {
  EVENT            // Original trip event (member joined, activity added, etc.)
  MILESTONE        // Represents a milestone on the timeline
  ACTIVITY_START   // Activity start (all activities — startTime)
  ACTIVITY_END     // Activity end (accommodations only — endTime)
}

model TimelineEvent {
  id            String             @id @default(cuid())
  tripId        String
  kind          TimelineEventKind  @default(EVENT)

  // Original fields (EVENT kind)
  eventType     String?            // e.g. 'MEMBER_JOINED', 'ACTIVITY_ADDED'
  description   String?
  createdAt     DateTime           @default(now())
  createdBy     String?

  // Milestone reference (MILESTONE kind)
  sourceType    String?            // 'MILESTONE'
  sourceId      String?            // ID of the source milestone

  // Activity reference (ACTIVITY_START/END kinds)
  activityId    String?

  // Effective date used for sorting
  effectiveDate DateTime           @default(now())

  // Denormalized display fields
  icon          String?            // Lucide icon name
  title         String?            // Short display title
  meta          String?            // JSON: { amount?, role?, memberName? }

  @@index([tripId, effectiveDate(sort: Desc)])
  @@index([sourceType, sourceId])
}
```

**`effectiveDate` logic:**
- `EVENT` → `createdAt` of the event
- `MILESTONE` → `dueDate` from the milestone
- `ACTIVITY_START` → `startTime` from the activity
- `ACTIVITY_END` → `endTime` from the activity

**Past/future split:** Not stored. Computed in real-time at render time using `effectiveDate < new Date()`.

#### `TripTimelineUIState` — UI Subset Cache

One row per trip. Stores the pre-filtered list of timeline event IDs for the Timeline view.

```prisma
enum RefreshState {
  TRUE        // Data has changed, refresh needed
  REFRESHING  // A request has claimed the refresh
  FALSE       // Cache is up to date
}

model TripTimelineUIState {
  tripId          String       @id @unique
  cachedEventIds  String       // JSON array of TimelineEvent.id
  needsRefresh    RefreshState @default(TRUE)
  updatedAt       DateTime     @updatedAt
}
```

### Timeline Engine — Write-Through

Events are written to the timeline at the moment of the source action:

**Milestone created:**
1. Insert `TimelineEvent(kind='MILESTONE', sourceType='MILESTONE', sourceId=<id>, effectiveDate=milestone.dueDate, icon, title)`
2. Upsert `needsRefresh = 'TRUE'` on `TripTimelineUIState`

**Milestone deleted:**
1. Delete all `TimelineEvent` where `sourceType = 'MILESTONE'` AND `sourceId = <milestoneId>`
2. Upsert `needsRefresh = 'TRUE'`

**Milestone completed (in-place update):**
1. Find `TimelineEvent` where `sourceType = 'MILESTONE'` AND `sourceId = <id>`
2. Update `title` and `icon` in-place (e.g., prepend "Completed:")
3. Upsert `needsRefresh = 'TRUE'` — no new event created

**Activity created:**
1. Emit `activity_added` as an EVENT kind `TimelineEvent` (keeps history log complete)
2. Insert `TimelineEvent(kind='ACTIVITY_START', activityId=<id>, effectiveDate=startTime, title=activity.title)`
3. If `category === 'accommodation'`: also insert `TimelineEvent(kind='ACTIVITY_END', activityId=<id>, effectiveDate=endTime, title=activity.title)`
4. Upsert `needsRefresh = 'TRUE'`

**Activity deleted:**
1. Emit `activity_removed` as an EVENT
2. Delete all `TimelineEvent` where `activityId = <id>` (removes ACTIVITY_START/END entries)
3. Upsert `needsRefresh = 'TRUE'`

**Activity updated:**
1. Find `ACTIVITY_START` event for `activityId` → update `title`, `effectiveDate` in-place
2. If accommodation: find `ACTIVITY_END` event → update `effectiveDate` in-place
3. Upsert `needsRefresh = 'TRUE'`

**Accommodation `startTime`/`endTime` edited:**
1. Update `effectiveDate` of the corresponding `ACTIVITY_START`/`ACTIVITY_END` in-place
2. Upsert `needsRefresh = 'TRUE'`

### UI Subset Cache — Recalculation

**Trigger:** Every timeline write upsets `needsRefresh = 'TRUE'`.

**On `GET /api/trips/:id/timeline-summary`:**

```
1. Attempt atomic claim:
     UPDATE "TripTimelineUIState"
     SET "needsRefresh" = 'REFRESHING'
     WHERE "tripId" = :tripId AND "needsRefresh" = 'TRUE'
   IF row was updated (count = 1):
     a. Fetch all timeline events, sorted by effectiveDate DESC
     b. Past (effectiveDate < now): take most recent 10
     c. Future (effectiveDate >= now): all events
     d. Merge, sort by effectiveDate DESC
     e. Update cachedEventIds, set needsRefresh = 'FALSE'
     f. Return { data: [...], needsRefresh: 'TRUE' }
   ELSE:
     // Another request is already refreshing
     a. Fetch event objects for cachedEventIds
     b. Return { data: [...], needsRefresh: 'FALSE' }
```

**Frontend behavior:** When `needsRefresh: 'TRUE'` on initial load, show a centered spinner over the timeline. Re-fetch immediately — the refresh will have completed and the next response returns `needsRefresh: 'FALSE'`.

### Timeline Events — EVENT Kind

All EVENT kind `TimelineEvent` records:

| Event Type | Description | Key Payload Fields |
|------------|-------------|--------------------|
| `activity_added` | New activity was added to the trip | `activityId`, `title`, `addedBy` |
| `activity_removed` | An activity was deleted | `activityId`, `title` |
| `member_joined` | A user joined the trip (accepted invite or joined OPEN trip) | `userId`, `displayName`, `role` |
| `member_left` | A user voluntarily left the trip (withdrew join request) | `userId`, `displayName` |
| `member_removed` | A member was removed from the trip by an organizer | `userId`, `displayName` |
| `member_paid` | A member marked their payment as paid | `userId`, `billSplitId`, `title` |
| `role_changed` | A member's role was changed | `userId`, `oldRole`, `newRole` |
| `payment_added` | A bill split / expense was added | `paymentId`, `amount`, `currency`, `paidBy` |
| `milestone_occurred` | A milestone was completed | `milestoneId`, `milestoneType`, `name` |
| `media_uploaded` | A photo or video was uploaded | `mediaId`, `type` |
| `status_changed` | Trip stage transitioned (e.g. IDEA→PLANNING) | `oldStatus`, `newStatus` |
| `INVITE_DECLINED` | An invite was declined | `inviterId` |

### Timeline Views — Timeline vs History

The Timeline tab and History page share the same data but serve different purposes:

| | Timeline | History |
|---|---|---|
| **Route** | `/trip/[id]/timeline` | `/trip/[id]/history` |
| **Data source** | `GET /api/trips/:id/timeline-summary` | `GET /api/trips/:id/timeline` |
| **Events shown** | 10 most-recent past + all future | ALL events (unconstrained) |
| **Sort order** | `effectiveDate` DESC (soonest first) | `effectiveDate` ASC (oldest first) |
| **Past/future split** | Yes — "Looking Back" / "Looking Ahead" with "Now" divider | No — single chronological stream |
| **Filtering** | No filter | Filter by `kind` (EVENT / MILESTONE / ACTIVITY_START / ACTIVITY_END) |
| **Milestone actions** | Read-only rows; no inline actions | Read-only rows |

The **Timeline** view uses `useTimelineSummary` (cached subset, 60s polling). The **History** page uses `useTimeline` (full event log, sorted oldest-first).

### Timeline Event Rendering

Line-based rows, ~40–48px tall. No card borders or padding. Icon dot + inline text + right-aligned timestamp:

```
[icon dot] [title/description --------------------------------] [date]  [badge if milestone]
```

**By kind:**
- **EVENT:** icon dot + description + timestamp
- **MILESTONE:** icon dot + milestone name + due date + type badge + status badge (COMPLETED/OVERDUE/PENDING/SKIPPED)
- **ACTIVITY_START:** "Check-in: [activity name]" + start date
- **ACTIVITY_END:** "Check-out: [activity name]" + end date

**"Now" bar:** Computed client-side from `effectiveDate < new Date()` — no `isPast` flag stored. Renders as a dashed horizontal divider with "Now" badge between past and future sections.

### Real-Time Updates

Timeline events are also emitted via WebSocket (`timeline:event`) to the `trip:${tripId}` room. The frontend hook `useTimelineEvents` listens on this room for real-time updates.

See **API.md** for full WebSocket event reference.

## Notifications

### Activity Feed Pagination

The notifications page (`/notifications`) uses cursor-based pagination:

- **Page size:** 10 notifications per request
- **Hard cap:** 50 notifications maximum (5 pages)
- **Cursor:** The `id` of the last notification in the current page
- **Load More:** Visible only when `hasMore && notifications.length < 50`
- **Backend:** `GET /api/notifications?cursor=<id>&limit=10`
- **Service:** Uses Prisma cursor pagination — `take: limit`, `skip: cursor ? 1 : 0`, `cursor: cursor ? { id: cursor } : undefined`
- **Response shape:** `{ data: { notifications, nextCursor, hasMore }, unreadCount }`
  - `hasMore = notifications.length === 10 && nextCursor !== null`

### Real-time Notification Bell

The notification bell in the UI displays an unread count badge. New notifications appear in real-time via WebSocket on the `user:${userId}` room.

---

## Push Notifications

TripPlanner supports WebPush for browser push notifications (Chrome, Firefox, Safari). This works even when the browser is closed.

**How it works:**
1. Frontend service worker (`public/sw.js`) registers with the browser
2. User opts-in via Settings → Notifications → Push
3. Frontend calls `POST /api/push/subscribe` with the browser's `PushSubscription`
4. On new notifications, `notificationService.createNotification()` checks `shouldNotify()` and calls `pushService.sendPush()` if `pref.push === true`
5. Browser receives push via service worker, shows system notification

**VAPID:** Server uses VAPID keys (.env: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`). Frontend uses `NEXT_PUBLIC_VAPID_PUBLIC_KEY`.

**Cleanup:** If push delivery fails (subscription expired), `pushService` auto-deletes the stale `PushSubscription` record.

**Preference model:** `NotificationPreference` allows per-category control (MILESTONE, INVITE, FRIEND, PAYMENT, SETTLEMENT, CHAT, MEMBER). Each has `inApp`, `email`, `push` booleans.

## Milestones

### Milestone Generation

Milestones are generated based on trip state transitions:

| Trip State | Milestones Created | Timing |
|---|---|---|
| **IDEA** (at creation) | `COMMITMENT_REQUEST` | `now + 30% × (startDate - now)` |
| **IDEA** (at creation) | `COMMITMENT_DEADLINE` | `now + 50% × (startDate - now)` |
| **PLANNING / CONFIRMED** | `FINAL_PAYMENT_DUE` | `now + 75% × (startDate - now)` — idempotent, only created if not already exists |
| **HAPPENING** | `SETTLEMENT_DUE` | `endDate + 1 day` |
| **HAPPENING** | `SETTLEMENT_COMPLETE` | `endDate + 7 days` |

**Implementation details:**
- All milestone creation methods are idempotent — they check for existing milestones before creating
- Milestones are written to the timeline via `timelineService.writeMilestoneToTimeline()` when created
- If a trip's `startDate` changes, existing milestones are recalculated (not recreated)

### On-Demand Milestone Actions

On-demand actions: `PAYMENT_REQUEST` · `SETTLEMENT_REMINDER`

### Milestone Timeline Dropdown

Milestone rows in the Timeline view have a dropdown menu (three dots) accessible to all users, with additional actions gated by role (ORGANIZER/MASTER):

**Available to all users:**
- **Mark Complete / Mark Incomplete** — toggles milestone completion status for the current user
- **Settle Up** — for `SETTLEMENT_DUE` milestones; marks the user's own settlement as complete
- **Mark Paid** — for `PAYMENT_REQUEST` milestones; marks the user's own payment as complete

**ORGANIZER/MASTER only:**
- **Skip / Unskip** — marks a milestone as skipped
- **Request Payment** — for `FINAL_PAYMENT_DUE` milestones; opens the Request Payment modal to contact members
- **Send Reminder** — for `SETTLEMENT_DUE` milestones; opens the Remind to Settle modal
- **Edit** — redirects to the milestones editor
- **Delete** — removes the milestone

**Status badges** are shown on milestone rows: COMPLETED (green), OVERDUE (red), PENDING (amber), SKIPPED (gray).

> **Note:** Milestone `TimelineEvent` records store `meta = JSON.stringify({ type: milestone.type })` so the dropdown can determine which actions to display for each milestone type.

---

## Authentication

### Form Submission — Button States

All auth forms (login, signup) must follow this behavior on submit:

- **Immediately on click:** Button transitions to `disabled` + shows a loading spinner/thinking indicator
- **While processing:** Button remains `disabled` — no further clicks are accepted
- **On success:** Button stays `disabled` until the page redirect completes (user lands on `/dashboard`)
- **On failure:** Button re-enables, error message is displayed, user can try again

This prevents double submissions and gives clear visual feedback during the redirect. No mention of this behavior in the codebase should be considered a bug.

### Session Storage

NextAuth uses JWT strategy with two session stores:

- **httpOnly cookie** (`next-auth.session-token`) — set by NextAuth on login. HttpOnly (inaccessible to JavaScript), automatically sent with every request to the Next.js API. This is the authoritative session token.
- **localStorage token** (`next-auth.session-token`) — a copy stored by NextAuth in localStorage so the frontend can detect whether a session token exists before making API calls.

On login, both are set. On logout, the httpOnly cookie is cleared server-side via `POST /api/auth/signout`, and localStorage is cleared client-side.

### Login Page Session Validation

When a user lands on `/login` with an existing session:

1. The page checks `localStorage.getItem('next-auth.session-token')`
2. If a token exists, it calls `api.getCurrentUser()` (→ `GET /api/users/me`) to validate the session against the backend
3. If the backend confirms the session is valid → redirect to `/dashboard`
4. If the backend returns 401 or the call times out (5 seconds) → clear the localStorage token, show the login form

The 5-second timeout uses `Promise.race` to prevent the login form from hanging indefinitely if the backend is slow or unreachable.

### AuthProvider Backend Validation Gate

When an authenticated user accesses a protected route, `AuthProvider` validates the session in two stages:

1. **Client validation** (`isAuthenticated`) — NextAuth confirms the httpOnly session cookie exists. This is fast but only checks cookie presence, not token validity.
2. **Backend validation** (`isBackendValidated`) — `api.getCurrentUser()` is called. Only when this succeeds does `isBackendValidated` become `true`.

The redirect from `/login → /dashboard` fires only when **both** `isAuthenticated` AND `isBackendValidated` are `true`. This prevents race condition loops where the client redirects to dashboard before the backend has confirmed the token is valid.

### Session Auto-Refresh

`SessionProvider` is configured with `refetchInterval={3600}` — NextAuth re-validates the session server-side every 60 minutes (3600 seconds). This is designed for long-idle tabs: users who leave the app open for hours without interaction. If the JWT has expired or been revoked, NextAuth detects it on the next refetch and clears the local session. This self-heals stale tokens without requiring a page reload.

### Signout

`POST /api/auth/signout` clears the NextAuth httpOnly session cookie server-side via `signOut({ redirect: false })` and returns `{ success: true }`. The frontend also calls `clearSessionCache()` and clears `next-auth.session-token` and `next-auth.csrf-token` from localStorage.

### 401 Handler

When `api.ts` receives an HTTP 401 from any API call:
1. Calls `clearSessionCache()` — clears the in-memory `cachedSessionToken` and `sessionCacheTime`
2. Redirects to `/login?reason=session_expired`

The login page reads the `?reason=session_expired` query param and displays a dismissible amber banner: **"Your session expired. Please log back in"**.

### Middleware Auth Guard

`frontend/src/middleware.ts` provides the first line of defense for protected routes:

- **Protected paths:** `/dashboard`, `/friends`, `/notifications`, `/trip`
- **Public paths (always allowed):** `/login`, `/invite`, `/api/auth/*`

On protected routes, middleware checks for the NextAuth session cookie (`next-auth.session-token` or `__Secure-next-auth.session-token`). If the cookie is missing, redirects to `/login?reason=session_expired`. This check only verifies cookie existence — it does NOT validate the JWT against the backend. Backend validation is handled by `AuthProvider`.

### Testing

**Backend:** Vitest + PrismaStub (87/111 passing) · `backend/src/services/*.test.ts`
**Frontend E2E:** Playwright (40+ spec files) · `frontend/tests/e2e/`
See [TEST_CASES.md](./docs/TEST_CASES.md) for full test file list.

### Activity Cost Types

Activities support two cost types:
- **`PER_PERSON`** (default) — cost is split equally among all trip members
- **`FIXED`** — cost is paid in full by a single person; no splitting among members

The cost type is set at creation time and cannot be changed after creation.

**UI:** The per-person vs fixed toggle is a **single enable/disable toggle** (not a two-segment control). When the toggle is enabled → `PER_PERSON`; when disabled → `FIXED`. The toggle shows a `/pp` label when enabled (per-person mode).

### BillSplit Cost Types

BillSplits support two cost types:
- **`PER_PERSON`** (default) — total amount is split among members according to `splitType`
- **`FIXED`** — the full `amount` is assigned to `paidBy`; all other members owe `$0`

Example: A $100 fixed expense paid by Alice means Alice is owed $100 from the group. With per-person split, the $100 would be divided among all members.

### Activity Price Lock

Activity `cost`, `costType`, and `currency` are **locked at creation** — these fields cannot be edited via the PATCH endpoint or update form. All other fields (title, description, location, start/end time, category) remain editable.

### Activity Start/End Time

Activities support optional `startTime` and `endTime` fields (ISO 8601 datetime):

- **`startTime`** — when set, auto-populates `endTime` to the same value if `endTime` is empty
- **`endTime`** — optional for most activity types; **required** for `accommodation` category
- **Validation (frontend + backend):** If both times are provided, `endTime` must be >= `startTime`. Submitting invalid times is blocked.
- Both fields are editable after creation (except price fields which are locked)

### Role-Gated Activity Edit UI

Activity field editing is role-gated:

- **Editable fields** (title, description, location, start/end time, category): Only `MASTER` and `ORGANIZER` roles see the pencil/edit button. It is **hidden** for `MEMBER` and `VIEWER` roles.
- **Price fields** (`cost`, `costType`, `currency`): These are read-only even for `MASTER` and `ORGANIZER` — displayed with a **lock icon** to indicate they cannot be modified after creation.

This complements the "Activity Price Lock" section above.

### Activity Deletion

Activities can only be deleted by `MASTER` or `ORGANIZER` role holders on the trip. `MEMBER` and `VIEWER` roles — including activity proposers — cannot delete activities, even their own.

**Backend:** `DELETE /api/activities/:id` checks `checkMemberPermission(activity.tripId, userId, ['MASTER', 'ORGANIZER'])` and returns 403 if the requester lacks either role. No proposer bypass exists.

**Frontend:** The delete button (trash icon) on activity cards is only rendered for `MASTER` and `ORGANIZER` members. `MEMBER` and `VIEWER` users see no delete option.

**Deletion is permanent** — activities are hard-deleted from the database (not soft-deleted with a `deletedAt` flag). A `timeline_event` with type `activity_removed` is created for audit purposes.

### Settings Deep Linking

The Settings page supports `?tab=` query parameter for direct navigation:
- `?tab=notifications` → opens the notifications settings tab directly

### BillSplits

BillSplits: `EQUAL` · `SHARES` · `PERCENTAGE` · `MANUAL` split types.
Flow: Create → Members mark PAID → Creator confirms → CONFIRMED

### Add Expense Modal

The "Add Expense" button on the Payments page opens an `AddExpenseModal` instead of navigating to a separate page. The modal contains the full expense form: category, description, subtotal/tax/tip with auto-calculated total, cost type (PER_PERSON / FIXED), paid-by dropdown, date picker, split type selector (EQUAL / SHARES / PERCENTAGE / MANUAL), per-member split inputs with auto-balance logic, and optional notes. The standalone `/trip/[id]/payments/add` page is preserved as a fallback.

---

## Testing

**Backend:** Vitest + PrismaStub (87/111 passing) · `backend/src/services/*.test.ts`
**Frontend E2E:** Playwright (40+ spec files) · `frontend/tests/e2e/`
See [TEST_CASES.md](./docs/TEST_CASES.md) for full test file list.

---

## Deployment

### Network Architecture

```
Browser → Cloudflare (proxies) → 67.254.222.75 (public IP) 
                                          ↓
                               Nginx on Unraid (192.168.0.8)
                                          ↓
                               Docker services on Unraid:
                                 • frontend :16199
                                 • backend  :16198
```

- **Cloudflare** proxies both `plan.eric-hu.com` and `plan-api.eric-hu.com`
- **Nginx** on Unraid handles routing based on domain
- **Browser calls backend directly** via `plan-api.eric-hu.com/api` (NOT through the frontend domain)
- **Backend CORS** is configured with `FRONTEND_URL=https://plan.eric-hu.com` so it sends the correct `Access-Control-Allow-Origin` header for browser requests from the frontend

### Environment Configuration

| Env | NEXT_PUBLIC_API_URL | INTERNAL_API_URL | NEXTAUTH_URL |
| -----|---------------------------|---------------------------|--------------------------|
| prod | `https://plan-api.eric-hu.com/api` | `http://backend:4000/api` | `https://plan.eric-hu.com` |
| staging | `http://192.168.0.189:16198/api` | `http://backend:4000/api` | `http://192.168.0.189:16199` |
| dev | `http://localhost:4000/api` | `http://localhost:4000/api` | `http://localhost:3000` |

#### Dev Environment Setup (April 2025)

**`.env.dev`** — The root `.env.dev` file contains all environment variables shared by both frontend and backend.

**Frontend:**
- Uses `dotenv-cli` via `npx dotenv -e ../.env.dev -- next dev` to load variables
- Package.json script: `"dev": "npx dotenv -e ../.env.dev -- next dev -p 3000"`

**Backend:**
- Uses symlink: `backend/.env -> ../.env.dev`
- `dotenv` loads automatically from `.env` at runtime

**Key variables:**
| Variable | Purpose |
|---------|---------|
| `NEXT_PUBLIC_API_URL` | Browser-accessible API (frontend uses for client-side calls) |
| `INTERNAL_API_URL` | Server-to-server API calls (NextAuth uses to call backend from API routes) |
| `NEXTAUTH_SECRET` | NextAuth JWT signing secret |
| `JWT_SECRET` | Backend JWT signing secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `FRONTEND_URL` | Allowed CORS origins (comma-separated) |

#### CORS Configuration

**Backend CORS** (`backend/src/index.ts`):
Uses dynamic origin validation to allow any subdomain of the configured `FRONTEND_URL`:

```typescript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const hostname = new URL(origin).hostname;
    const baseDomain = hostname.split('.').slice(-2).join('.');
    
    const isAllowed = allowedOrigins.some(allowed => {
      const allowedHostname = new URL(allowed).hostname;
      const allowedBaseDomain = allowedHostname.split('.').slice(-2).join('.');
      return hostname === allowedHostname || hostname.endsWith('.' + allowedBaseDomain);
    });
    
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
}));
```

**Socket.IO CORS** (`backend/src/lib/socket.ts`):
Same dynamic validation as backend CORS.

**How it works:**
1. `FRONTEND_URL=http://localhost:3000` allows requests from `localhost:3000` and any subdomain like `app.localhost:3000`, `dev.localhost:3000`, etc.
2. When running locally without Docker, `DATABASE_URL` should use `localhost:5432` (not `db:5432` which is for Docker networking).

### Build & Deploy Script

```bash
bash scripts/build-deploy.sh prod   # builds prod images → dist/
bash scripts/build-deploy.sh staging # builds staging images → dist/
bash scripts/build-deploy.sh dev    # dev mode, no Docker build
```

### Environment Configuration

| Env | NEXT_PUBLIC_API_URL | NEXTAUTH_URL | Image tag |
| -----|---------------------------|--------------------------| --------- |
| prod | `https://plan-api.eric-hu.com/api` | `https://plan.eric-hu.com` | `:prod` |
| staging | `http://192.168.0.8:16198/api` | `http://192.168.0.8:16199` | `:staging` |
| dev | `http://localhost:4000` | `http://localhost:3000` | `:dev` |

The `NEXT_PUBLIC_API_URL` is passed as a `--build-arg` so it is baked into the image at build time. No hardcoding in `docker-compose` files.

### Auth Troubleshooting (April 2025)

**Issue:** Login returns HTTP 401 despite valid credentials.

**Debugging steps:**
1. First, verify the backend login works:
   ```bash
   curl -s -X POST 'http://localhost:4000/api/auth/login' \
     -H 'Content-Type: application/json' \
     --data-raw '{"email":"user@example.com","password":"password123"}'
   ```
   If this fails, the user doesn't exist or password is wrong.

2. Verify `.env.dev` has `INTERNAL_API_URL` set. Without it, NextAuth falls back to `http://backend:4000/api` which won't resolve locally.

3. Check the frontend's environment variables:
   ```bash
   curl -s 'http://localhost:3000/api/debug-env'
   ```
   Should return `INTERNAL_API_URL`: `http://localhost:4000/api`

4. The backend must be on port 4000 locally (configured via `PORT=4000` in `.env.dev`).

**How login works:**
1. User submits form at `/login`
2. NextAuth calls `authorize(credentials)` in `src/lib/next-auth/options.ts`
3. `authorize` fetches `http://localhost:4000/api/auth/login`
4. Backend verifies password, returns `{ data: { user, token } }`
5. NextAuth stores the JWT in the session cookie

---

*v1.4 — April 2026 (Timeline redesign integrated: TimelineEventKind, effectiveDate, TripTimelineUIState, write-through engine, timeline-summary API, Timeline/History views)*
