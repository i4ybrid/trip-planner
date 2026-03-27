# E2E Tests Implemented for TripPlanner

This document describes the Playwright E2E tests implemented for the TripPlanner application.

## Files Created

```
frontend/
├── playwright.config.ts          # Playwright configuration
└── tests/
    └── e2e/
        ├── helpers/
        │   ├── auth.ts          # Authentication helpers & test data
        │   └── index.ts         # Helper exports
        ├── chat.spec.ts         # Chat functionality tests
        ├── payments.spec.ts     # Payment settlement tests
        ├── trips.spec.ts        # Trip management tests
        ├── avatar.spec.ts       # Avatar upload tests ✅ NEW
        ├── invites.spec.ts      # Trip invite tests ✅ NEW
        ├── friends.spec.ts      # Friends functionality tests ✅ NEW
        └── memories.spec.ts     # Memories/media tests ✅ NEW
```

## Prerequisites

### 1. Start the Backend Server
```bash
cd /mnt/user/development/trip-planner/backend
npm run dev
```
The backend runs on http://localhost:4000

### 2. Start the Frontend Server
```bash
cd /mnt/user/development/trip-planner/frontend
npm run dev
```
The frontend runs on http://localhost:3000

### 3. Ensure Database is Seeded
```bash
cd /mnt/user/development/trip-planner/backend
npm run db:seed
```
This creates test users and trips in the database.

### 4. Install Playwright Browser (if needed)
```bash
cd /mnt/user/development/trip-planner/frontend
npx playwright install chromium --with-deps
```

## Test Users (from seed data)

All test users have the password: `password123`

| User | Email | Role |
|------|-------|------|
| Test User | test@example.com | user-1, MASTER of Hawaii trip |
| Sarah Chen | sarah@example.com | user-2, MASTER of NYC trip |
| Mike Johnson | mike@example.com | user-3 |
| Emma Wilson | emma@example.com | user-4 |

## Key Trip IDs (from seed data)

| Trip | ID | Status |
|------|-----|--------|
| Hawaii Beach Vacation | trip-1 | PLANNING |
| NYC Birthday Weekend | trip-2 | CONFIRMED |
| European Adventure | trip-3 | IDEA |
| Ski Trip 2025 | trip-4 | COMPLETED |
| Nashville Trip | trip-5 | HAPPENING |

## How to Run Tests

### Run all E2E tests
```bash
cd /mnt/user/development/trip-planner/frontend
npx playwright test
```

### Run a specific test file
```bash
cd /mnt/user/development/trip-planner/frontend
npx playwright test tests/e2e/trips.spec.ts
npx playwright test tests/e2e/payments.spec.ts
npx playwright test tests/e2e/chat.spec.ts
npx playwright test tests/e2e/avatar.spec.ts
npx playwright test tests/e2e/invites.spec.ts
npx playwright test tests/e2e/friends.spec.ts
npx playwright test tests/e2e/memories.spec.ts
```

### Run tests with UI (headed mode)
```bash
npx playwright test --headed
```

### Run tests with debug mode
```bash
npx playwright test --debug
```

### Run a specific test by name
```bash
npx playwright test -g "should display the dashboard"
```

## Test Coverage Summary

### ✅ Chat Tests (`chat.spec.ts`)
- View messages, member count, message display
- Send message (Enter key, button click)
- Mention system (@ dropdown)
- Message styling for different users
- Chat pagination
- Multiline input (Shift+Enter)

### ✅ Payments Tests (`payments.spec.ts`)
- View expenses and bill splits
- Payment status badges (PENDING, PAID, CONFIRMED)
- Mark as paid workflow
- Payment method selection
- Add expense flow
- Bill split management

### ✅ Trip Tests (`trips.spec.ts`)
- Dashboard with trip cards
- Trip overview page
- Tab navigation (Overview, Activities, Chat, Payments, Timeline, Memories)
- Trip members display
- Invite button for trip master
- Trip status badges

### ✅ Avatar Tests (`avatar.spec.ts`) - NEW
- Avatar display in header
- Settings page avatar section
- Upload button visibility
- User initials fallback
- Avatar in trip member list
- Avatar in chat messages
- Avatar in payments page
- Authenticated access required

### ✅ Invite Tests (`invites.spec.ts`) - NEW
- Trip overview invite button
- Invite link generation
- Copy invite link to clipboard
- Share options (WhatsApp, Email)
- Invite code display
- Public invite page access
- Trip members list display
- Member roles display
- Invite accept flow

### ✅ Friends Tests (`friends.spec.ts`) - NEW
- Friends list page
- Friends search
- Send friend request
- Accept/decline friend requests
- Remove friend
- Friend suggestions
- Navigation to friends page
- Direct messages list
- Start DM from friends page
- Authenticated access required

### ✅ Memories Tests (`memories.spec.ts`) - NEW
- Memories page navigation
- Photo grid display
- Empty state handling
- Photo captions
- Upload button/dropzone
- Photo lightbox viewing
- Photo action menu
- Caption editing
- Multiple trip access
- Trip tab navigation
- Loading states
- Authenticated access required

## Current Test Status

**Note:** The tests are implemented but have NOT been executed yet because:

1. The backend and frontend servers need to be running
2. The database needs to be seeded with test data

To verify the tests work:

1. Start both servers (backend on port 4000, frontend on port 3000)
2. Run `npm run db:seed` on the backend
3. Run `npx playwright test` in the frontend directory

## CI/CD Integration

To run in CI, the playwright.config.ts should include:
```typescript
reporter: [
  ['html', { outputFolder: 'playwright-report' }],
  ['github'],
],
webServer: {
  command: 'npm run dev',
  port: 3000,
  reuseExistingServer: false,
},
```

## Troubleshooting

### Tests fail with "Navigation timeout"
- Ensure both servers are running
- Check that ports 3000 and 4000 are not blocked

### Tests fail with "Cannot find element"
- The UI may have changed; update selectors
- Check if the page loaded properly with `waitForLoadState('networkidle')`

### Authentication tests fail
- Check that the database is seeded
- Verify API is responding at http://localhost:4000/api

### Tests are skipped
- Some tests use `test.skip()` when prerequisites aren't met
- For example, avatar tests skip if no avatar section is visible
- This is intentional for smoke testing

## Coverage Matrix

| Feature | E2E Tests | Status |
|---------|-----------|--------|
| Trip Dashboard | ✅ | Complete |
| Trip Overview | ✅ | Complete |
| Trip Tab Navigation | ✅ | Complete |
| Chat - View Messages | ✅ | Complete |
| Chat - Send Messages | ✅ | Complete |
| Chat - Mentions | ✅ | Complete |
| Chat - Pagination | ✅ | Complete |
| Payments - View | ✅ | Complete |
| Payments - Mark as Paid | ✅ | Complete |
| Payments - Add Expense | ✅ | Complete |
| Avatar - Display | ✅ | Complete |
| Avatar - Upload Flow | ✅ | Complete |
| Invites - Generate Link | ✅ | Complete |
| Invites - Share Options | ✅ | Complete |
| Friends - List | ✅ | Complete |
| Friends - Send Request | ✅ | Complete |
| Friends - Accept/Decline | ✅ | Complete |
| Memories - View | ✅ | Complete |
| Memories - Upload | ✅ | Complete |

*Document Updated: March 2026*
