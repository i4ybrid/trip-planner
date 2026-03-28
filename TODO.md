# TripPlanner TODO

## 1. Payment Settlement UI ✅ COMPLETED

- [x] **1.1** Add "Mark as Paid" button in payments UI for members who owe money
- [x] **1.2** Show payment method selection (Venmo, PayPal, Zelle, CashApp, Cash)
- [x] **1.3** Add "Confirm Receipt" button for the payer to confirm payment was received
- [x] **1.4** Update BillSplitMember status workflow: PENDING → PAID → CONFIRMED
- [x] **1.5** Add visual indicators for payment status in payment cards
- [x] **1.6** Handle edge cases (user marking themselves as paid when they're the payer)

---

## 2. Simplify Debt Algorithm ✅ COMPLETED

- [x] **2.1** Research and implement debt simplification algorithm (similar to Splitwise)
- [x] **2.2** Create backend endpoint to calculate optimized settlement
- [x] **2.3** Display simplified debts in the payments overview
- [x] **2.4** Show who pays whom and how much
- [x] **2.5** Handle cases where A owes B and B owes C (chain settlements)
- [x] **2.6** Test with various debt scenarios

**Implementation:**
- `backend/src/services/debtSimplifier.service.ts` - Core algorithm
- `backend/src/services/debtSimplifier.service.test.ts` - Unit tests
- `GET /api/trips/:tripId/debt-simplify` - API endpoint
- Frontend payments page shows optimized settlements

---

## 3. Fix Images/Videos on Trips

- [x] **3.1** Investigate why images/videos are not showing up (may be CORS/storage issue)
- [x] **3.2** Check media upload functionality
- [x] **3.3** Verify media storage (S3 or local) - needs configuration
- [x] **3.4** Fix media rendering in memories/chat
- [x] **3.5** Add loading states for media
- [x] **3.6** Add error handling for failed media loads

---

## 4. Avatar Upload

- [x] **4.1** Create avatar upload component in settings
- [x] **4.2** Implement file upload API endpoint
- [x] **4.3** Add image compression before upload
- [x] **4.4** Update user profile to store avatar URL
- [X] **4.5** Display avatar in header dropdown
- [x] **4.6** Show avatar in trip members list
- [x] **4.7** Add fallback to initials when no avatar
- [x] **4.8** Standardize avatar display across all pages using Avatar component
  - [x] **4.8.1** Chat page - message sender avatars
  - [x] **4.8.2** Payments page - member balance avatars
  - [x] **4.8.3** Add payment member selection avatars
  - [x] **4.8.4** Edit payment member selection avatars
  - [x] **4.8.5** Settings page - avatar preview fallback

---

## 5. Chat: Enter to Submit, Shift+Enter for New Line

- [x] **5.1** Update message input to handle Enter key as submit
- [x] **5.2** Add Shift+Enter handling for new line
- [x] **5.3** Add visual feedback for message send
- [x] **5.4** Handle empty message case

---

## 6. Chat Pagination - Initial Load (First 30 Messages)

- [x] **6.1** Update API to return first 30 messages by default
- [x] **6.2** Update frontend to load initial 30 messages on chat open
- [x] **6.3** Create cache/queue for first 30 messages per conversation
- [x] **6.4** Implement "load more" for older messages
- [x] **6.5** Add tests for chat pagination API and UI
- [x] **6.6** Update seed data to have more than 30 messages for testing

---

## 7. Chat Pagination - Load Older Messages by ID

- [x] **7.1** Create API endpoint to fetch messages older than a given message ID
- [x] **7.2** Add pagination UI in chat (infinite scroll or "Load More" button)
- [x] **7.3** Track message IDs for pagination
- [x] **7.4** Handle edge case when no more messages to load
- [x] **7.5** Optimize query to use index on createdAt or message ID

---

## 8. Timeline Engine

**Proposal:** `proposals/timeline-engine-proposal.md`

### Phase 1: Member Events (Priority)

**8.1 Prisma Schema — Add TripTimelineEvent model**

```prisma
model TripTimelineEvent {
  id        String   @id @default(cuid())
  tripId    String
  trip      Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)
  eventType String   // "MEMBER_JOINED", "MEMBER_INVITE_DECLINED", "MEMBER_REMOVED", "MEMBER_JOIN_WITHDRAWN", "ROLE_CHANGED", "JOIN_REQUEST_SENT", "JOIN_REQUEST_APPROVED", "JOIN_REQUEST_DENIED"
  metadata  Json?    // { memberId, role, etc. }
  actorId   String?
  actor     User?    @relation(fields: [actorId], references: [id])
  createdAt DateTime @default(now())

  @@index([tripId, createdAt])
  @@index([tripId, eventType])
}
```
- Run `npx prisma migrate dev --name add_trip_timeline_event`

**8.2 Backend — emitTimelineEvent() service**

Create `backend/src/services/timeline.service.ts`:
```typescript
export async function emitTimelineEvent(params: {
  tripId: string;
  eventType: string;
  metadata?: Record<string, any>;
  actorId?: string;
}): Promise<TripTimelineEvent>
```

**8.3 Backend — Wire member events in tripMember.service.ts**

| Method | Event Emitted |
|--------|---------------|
| `confirmJoin()` | `MEMBER_JOINED` |
| `declineInvite()` | `MEMBER_INVITE_DECLINED` |
| `removeMember()` | `MEMBER_REMOVED` |
| `withdrawJoinRequest()` | `MEMBER_JOIN_WITHDRAWN` |
| `updateRole()` | `ROLE_CHANGED` |
| `createJoinRequest()` | `JOIN_REQUEST_SENT` |
| `approveJoinRequest()` | `JOIN_REQUEST_APPROVED` |
| `denyJoinRequest()` | `JOIN_REQUEST_DENIED` |

**8.4 Backend — GET /api/trips/:tripId/timeline endpoint**

Create `backend/src/routes/timeline.routes.ts`:
- `GET /api/trips/:tripId/timeline?cursor=&limit=20`
- Returns `{ events: TripTimelineEvent[], nextCursor: string | null }`
- Only accessible to trip members (auth guard)
- Sorted by `createdAt DESC`

**8.5 Frontend — Timeline tab page**

File: `frontend/src/app/trip/[id]/timeline/page.tsx`
- Polls `GET /api/trips/:tripId/timeline` on mount + on `visibilitychange`
- Shows `TimelineEventCard` list (newest first)
- Infinite scroll to load more
- Relative timestamps ("2h ago"), absolute on hover

**8.6 Frontend — TimelineEventCard component**

File: `frontend/src/components/timeline/TimelineEventCard.tsx`
Props: `{ event: TripTimelineEvent }`

Display per event type:
- `MEMBER_JOINED` → 👤+ "{name} joined the trip"
- `MEMBER_INVITE_DECLINED` → 🚪👤 "{name} declined the invitation"
- `MEMBER_REMOVED` → 🚫 "{name} was removed from the trip"
- `MEMBER_JOIN_WITHDRAWN` → 🔙 "{name} withdrew their join request"
- `ROLE_CHANGED` → ⭐ "{name} was promoted to {role}" / demoted
- `JOIN_REQUEST_SENT` → 📩 "{name} requested to join"
- `JOIN_REQUEST_APPROVED` → ✅ "Join request approved for {name}"
- `JOIN_REQUEST_DENIED` → ❌ "Join request denied for {name}"

**8.7 Frontend — useTimelineEvents hook**

File: `frontend/src/hooks/useTimelineEvents.ts`
- `useQuery(['timeline', tripId], ...)` with `refetchInterval: 60000` (60s polling)
- `refetchOnWindowFocus: true`
- Returns `{ events, fetchNextPage, hasNextPage, isLoading }`

---

### Phase 2: Trip & Activity Events

**8.8 Backend — Wire remaining event emitters**

| Service | Method | Event |
|---------|--------|-------|
| `trip.service.ts` | `create()` | `TRIP_CREATED` |
| `trip.service.ts` | `updateDates()` | `TRIP_DATES_CHANGED` |
| `trip.service.ts` | `updateLocation()` | `TRIP_LOCATION_CHANGED` |
| `settlement.service.ts` | `complete()` | `SETTLEMENT_COMPLETED` |
| `payment.service.ts` | `confirmPayment()` | `PAYMENT_CONFIRMED` |
| `activity.service.ts` | `create()` | `ACTIVITY_ADDED` |
| `milestone.service.ts` | `complete()` | `MILESTONE_COMPLETED` |

**8.9 Frontend — Filter bar**

Add filter buttons: All | Members | Activities | Payments
- Members: MEMBER_*, JOIN_REQUEST_*
- Activities: ACTIVITY_ADDED, MILESTONE_COMPLETED
- Payments: PAYMENT_CONFIRMED, SETTLEMENT_COMPLETED

**8.10 Frontend — Rich metadata rendering**

- `PAYMENT_CONFIRMED`: show amount
- `TRIP_DATES_CHANGED`: show old → new dates
- `TRIP_LOCATION_CHANGED`: show old → new location
- `ACTIVITY_ADDED`: show activity name
- `ROLE_CHANGED`: show old → new role

**QA Checklist:**
- [ ] All 8 member events fire and appear in timeline
- [ ] Timeline only accessible to trip members (auth guard)
- [ ] Non-members cannot access timeline API (401/403)
- [ ] Timeline paginates correctly with cursor
- [ ] Relative timestamps update correctly
- [ ] Filter bar correctly filters by category
- [ ] Phase 2 events fire and render with metadata
- [ ] TypeScript 0 errors
- [ ] `npm run build` passes
