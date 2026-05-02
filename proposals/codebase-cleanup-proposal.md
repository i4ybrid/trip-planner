# Codebase Cleanup Proposal

## Summary

This proposal captures the code review findings around unused code, old artifacts, and dependency drift in the TripPlanner repository. The goal is to reduce stale files, make package ownership clearer, and prevent abandoned feature slices from masking build or runtime failures.

## Findings

### 1. Backend push dependency is declared in the wrong package

**Priority:** P1  
**File:** `backend/src/services/push.service.ts`

`backend/src/services/push.service.ts` imports `web-push`, but `backend/package.json` does not declare it. Docker installs only backend package files, so backend builds or starts in container can fail with `module not found`.

**Recommendation:** Move `web-push` and `@types/web-push` into `backend/package.json`. Remove the root package copy if the root is not intended to be a real workspace package.

### 2. Expense and budget slice is half-wired and likely uncompilable

**Priority:** P1  
**Files:** `backend/src/index.ts`, `backend/src/routes/expenses.ts`, `backend/src/services/expense.service.ts`, frontend expense/budget modals

There is an `expenses` router, but `backend/src/index.ts` never imports or mounts it. The service imports Prisma `ExpenseCategory` and `Expense` APIs that do not appear in `backend/prisma/schema.prisma`. The frontend modals call `api.createExpense` and `api.updateTripBudget` methods that are not present.

**Recommendation:** Decide whether the expense/budget feature should ship. If yes, finish it end to end: Prisma schema, migration, API client methods, backend route mount, tests, and UI wiring. If no, remove the route, service, and unused frontend modals.

### 3. Generated Prisma seed artifacts are tracked

**Priority:** P2  
**Files:** `backend/prisma/seed.js`, `backend/prisma/seed.js.map`, `backend/prisma/seed.d.ts`, `backend/prisma/seed.d.ts.map`

`seed.ts` is the source file and `db:seed` runs it through `tsx`, but compiled JavaScript, maps, and declaration files are tracked beside it. These generated files can drift from the source seed and create confusion.

**Recommendation:** Remove the generated seed artifacts from version control. Keep only `backend/prisma/seed.ts`, and ensure generated seed outputs are ignored if the toolchain recreates them.

### 4. Root package appears to be an old dependency artifact

**Priority:** P2  
**Files:** `package.json`, `package-lock.json`

The root `package.json` contains only `web-push` and its types. The actual apps live in `frontend` and `backend`, so the root package can encourage accidental parent `node_modules` resolution and mask missing backend dependencies.

**Recommendation:** Remove the root package files unless a real workspace is introduced. If a workspace is desired, convert the root package into an explicit npm workspace configuration for `frontend` and `backend`.

### 5. Unused imports in sidebar

**Priority:** P3  
**File:** `frontend/src/components/left-sidebar.tsx`

`ChevronRight` and `Button` are imported but never used.

**Recommendation:** Remove the unused imports and run frontend lint/type checks after the dependency/tooling issue on the SMB mount is addressed.

## Other Cleanup Candidates

Likely unreferenced components:

- `frontend/src/components/notification-drawer.tsx`
- `frontend/src/components/calendar/calendar-export.tsx`
- `frontend/src/components/timeline/TimelineEventCard.tsx`

These appear to have exports but no callers. Confirm before deleting, since they may be intended for near-term UI work.

Ignored local artifacts currently present:

- `backend/uploads/*`
- `backend/backend.log`
- `frontend/frontend.log`
- `frontend/tsconfig.tsbuildinfo`
- `frontend/playwright-report/`
- `frontend/test-results/`
- `logs/`
- `test-results/`
- `dist/`
- `backend/dist/`
- `frontend/.next/`
- `scripts/*.sh~`

These are already ignored, so they are workspace clutter rather than tracked code.

Tracked artifacts verified during review:

- `backend/prisma/seed.js`
- `backend/prisma/seed.js.map`
- `backend/prisma/seed.d.ts`
- `backend/prisma/seed.d.ts.map`
- `package.json`
- `package-lock.json`
- `frontend/package-lock.json`

## Proposed Cleanup Order

1. Move `web-push` dependency ownership to `backend/package.json`, then remove the root package if it is not a workspace.
2. Decide whether to finish or delete the expense/budget feature slice.
3. Remove tracked generated seed artifacts.
4. Remove sidebar unused imports.
5. Audit and delete confirmed unreferenced frontend components.
6. Clean ignored local artifacts from working directories as a separate housekeeping step.

## Validation Notes

The review was static. Some broad filesystem commands stalled on the SMB mount, and the Next/TypeScript bin wrappers were already observed to behave poorly on this share. After cleanup, validation should run from a local filesystem checkout or through direct package binary paths.
