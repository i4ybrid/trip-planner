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

**Service:** `tripService.changeTripStatus(tripId, newStatus)` validates the transition against `VALID_TRANSITIONS`, creates a `status_changed` timeline event, and (for `IDEA → PLANNING`) auto-generates default milestones if the trip has a `startDate`.

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
| `/trip/[id]/timeline` | Timeline tab. Shows a chronological event log: votes cast, activities proposed/confirmed, members joining/leaving, payment events, milestone events, etc. |
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

### Timeline Events

All timeline events are written to the `timeline_events` table and emitted via WebSocket (`timeline:event`) to the `trip:${tripId}` room. The frontend hook `useTimelineEvents` listens on this room.

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

See **API.md** for full WebSocket event reference.

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

Auto-generated on `IDEA → PLANNING`. All 6 types: `COMMITMENT_REQUEST` · `COMMITMENT_DEADLINE` · `FINAL_PAYMENT_DUE` · `SETTLEMENT_DUE` · `SETTLEMENT_COMPLETE` · `CUSTOM`

On-demand actions: `PAYMENT_REQUEST` · `SETTLEMENT_REMINDER`

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

---

## Testing

**Backend:** Vitest + PrismaStub (87/111 passing) · `backend/src/services/*.test.ts`
**Frontend E2E:** Playwright (40+ spec files) · `frontend/tests/e2e/`
See [TEST_CASES.md](./docs/TEST_CASES.md) for full test file list.

---

*v1.3 — March 2026*
