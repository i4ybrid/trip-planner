# TripPlanner TODO

## Backend Implementation Tasks

### Phase 1: Database & API Foundation

- [ ] **1.1** Set up Prisma schema with all entities (User, Trip, TripMember, Activity, Vote, Invite, Booking, TripMessage, MediaItem, Notification)
- [ ] **1.2** Create database migrations
- [ ] **1.3** Implement authentication with NextAuth.js (providers: Google, Apple, Email)
- [ ] **1.4** Create user API endpoints (CRUD profile, settings)
- [ ] **1.5** Implement session management

### Phase 2: Trip Management

- [ ] **2.1** Trip CRUD API endpoints
- [ ] **2.2** Trip membership management (add/remove members, roles)
- [ ] **2.3** Invite system with token generation and email/SMS sending
- [ ] **2.4** Invite acceptance flow
- [ ] **2.5** Trip status workflow logic

### Phase 3: Activities & Voting

- [ ] **3.1** Activity/Proposal CRUD API
- [ ] **3.2** Vote API (create vote, change vote)
- [ ] **3.3** Voting deadline and automatic winner selection
- [ ] **3.4** Booking creation from winning activities

### Phase 4: Chat & Real-time

- [ ] **4.1** Message CRUD API
- [ ] **4.2** @mention functionality
- [ ] **4.3** Socket.io integration for real-time chat
- [ ] **4.4** Typing indicators and read receipts

### Phase 5: Payments

- [ ] **5.1** Expense/Payment CRUD API
- [ ] **5.2** Bill splitting logic (equal, shares, percentage, custom)
- [ ] **5.3** Tax/tip calculation
- [ ] **5.4** Payment link generation (Venmo, PayPal, Zelle)
- [ ] **5.5** Settlement calculation

### Phase 6: Media & Memories

- [ ] **6.1** Media upload to S3/cloud storage
- [ ] **6.2** Media metadata CRUD
- [ ] **6.3** Thumbnail generation for videos
- [ ] **6.4** Download functionality

### Phase 7: Notifications

- [ ] **7.1** Notification CRUD and marking as read
- [ ] **7.2** Push notification setup (WebPush)
- [ ] **7.3** Email notification service integration
- [ ] **7.4** SMS notification (optional, Twilio)

### Phase 8: Testing & Data

- [ ] **8.1** Create comprehensive seed data script
  - [ ] Multiple users with profiles
  - [ ] Various trip states (planning, confirmed, completed)
  - [ ] Activities with votes
  - [ ] Chat messages with @mentions
  - [ ] Expenses with different split types
  - [ ] Media items with captions
- [ ] **8.2** Unit tests for core business logic
- [ ] **8.3** API integration tests
- [ ] **8.4** E2E tests with Playwright

### Phase 9: Polish & Deployment

- [ ] **9.1** Error handling and validation
- [ ] **9.2** Rate limiting
- [ ] **9.3** API documentation (Swagger/OpenAPI)
- [ ] **9.4** Docker setup verification
- [ ] **9.5** CI/CD pipeline setup

---

## Frontend Cleanup Tasks

- [ ] **F1** Remove unused imports across all pages
- [ ] **F2** Add loading states and skeletons where needed
- [ ] **F3** Implement proper form validation with error messages
- [ ] **F4** Add empty states for all list views
- [ ] **F5** Mobile responsiveness verification across all pages

---

## Priority Order

1. **High Priority**: 1.1 → 1.2 → 1.3 → 2.1 → 2.2 → 8.1 (seed data)
2. **Medium Priority**: 2.3 → 2.4 → 3.1 → 3.2 → 4.1 → 4.2
3. **Lower Priority**: 5.x → 6.x → 7.x → 8.2+ → 9.x

---

## Notes

- Frontend currently uses mock data in `/services/mock-api.ts`
- Backend will need to replace mock implementations
- Consider keeping mock mode for development without live backend
