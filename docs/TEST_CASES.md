# Test Cases

> Extracted from DESIGN.md Section 10. Testing strategy, test types, and all test files.

---

## Testing Philosophy

- **Test Pyramid**: More unit tests at base, fewer E2E at top
- **Fast Feedback**: Unit tests < 1s, integration < 10s
- **Isolation**: All external services stubbed during unit testing (PrismaStub via factory injection)
- **Realism**: Integration tests use real dependencies with test databases

### Test Pyramid

```
                    ┌─────────────┐
                    │    E2E     │  ← 10% (Critical user journeys via Playwright)
                   └─────────────┘
          ┌─────────────┴─────────────┐
          │    Integration Tests     │  ← 30% (API via Supertest, DB via testcontainers)
         └───────────────────────────┘
┌─────────────────┴───────────────────┐
│         Unit Tests                  │  ← 60% (Business logic via Vitest + PrismaStub)
└─────────────────────────────────────┘
```

---

## Test Infrastructure

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Testing | Vitest | Fast unit tests with Jest-compatible API |
| API Testing | Supertest | HTTP integration tests |
| Database | testcontainers-node | PostgreSQL in Docker |
| Mocking | Mock Service Worker (MSW) | API mocking for frontend |
| E2E | Playwright | Browser automation |
| Coverage | Vitest + c8 | Code coverage reports |
| Fixtures | Factory Bot | Test data generation |

### Prisma Client Factory Pattern

Services import `prisma` from `lib/prisma` which delegates to a factory:

```typescript
// src/lib/prisma-client.ts
let prismaInstance: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (!prismaInstance) prismaInstance = new PrismaClient();
  return prismaInstance;
}

export function setPrisma(client: PrismaClient): void {
  prismaInstance = client;
}

export function resetPrisma(): void {
  prismaInstance = null;
}
```

Tests call `setPrisma(mockPrisma)` in `beforeEach` to inject the stub.

---

## Backend Unit Tests (Vitest + PrismaStub)

**Location:** `backend/src/`

### Services
```
backend/src/services/
├── debtSimplifier.service.test.ts     # Debt simplification calculations
├── milestone.service.test.ts          # Milestone auto-generation, triggers
├── notification.service.test.ts       # Notification CRUD, mark read
├── activity.service.test.ts           # Activity CRUD, voting logic
├── message.service.test.ts            # Messages, reactions, pagination
├── trip.service.test.ts               # Trip lifecycle, status transitions
└── invite.service.test.ts            # Invite creation, accept/decline
```

### Routes
```
backend/src/routes/
└── messages.test.ts                   # Message API routes (integration)
```

### Running Backend Tests
```bash
cd backend
npx vitest run                           # All tests
npx vitest run --coverage                # With coverage
npx vitest run src/services/             # Service tests only
npx vitest run src/services/milestone.service.test.ts  # Specific file
```

**Current Status:** 87 of 111 tests passing. Remaining failures are stub completeness issues.

---

## Frontend E2E Tests (Playwright)

**Location:** `frontend/tests/e2e/`

```
frontend/tests/e2e/
├── dashboard.spec.ts                  # Dashboard load, trip cards, navigation
├── trip-workflow.spec.ts              # Trip status IDEA→COMPLETED lifecycle
├── member-management.spec.ts         # Settings, roles, invites
├── milestone-full.spec.ts             # Milestone strip, payment requests
├── invite-full.spec.ts                # Accept/decline, pending invites
├── payments-full.spec.ts              # Bill splits, debt simplification
├── activities-voting.spec.ts          # Activity proposals, voting
├── chat-realtime.spec.ts             # Messages, reactions
├── memories.spec.ts                   # Photo upload, captions, delete
├── notifications.spec.ts              # Notification bell, mark read
├── social-login.spec.ts               # OAuth login buttons, email collision
├── trip-settings.spec.ts              # Settings modal, kebab menus
├── trip-invite-debug.spec.ts          # Invite flow debugging
├── activities.spec.ts                # Activity CRUD
├── api-cache.spec.ts                  # API caching behavior
├── auth.spec.ts                       # Authentication flow
├── avatar.spec.ts                     # Avatar upload/remove
├── calendar.spec.ts                  # Calendar view
├── chat.spec.ts                      # Chat messaging
├── dashboard-member-count.spec.ts    # Member count on dashboard
├── friends.spec.ts                   # Friends list, requests
├── invite-full.spec.ts               # Full invite workflow
├── invites.spec.ts                   # Invite accept/decline
├── messages.spec.ts                  # Message handling
├── milestone.spec.ts                 # Milestone basics
├── payment-optimistic-update.spec.ts # Optimistic payment updates
├── payments.spec.ts                  # Payment CRUD
├── settings.spec.ts                  # User settings
├── social-login.spec.ts              # Google/Facebook OAuth
├── trips.spec.ts                     # Trip CRUD
└── trip-workflow.spec.ts            # Full trip lifecycle
```

### Running Frontend E2E Tests
```bash
cd frontend
npx playwright test                          # All E2E tests
npx playwright test tests/e2e/dashboard.spec.ts  # Specific file
npx playwright test --ui                     # Run with UI
npx playwright test --project=chromium       # Specific browser
```

---

## Integration Tests (Supertest)

**Location:** `tests/api/` (not yet implemented per DESIGN.md)

```typescript
// Example structure
tests/api/
├── trips.test.ts     # Trip CRUD, status transitions
├── invites.test.ts   # Invite flow
├── payments.test.ts  # Bill split operations
└── messages.test.ts  # Chat messaging
```

---

## Socket.io Tests (not yet implemented per DESIGN.md)

```typescript
// Example structure
tests/sockets/
└── chat.test.ts      # Real-time messaging
```

---

## MSW Frontend Mock Handlers (not yet fully implemented per DESIGN.md)

**Location:** `src/mocks/`

```typescript
src/mocks/
├── handlers.ts       # API endpoint stubs
└── browser.ts        # MSW worker setup
```

---

## Coverage Goals

| Category | Target | Minimum |
|----------|--------|---------|
| Unit Tests | 90% | 80% |
| API Routes | 85% | 75% |
| Services | 90% | 85% |
| Components | 70% | 60% |
| E2E | Key flows | Critical paths |

---

## CI/CD Pipeline

```yaml
# .github/workflows/test.yml
jobs:
  unit-tests:
    run: npx vitest run --coverage

  integration-tests:
    services:
      postgres:
        image: postgres:15
    run: npx vitest run --config vitest.integration.config.ts

  e2e-tests:
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npx playwright test
```

---

## Running All Tests

```bash
# Backend unit tests
cd backend && npx vitest run

# Frontend E2E tests
cd frontend && npx playwright test

# Full test suite (from project root)
# Run: cd backend && npm run test:unit
```

---

*Extracted from DESIGN.md Section 10 — Testing Strategy*
*For the complete technical design, see [DESIGN.md](../DESIGN.md)*
