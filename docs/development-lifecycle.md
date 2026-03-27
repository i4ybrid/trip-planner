# TripPlanner - Development Lifecycle Plan

## 1. Overview

This document establishes a structured development lifecycle for the TripPlanner project, moving from "vibe coding" to a repeatable, quality-focused process that ensures maintainability, testability, and sustainable growth.

### Current State
- **Status**: Working MVP with core functionality
- **Completed**: Payment Settlement UI, Avatar Upload, Chat Pagination
- **Pending**: Simplify Debt Algorithm, Media/Chat fixes
- **Issue**: No formal testing strategy, inconsistent code quality, no CI/CD

### Lifecycle Goals
1. Establish consistent development standards
2. Implement automated testing pipeline
3. Enable reliable deployments
4. Support multiple developers efficiently
5. Reduce technical debt accumulation

---

## 2. Requirements Gathering & Expression

### 2.1 Requirement Sources

| Source | Frequency | Output |
|--------|-----------|--------|
| User feedback | As needed | User stories |
| Bug reports | As needed | Bug tickets |
| Tech debt review | Monthly | Tech debt tickets |
| Feature planning | Bi-weekly | Feature backlog |
| Analytics | Monthly | Data-driven tickets |

### 2.2 Requirement Template

All requirements should follow this template:

```
## [Feature Name]

**Priority**: [Critical / High / Medium / Low]

**User Story**:
As a [type of user], I want [some goal] so that [some reason].

**Acceptance Criteria**:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

**Technical Notes**:
- [ ] Dependencies
- [ ] API changes needed
- [ ] Database schema changes

**Testing Requirements**:
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests

**Estimated Effort**: [X] points

**Status**: [Backlog / In Progress / Review / Done]
```

### 2.3 Prioritization Framework

Use the **MoSCoW** method:
- **Must have**: Required for MVP/next release
- **Should have**: Important but not critical
- **Could have**: Nice to have if time permits
- **Won't have**: Deferred to future release

### 2.4 Requirements Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Requirements   │────▶│   Grooming    │────▶│  Sprint Planning │
│   Gathering     │     │   & Prioritiza- │     │                 │
└─────────────────┘     │     tion        │     └────────┬────────┘
                        └────────┬────────┘              │
                                 │                       ▼
                                 ▼              ┌─────────────────┐
                        ┌─────────────────┐     │   Sprint Back-  │
                        │   Backlog       │────▶│   log           │
                        │   (Refined)     │     └────────┬────────┘
                        └─────────────────┘              │
                                                         ▼
                                                  ┌─────────────────┐
                                                  │   Development   │
                                                  │   Sprint        │
                                                  └────────┬────────┘
                                                           │
                                                           ▼
                                                    ┌─────────────────┐
                                                    │   Release       │
                                                    │   Candidate     │
                                                    └─────────────────┘
```

---

## 3. Technical Design Reviews

### 3.1 When to Request Design Review

- New API endpoints
- Database schema changes
- Architecture modifications
- Major feature additions
- Security-sensitive changes

### 3.2 Design Review Template

```
## Technical Design: [Feature Name]

**Author**: [Name]
**Date**: [YYYY-MM-DD]
**Status**: [Draft / Review / Approved / Rejected]

### Problem Statement
[What problem are we solving?]

### Proposed Solution
[High-level approach]

### Architecture Diagram
[Add ASCII or Mermaid diagram]

### API Changes
| Endpoint | Method | Request | Response | Auth |
|----------|--------|---------|----------|------|
| /api/... | GET/POST/PUT/DELETE | ... | ... | Yes/No |

### Database Changes
| Table | Change | Migration Type |
|-------|--------|----------------|
| users | Add avatar_url column | Add column |

### Security Considerations
[Any security implications?]

### Performance Implications
[Any performance concerns?]

### Testing Strategy
[How will this be tested?]

### Alternatives Considered
[What other options were evaluated?]

### Reviewers
- [ ] Reviewer 1
- [ ] Reviewer 2

