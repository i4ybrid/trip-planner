# TripPlanner API Optimization Analysis

## Executive Summary
The frontend is making excessive redundant API calls due to N+1 query patterns, lack of caching, and inefficient mutation handling. The most critical issue is on the **Dashboard page** which makes N+1 API calls for trip members.

---

## Issues Found

### 1. CRITICAL: Dashboard N+1 Query Problem
**File:** `/app/dashboard/page.tsx`

```typescript
// Line 27-40: For EACH trip, a separate API call is made
useEffect(() => {
  const loadMembers = async () => {
    const memberPromises = trips.map(async (trip) => {
      const result = await api.getTripMembers(trip.id);  // ← N calls for N trips
      return { tripId: trip.id, members: result.data || [] };
    });
    // ...
  };
}, [trips]);
```

**Impact:** If user has 10 trips = 11 API calls (1 getTrips + 10 getTripMembers)

---

### 2. CRITICAL: Trip Overview Redundant Fetches
**File:** `/app/trip/[id]/overview/page.tsx`

```typescript
// Line 29-47: Makes 4 separate API calls
useEffect(() => {
  fetchTrip(tripId);  // Store fetch (→ api.getTrip)
  Promise.all([
    api.getTripMembers(tripId),   // Call 1
    api.getActivities(tripId),    // Call 2
    api.getBillSplits(tripId),     // Call 3
  ]).then(...);
}, [tripId]);
```

Meanwhile, `TripLayout` also fetches `api.getTrip(tripId)` separately.

**Total:** 4-5 API calls when user visits trip overview

---

### 3. HIGH: Payments Page Re-fetches After Mutations
**File:** `/app/trip/[id]/payments/page.tsx`

```typescript
// Line 58: After mark as paid, re-fetches entire list
const handleMarkAsPaid = async (...) => {
  await api.markBillSplitMemberPaid(billId, userId, selectedPaymentMethod);
  const result = await api.getBillSplits(tripId);  // ← Unnecessary re-fetch
  setBillSplits(result.data);
};

// Line 71: After confirm receipt, same issue
const handleConfirmReceipt = async (...) => {
  await api.confirmBillSplitPayment(billId);
  const result = await api.getBillSplits(tripId);  // ← Unnecessary re-fetch
  setBillSplits(result.data);
};
```

**Impact:** Every payment action triggers 1 extra API call

---

### 4. MEDIUM: No Caching Infrastructure
- **API client** (`api.ts`): Raw fetch with no caching
- **Zustand stores**: In-memory only, lost on refresh, no staleness tracking
- **No React Query/SWR**: No stale-while-revalidate, no automatic deduplication
- **No request deduplication**: Same endpoint called from multiple components simultaneously

---

### 5. MEDIUM: Chat Page Initial Load
**File:** `/app/trip/[id]/chat/page.tsx`

```typescript
// Initial load: 2 API calls
const [messagesResult, membersResult] = await Promise.all([
  api.getTripMessages(tripId, 30),
  api.getTripMembers(tripId),
]);
```

Members are already fetched in Overview page. Chat re-fetches them.

---

## Data Dependency Tree

```
Dashboard
└── getTrips() → 1 call
    └── [for each trip] getTripMembers(tripId) → N calls
    Total: 1+N calls

TripLayout
└── getTrip(tripId) → 1 call (for header title)

TripOverview
├── getTrip(tripId) → from store (TripLayout also fetched this)
├── getTripMembers(tripId) → 1 call
├── getActivities(tripId) → 1 call
└── getBillSplits(tripId) → 1 call
Total: 4 calls

TripPayments
├── getBillSplits(tripId) → 1 call
├── getTripMembers(tripId) → 1 call
└── getSimplifiedDebts(tripId) → 1 call
Total: 3 calls (+ re-fetches on mutations)

TripChat
├── getTripMessages(tripId) → 1 call
└── getTripMembers(tripId) → 1 call (DUPLICATE - already fetched)
Total: 2 calls
```

---

## Excessive API Endpoints

| Endpoint | Called By | Frequency | Issue |
|----------|-----------|-----------|-------|
| `GET /trips` | Dashboard | Every visit | OK - needs caching |
| `GET /trips/{id}/members` | Dashboard (N times), Overview, Payments, Chat | Per-trip, multiple pages | **N+1 problem** |
| `GET /trips/{id}` | TripLayout, Overview (via store) | Multiple times per page | **Duplicate** |
| `GET /trips/{id}/payments` | Overview, Payments, + re-fetches | Multiple + mutations | **Excessive** |
| `GET /trips/{id}/activities` | Overview | Once | OK |
| `GET /trips/{id}/debt-simplify` | Payments | Once | OK |
| `GET /trips/{id}/messages` | Chat | Once (+ pagination) | OK if cached |

---

## Root Causes

