# TripPlanner — Technical Design

> **📚 Detailed Docs:** [DATABASE.md](./docs/DATABASE.md) · [API.md](./docs/API.md) · [USE_CASES.md](./docs/USE_CASES.md) · [TEST_CASES.md](./docs/TEST_CASES.md)

---

## Overview

Collaborative trip planning app for groups. Tech: Next.js 14 · Express · PostgreSQL/Prisma · Socket.io · NextAuth.js · Vitest · Playwright

### Trip Status Flow
```
IDEA → PLANNING → CONFIRMED → HAPPENING → COMPLETED
```

### Member Roles
`MASTER` (full) · `ORGANIZER` (manage) · `MEMBER` (vote/chat) · `VIEWER` (view)

### Trip Styles
`OPEN` — join immediately · `MANAGED` — requires approval

---

## Pages
| Route | Tab |
|-------|-----|
| `/trip/[id]/overview` | Overview (default) |
| `/trip/[id]/activities` | Activities & voting |
| `/trip/[id]/timeline` | Timeline tab. Shows a chronological event log: votes cast, activities proposed/confirmed, members joining/leaving, payment events, milestone events, etc. |
| `/trip/[id]/chat` | Group chat |
| `/trip/[id]/payments` | Expenses & settlements |
| `/trip/[id]/memories` | Photos/videos |
| `/invites/pending` | Pending invitations |

---

## Real-time Events (WebSocket)

TripPlanner uses Socket.io for real-time event delivery:

- **Connection**: Authenticated via session token on connect
- **Rooms**: Each user joins `user:${userId}` room. Each trip has a `trip:${tripId}` room
- **Notification push**: Notifications created server-side are pushed to the user's room immediately
- **Chat**: Messages are pushed to the trip room in real-time when sent
- **Timeline**: Trip-scoped events (votes, proposals, member changes) are pushed to the trip room

See **API.md** for full WebSocket event reference.

## Milestones

Auto-generated on `IDEA → PLANNING`. All 6 types: `COMMITMENT_REQUEST` · `COMMITMENT_DEADLINE` · `FINAL_PAYMENT_DUE` · `SETTLEMENT_DUE` · `SETTLEMENT_COMPLETE` · `CUSTOM`

On-demand actions: `PAYMENT_REQUEST` · `SETTLEMENT_REMINDER`

---

## Payments

BillSplits: `EQUAL` · `SHARES` · `PERCENTAGE` · `MANUAL` split types.
Flow: Create → Members mark PAID → Creator confirms → CONFIRMED

---

## Testing

**Backend:** Vitest + PrismaStub (87/111 passing) · `backend/src/services/*.test.ts`
**Frontend E2E:** Playwright (40+ spec files) · `frontend/tests/e2e/`
See [TEST_CASES.md](./docs/TEST_CASES.md) for full test file list.

---

*v1.3 — March 2026*