**Approval**: [✅ Approved / ❌ Rejected / 🔨 Needs Changes]
**Approved By**: [Name]
**Date**: [YYYY-MM-DD]
```

### 3.3 Design Review Process

```
┌─────────────────┐
│  Design Draft   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Team Review    │  ← 24-48 hour review window
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
✅ Approved  🔨 Needs Changes
    │         │
    │         └───────┐
    │                 ▼
    │          ┌─────────────────┐
    │          │  Design Update  │
    │          └────────┬────────┘
    │                  │
    └──────────────────┘
```

---

## 4. Development Standards & Code Review Process

### 4.1 Code Style Standards

#### Frontend (React/Next.js)
- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Styling**: Tailwind CSS with custom theme
- **State**: Zustand for global state, React Query for server state
- **Testing**: Vitest + React Testing Library

#### Backend (Node.js/Express)
- **TypeScript**: Strict mode enabled
- **Patterns**: Service layer pattern
- **Database**: Prisma ORM
- **Validation**: Zod schemas
- **Logging**: Custom logger with levels

#### Common Standards
- **Commit Messages**: Conventional Commits format
- **Branching**: Feature branches with PRs
- **Naming**: Descriptive, consistent naming conventions
- **Documentation**: Inline comments for complex logic only

### 4.2 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### 4.3 Code Review Checklist

#### Code Quality
- [ ] Code follows project conventions
- [ ] TypeScript types are complete
- [ ] No console.log statements in production code
- [ ] Error handling is comprehensive
- [ ] Code is DRY (Don't Repeat Yourself)

#### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated (for critical flows)
- [ ] Test coverage is adequate

#### Security
- [ ] Authentication/authorization is correct
- [ ] Input validation is complete
- [ ] No sensitive data in logs
- [ ] SQL injection prevention (Prisma handles this)

#### Performance
- [ ] N+1 queries avoided
- [ ] Database indexes are appropriate
- [ ] No memory leaks
- [ ] API response times are acceptable

#### User Experience
- [ ] Loading states are displayed
- [ ] Error messages are user-friendly
- [ ] Form validation is helpful
- [ ] Accessibility considerations

### 4.4 Pull Request Process

```
┌─────────────────┐
│  Feature Branch │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Push to Remote │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create PR      │  ← Include:
└────────┬────────┘     - Description
                        - Screenshots (UI changes)
                        - Testing steps
                        - Related issues
         │
         ▼
┌─────────────────┐
│  Assign Review- │
│  ers & Labels   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI Pipeline    │  ← Automated checks
└────────┬────────┘     - Build
         │              - Tests
         │              - Lint
         │              - Typecheck
         ▼
┌─────────────────┐
│  Review Process │
└────────┬────────┘     - Code review
                        - Feedback
         │              - Approvals
    ┌────┴────┐
    │         │
    ▼         ▼
✅ Approved  ❌ Changes Requested
    │         │
    │         └───────┐
    │                 ▼
    │          ┌─────────────────┐
    │          │  Update Branch  │
    │          └────────┬────────┘
    │                  │
    └──────────────────┘
         │
         ▼
┌─────────────────┐
│  Merge to Main  │  ← Squash merge preferred
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to      │
│  Staging        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  QA Validation  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
✅ Pass     ❌ Fail
    │         │
    │         └───────┐
    │                 ▼
    │          ┌─────────────────┐
    │          │  Hotfix/Revert  │
    │          └─────────────────┘
    │
    ▼
┌─────────────────┐
│  Deploy to      │
│  Production     │
└─────────────────┘
```

---

## 5. QA Testing Procedures

### 5.1 Testing Philosophy

**Test Pyramid**:
```
                    ┌─────────────┐
                    │    E2E     │  ← 10% (Critical user journeys)
                   └─────────────┘
          ┌─────────────┴─────────────┐
          │    Integration Tests     │  ← 30% (API, DB, Socket)
         └───────────────────────────┘
┌─────────────────┴───────────────────┐
│         Unit Tests                  │  ← 60% (Business logic)
└─────────────────────────────────────┘
```

### 5.2 Unit Testing Approach

#### Backend Services
```typescript
// Example: BillSplitService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillSplitService } from './bill-split.service';
import { createStubs } from '@/lib/stubs';