1. **No caching layer** - Every page load = fresh API calls
2. **N+1 query pattern** - Fetching members per-trip instead of batch
3. **Mutation re-fetching** - Updating local state instead of optimistic updates
4. **No request deduplication** - Same data fetched in multiple components
5. **Missing stale-while-revalidate** - Can't use stale data while fetching fresh

---

## Optimization Strategy

### Phase 1: Implement React Query (High Impact, Medium Effort)

**Add to `frontend/src/lib/query-provider.tsx`:**
```typescript
// New file - React Query provider with sensible defaults
```

**Update `api.ts` usage patterns:**
- Replace direct `api.getX()` calls with `useQuery(['key'], () => api.getX())`
- Enable `staleTime: 5 * 60 * 1000` (5 minutes)
- Enable `gcTime: 30 * 60 * 1000` (30 minutes cache)
- Use `refetchOnWindowFocus: false` to reduce background refetches

### Phase 2: Create Batch Endpoints (High Impact, High Effort)

**New backend endpoint:** `GET /api/trips/:id/full`
Returns:
```json
{
  "trip": { ... },
  "members": [ ... ],
  "activities": [ ... ],
  "billSplits": [ ... ],
  "stats": { ... }
}
```

**New dashboard endpoint:** `GET /api/trips/with-members`
Returns all trips with their members pre-loaded.

### Phase 3: Fix Mutation Patterns (Medium Impact, Low Effort)

**Payments page:**
- Use React Query's `useMutation` with `onSuccess` → `queryClient.invalidateQueries()`
- Or use optimistic updates: `queryClient.setQueryData()` immediately, rollback on error

### Phase 4: Add Request Deduplication (Low Effort, Medium Impact)

- React Query automatically deduplicates requests within the same component
- Add `useIsFetching` checks before making requests in useEffects

---

## Technical Specifications

### 1. React Query Configuration
```typescript
// frontend/src/lib/query-provider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutes
      gcTime: 30 * 60 * 1000,         // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,    // Reduce background refetches
      retry: 1,                        // Single retry on failure
    },
  },
})
```

### 2. Query Keys Convention
```typescript
// frontend/src/lib/query-keys.ts
export const queryKeys = {
  trips: ['trips'] as const,
  trip: (id: string) => ['trip', id] as const,
  tripMembers: (tripId: string) => ['trip', tripId, 'members'] as const,
  tripActivities: (tripId: string) => ['trip', tripId, 'activities'] as const,
  tripBillSplits: (tripId: string) => ['trip', tripId, 'billSplits'] as const,
  tripMessages: (tripId: string) => ['trip', tripId, 'messages'] as const,
  tripDebtSimplify: (tripId: string) => ['trip', tripId, 'debtSimplify'] as const,
}
```

### 3. Dashboard Query Hook
```typescript
// frontend/src/hooks/use-dashboard.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'

export function useDashboardTrips() {
  return useQuery({
    queryKey: queryKeys.trips,
    queryFn: () => api.getTrips(),
    staleTime: 5 * 60 * 1000,
  })
}
```

### 4. Trip Overview Query Hook
```typescript
// frontend/src/hooks/use-trip-overview.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { queryKeys } from '@/lib/query-keys'

export function useTripOverview(tripId: string) {
  // Parallel queries with automatic deduplication
  const trip = useQuery({
    queryKey: queryKeys.trip(tripId),
    queryFn: () => api.getTrip(tripId),
  })
  const members = useQuery({
    queryKey: queryKeys.tripMembers(tripId),
    queryFn: () => api.getTripMembers(tripId),
  })
  const activities = useQuery({
    queryKey: queryKeys.tripActivities(tripId),
    queryFn: () => api.getActivities(tripId),
  })
  const billSplits = useQuery({
    queryKey: queryKeys.tripBillSplits(tripId),
    queryFn: () => api.getBillSplits(tripId),
  })
  
  return { trip, members, activities, billSplits }
}
```

### 5. Mutation with Optimistic Update
```typescript
// Payments page - handleMarkAsPaid
const mutation = useMutation({
  mutationFn: ({ billId, userId, method }) => 
    api.markBillSplitMemberPaid(billId, userId, method),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tripBillSplits(tripId) })
  },
})
```

---

## Implementation Priority

1. **Week 1:** Add React Query provider, convert overview page to use queries
2. **Week 2:** Fix dashboard N+1, add trip batch endpoint
3. **Week 3:** Fix payments mutations with optimistic updates
4. **Week 4:** Polish - add loading states, error handling

---

## Expected Impact

| Metric | Before | After |
|--------|--------|-------|
| Dashboard load (10 trips) | 11 API calls | 1 API call |
| Trip overview load | 4-5 API calls | 1 API call (batch) |
| Payment action | 2 API calls | 1 API call |
| Page refresh | Fresh API calls | Cached data shown instantly |

**Total reduction:** 60-80% fewer API calls in typical user sessions.
