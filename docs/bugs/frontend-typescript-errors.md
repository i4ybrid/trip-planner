# Frontend TypeScript Bugs - Fix List

## Priority: HIGH - These block compilation

### 1. Session/User type missing `id` property

**Files affected:**
- `src/app/trip/[id]/payments/page.tsx:48`
- `src/hooks/use-auth.ts:93`
- `src/lib/next-auth/options.ts:62`

**Error:** `Property 'id' does not exist on type '{ name?: string | null | undefined; email?: string | null | undefined; image?: string | null | undefined; }'`

**Fix:** The NextAuth session type needs to include `id` in its type definition. Update the type in `next-auth.d.ts` or wherever session types are defined.

---

### 2. Trip model missing `style` property

**Files affected:**
- `src/services/mock-api.ts` (multiple lines: 75, 88, 101, 114, 127, 412)
- `src/store/trip-store.test.ts` (multiple lines)

**Error:** `Property 'style' is missing in type '{...}' but required in type 'Trip'`

**Fix:** Add `style: 'OPEN' | 'MANAGED'` (or appropriate default) to all Trip mock objects.

---

### 3. Undefined check needed in chat

**File:** `src/app/trip/[id]/chat/page.tsx:59`

**Error:** `'result.data' is possibly 'undefined'`

**Fix:** Add optional chaining or null check before accessing `result.data`

---

### 4. Missing `getMemberInitial` function

**File:** `src/app/trip/[id]/chat/page.tsx:256`

**Error:** `Cannot find name 'getMemberInitial'`

**Fix:** Either import this function or it may have been renamed to `getInitials` from the Avatar component.

---

### 5. Constructor argument issues

**Files:**
- `src/app/settings/page.tsx:33`
- `src/app/trip/[id]/memories/page.tsx:39`

**Error:** `Expected 1 arguments, but got 0` and `'new' expression, whose target lacks a construct signature`

**Fix:** Check what class/function is being instantiated and provide required arguments.

---

### 6. Set iteration issue

**File:** `src/components/trip/invite-modal.tsx:66`

**Error:** `Type 'Set<string>' can only be iterated through when using the '--downlevelIteration' flag`

**Fix:** Either convert Set to Array with `Array.from(set)` or update tsconfig.json to enable downlevelIteration.

---

### 7. Test file issues

**Files:**
- `src/components/ui/button.test.tsx:2` - Module '"@testing-library/react"' has no exported member 'screen'
- `src/store/trip-store.test.ts` - Cannot find name 'vi' (missing import)

**Fix:** 
- `button.test.tsx`: Change `import { screen } from '@testing-library/react'` to proper import
- `trip-store.test.ts`: Add `import { vi } from 'vitest'`

---

## Files to Fix

1. `src/types/next-auth.d.ts` or similar - Add `id` to session type
2. `src/services/mock-api.ts` - Add `style` property to Trip objects
3. `src/store/trip-store.test.ts` - Add `style` and import `vi`
4. `src/app/trip/[id]/chat/page.tsx` - Fix undefined check, import `getInitials`
5. `src/app/trip/[id]/payments/page.tsx` - Fix session type access
6. `src/app/settings/page.tsx` - Fix constructor call
7. `src/app/trip/[id]/memories/page.tsx` - Fix constructor call
8. `src/components/trip/invite-modal.tsx` - Fix Set iteration
9. `src/components/ui/button.test.tsx` - Fix import
10. `src/hooks/use-auth.ts` - Fix session type access
11. `src/lib/next-auth/options.ts` - Fix session type access