describe('BillSplitService', () => {
  let service: BillSplitService;
  let stubs: ReturnType<typeof createStubs>;
  
  beforeEach(() => {
    stubs = createStubs();
    service = new BillSplitService(stubs.prisma.getImplementation());
  });
  
  describe('createBillSplit', () => {
    it('should create a bill split with equal distribution', async () => {
      const result = await service.createBillSplit({
        tripId: 'trip-1',
        title: 'Dinner',
        amount: 100,
        paidBy: 'user-1',
        splitType: 'EQUAL',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }]
      });
      
      expect(result.members).toHaveLength(2);
      expect(result.members[0].dollarAmount).toBe(50);
    });
  });
});
```

**Coverage Goals**:
- Services: 90% minimum
- Utilities: 85% minimum
- Repositories: 80% minimum

#### Frontend Components
```typescript
// Example: Avatar.test.tsx
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  it('should display initials when no src provided', () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
  
  it('should display image when src provided', () => {
    render(<Avatar src="/test.jpg" name="John" />);
    expect(screen.getByAltText('John')).toBeInTheDocument();
  });
});
```

**Coverage Goals**:
- Components: 70% minimum
- Hooks: 80% minimum

### 5.3 Integration Testing Approach

#### API Integration Tests
```typescript
// tests/api/bill-splits.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from './test-app';
import { createTestUser, createTestTrip } from './fixtures';

describe('POST /api/trips/:tripId/payments', () => {
  const app = createTestApp();
  let authToken: string;
  let tripId: string;
  
  beforeAll(async () => {
    const user = await createTestUser();
    authToken = user.token;
    tripId = (await createTestTrip(user.id)).id;
  });
  
  it('should create a bill split', async () => {
    const response = await request(app)
      .post(`/api/trips/${tripId}/payments`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Dinner',
        amount: 100,
        paidBy: 'user-1',
        splitType: 'EQUAL',
        members: [{ userId: 'user-1' }, { userId: 'user-2' }]
      });
    
    expect(response.status).toBe(201);
    expect(response.body.amount).toBe(100);
  });
});
```

#### Database Integration Tests
```typescript
// tests/db/bill-split.repository.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BillSplitRepository } from '@/lib/db/bill-split.repository';
import { PostgreSQLContainer } from '@testcontainers/postgresql';

describe('BillSplitRepository', () => {
  let container: PostgreSQLContainer;
  let repository: BillSplitRepository;
  
  beforeAll(async () => {
    container = await new PostgreSQLContainer().start();
    // Setup prisma with test database
  });
  
  afterAll(async () => {
    await container.stop();
  });
  
  it('should find bill splits by trip', async () => {
    // Seed data
    // Test query
  });
});
```

**Coverage Goals**:
- All API endpoints: 100% coverage
- Database operations: 85% coverage
- External service integrations: 80% coverage

### 5.4 E2E/Browser Testing Approach

#### Test Framework
- **Tool**: Playwright
- **Language**: TypeScript
- **Pattern**: Page Object Model

#### Example E2E Test
```typescript
// tests/e2e/payments.test.ts
import { test, expect } from '@playwright/test';

test.describe('Payment Flow', () => {
  test('should create and settle a bill split', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.click('[data-testid="google-login"]');
    await page.waitForURL('/dashboard');
    
    // 2. Navigate to trip
    await page.click('[data-testid="trip-link"]');
    await page.waitForURL(/\/trip\/.+/);
    
    // 3. Go to payments page
    await page.click('[data-testid="payments-tab"]');
    await page.waitForURL(/\/payments$/);
    
    // 4. Add new payment
    await page.click('[data-testid="add-payment-btn"]');
    await page.fill('[data-testid="payment-title"]', 'Dinner');
    await page.fill('[data-testid="payment-amount"]', '100');
    await page.click('[data-testid="submit-payment-btn"]');
    
    // 5. Mark as paid
    await page.click('[data-testid="mark-paid-btn"]');
    await page.selectOption('[data-testid="payment-method"]', 'VENMO');
    await page.click('[data-testid="confirm-payment-btn"]');
    
    // 6. Verify status changed
    await expect(page.locator('[data-testid="payment-status"]')).toContainText('PAID');
  });
  
  test('should show simplified debt calculation', async ({ page }) => {
    // Navigate to payments
    // Create multiple interdependent payments
    // Verify debt simplification algorithm works
  });
});
```

#### Critical E2E Flows to Test
1. **User Onboarding**: Signup → Create trip → Invite members
2. **Payment Flow**: Add expense → Split → Mark paid → Confirm
3. **Chat Flow**: Send message → Mention user → Upload media
4. **Activity Voting**: Propose activity → Vote → View results
5. **Memory Sharing**: Upload photo → Add caption → View in memories

**Coverage Goals**:
- Critical user journeys: 100% coverage
- Edge cases: 80% coverage
- Performance benchmarks: < 3s page load

---

## 6. Deployment Strategy

### 6.1 Environment Overview

| Environment | URL | Purpose | Access |
|-------------|-----|---------|--------|
| Development | localhost:3000 | Local development | Team only |
| Staging | staging.tripplanner.app | Pre-production testing | Team + QA |
| Production | tripplanner.app | Live app | Public |

### 6.2 Deployment Pipeline

```
┌─────────────────┐
│   Development   │
│   (Local)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI Pipeline    │  ← Automated
│   (GitHub)      │     - Build
└────────┬────────┘     - Tests
         │              - Lint
         ▼              - Typecheck
┌─────────────────┐
│   Staging       │  ← Auto-deploy
│   (Docker)      │     on merge to main
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   QA Validation │  ← Manual
│   (Test Plan)   │     - E2E tests
└────────┬────────┘     - Regression
         │              - Bug verification
    ┌────┴────┐
    │         │
    ▼         ▼
✅ Pass     ❌ Fail
    │         │
    │         └───────┐
    │                 ▼
    │          ┌─────────────────┐
    │          │  Hotfix/Revert  │
    │          └─────────────────┘
    │
    ▼
┌─────────────────┐
│  Production     │  ← Manual
│   (Docker)      │     approval
└─────────────────┘
```

### 6.3 Deployment Process

#### Staging Deployment (Automatic)
```bash
# Triggered on merge to main
1. Build Docker image
2. Push to container registry
3. Deploy to staging environment
4. Run smoke tests
5. Notify team via Slack
```

#### Production Deployment (Manual)
```bash
1. Review staging deployment logs
2. Verify all tests pass
3. Check database migrations
4. Deploy to production
5. Monitor health checks
6. Update release notes
```

### 6.4 Database Migrations

```bash
# Development
npx prisma migrate dev

# Staging
npx prisma migrate deploy

# Production (manual)
npx prisma migrate deploy
```

### 6.5 Rollback Strategy

```bash
# Docker rollback
docker service update --image tripplanner:<previous-tag> tripplanner

# Database rollback
npx prisma migrate resolve --rolled-back <migration-name>
```

### 6.6 Monitoring & Alerting

**Health Check Endpoint**: `/api/health`

**Metrics to Track**:
- API response times (p50, p95, p99)
- Error rates (HTTP 5xx)
- Database connection pool
- Memory usage
- Request rate

**Alerting Thresholds**:
- Error rate > 1% → PagerDuty
- Response time > 2s → Slack
- Database connections > 80% → Slack

---

## 7. Current Project Status

### Completed Items (✅)
1. **Payment Settlement UI** - Full payment workflow
2. **Avatar Upload** - Standardized avatar component
3. **Chat Pagination** - Efficient message loading

### Pending Items (⏳)
1. **Simplify Debt Algorithm** - Critical payment feature
2. **Media/Chat Fixes** - Image/video display issues

### Recommendations
1. **Immediate**: Fix debt simplification algorithm (high priority)
2. **Short-term**: Address media display issues (affects UX)
3. **Medium-term**: Implement testing infrastructure
4. **Long-term**: Establish CI/CD pipeline

---

## 8. Next Steps

1. **Week 1-2**: 
   - Set up testing infrastructure (Vitest, Playwright)
   - Write unit tests for critical services
   - Write integration tests for API endpoints

2. **Week 3-4**:
   - Implement E2E tests for critical flows
   - Set up GitHub Actions CI/CD pipeline
   - Configure staging environment

3. **Week 5-6**:
   - Implement debt simplification algorithm
   - Write comprehensive tests for new feature
   - Update documentation

4. **Ongoing**:
   - Maintain test coverage > 80%
   - Review and update lifecycle processes
   - Add new features with full test coverage

---

*Document Version: 1.0*
*Created: March 2026*
*Author: Project Manager*
