# TripPlanner - Technical Design Document

## 1. Overview

**TripPlanner** is a collaborative trip planning application that enables groups of friends to plan, organize, and execute trips together—from casual dinner outings to week-long adventures.

### Core Value Proposition
- Eliminate the chaos of group chat trip planning
- Centralize all trip details, voting, bookings, and payments in one place
- Reduce friction in collecting payments and confirming bookings
- Create lasting memories through shared photo/video albums

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                       │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   Next.js Web   │  │   iOS App       │  │  Android App    │         │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘         │
└───────────┼─────────────────────┼─────────────────────┼─────────────────┘
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY (Next.js API Routes)               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │  Authentication │ Trip Management │ Invites │ Activities │ Chat  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   PostgreSQL    │      │    Socket.io   │      │      S3/       │
│   Database      │      │    Server      │      │   File Storage │
└─────────────────┘      └─────────────────┘      └─────────────────┘
          │                         │                         │
          │                         ▼                         │
          │               ┌─────────────────┐               │
          │               │   WebPush       │               │
          │               │   Server        │               │
          │               └─────────────────┘               │
          │                                                     │
          └─────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │    External Services          │
                    │  • Venmo API                  │
                    │  • PayPal API                 │
                    │  • Zelle (manual link)        │
                    │  • Google OAuth               │
                    │  • Apple OAuth                │
                    │  • Facebook OAuth             │
                    │  • SendGrid (Email)           │
                    └───────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Web | Next.js 14 (App Router) | React UI with SSR |
| Frontend Mobile | React Native | iOS & Android apps |
| Backend | Node.js + Express | API logic (embedded in Next.js) |
| Database | PostgreSQL + Prisma | Relational data |
| Real-time | Socket.io | Chat & live updates |
| Push Notifications | WebPush + FCM | Browser & mobile notifications |
| Auth | NextAuth.js | Social login providers |
| File Storage | AWS S3 | Photos, videos |
| Email | SendGrid | Transactional emails |

---

## 3. Database Schema

### Entity Relationship Diagram

```
┌──────────────┐       ┌─────────────────┐       ┌──────────────┐
│    User     │       │     Trip        │       │   Activity   │
├──────────────┤       ├─────────────────┤       ├──────────────┤
│ id           │◄──────│ trip_master_id │◄──────│ id           │
│ email        │       │ id             │       │ trip_id      │
│ name         │       │ name           │       │ title        │
│ avatar_url   │       │ description    │       │ description  │
│ phone        │       │ destination    │       │ start_time   │
│ venmo        │       │ start_date     │       │ end_time     │
│ paypal       │       │ end_date       │       │ location     │
│ zelle        │       │ status         │       │ cost         │
│ created_at   │       │ cover_image    │       │ category     │
└──────┬───────┘       │ created_at     │       │ created_by   │
       │               └────────┬────────┘       └──────┬───────┘
       │                        │                        │
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐       ┌─────────────────┐       ┌──────────────────┐
│  TripMember  │       │     Invite      │       │      Vote       │
├──────────────┤       ├─────────────────┤       ├──────────────────┤
│ id           │       │ id              │       │ id               │
│ trip_id      │       │ trip_id         │       │ activity_id      │
│ user_id      │       │ token           │       │ user_id          │
│ role         │       │ email           │       │ option_id        │
│ status       │       │ status          │       │ created_at       │
│ joined_at    │       │ expires_at      │       └──────────────────┘
│ payment_status│      │ created_by      │
└──────────────┘       └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐       ┌──────────────────┐
                    │  InviteChannel  │       │     Booking      │
                    ├─────────────────┤       ├──────────────────┤
                    │ id              │       │ id               │
                    │ invite_id       │       │ trip_id          │
                    │ channel         │       │ activity_id      │
                    │ external_id     │       │ booked_by        │
                    └─────────────────┘       │ confirmation_num │
                                              │ status          │
                                              │ receipt_url     │
                                              └──────────────────┘

┌──────────────────┐       ┌─────────────────┐       ┌────────────────┐
│  TripMessage    │       │   MediaItem     │       │  Notification  │
├──────────────────┤       ├─────────────────┤       ├────────────────┤
│ id               │       │ id              │       │ id             │
│ trip_id          │       │ trip_id         │       │ user_id        │
│ user_id          │       │ uploader_id     │       │ trip_id        │
│ content          │       │ type           │       │ type           │
│ created_at       │       │ url            │       │ title         │
│ message_type     │       │ thumbnail_url  │       │ body          │
└──────────────────┘       │ activity_id     │       │ read          │
                          │ created_at      │       │ created_at    │
                          └─────────────────┘       └────────────────┘
```

### Detailed Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum TripStatus {
  IDEA        // "Feelers" - gauging interest
  PLANNING    // Active planning & voting
  CONFIRMED   // Trip confirmed, collecting payments
  IN_PROGRESS // Trip has started
  COMPLETED   // Trip finished
  CANCELLED   // Trip cancelled
}

enum MemberRole {
  MASTER      // Trip master/owner
  ORGANIZER   // Can make bookings
  MEMBER      // Standard member
  VIEWER      // Can view, can't vote/book
}

enum MemberStatus {
  INVITED
  DECLINED
  MAYBE
  CONFIRMED
  REMOVED
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

enum BookingStatus {
  PROPOSED
  CONFIRMED
  CANCELLED
  REFUNDED
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  SYSTEM  // Automated messages
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String
  avatarUrl     String?
  phone         String?
  venmo         String?
  paypal        String?
  zelle         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  memberships   TripMember[]
  createdTrips  Trip[]         @relation("TripMaster")
  activities    Activity[]
  votes         Vote[]
  messages      TripMessage[]
  mediaItems    MediaItem[]
  notifications Notification[]
  sentInvites   Invite[]      @relation("InviteSender")
}

model Trip {
  id            String      @id @default(cuid())
  name          String
  description   String?
  destination   String?
  startDate     DateTime?
  endDate       DateTime?
  coverImage    String?
  status        TripStatus  @default(IDEA)
  tripMasterId  String
  
  tripMaster    User        @relation("TripMaster", fields: [tripMasterId], references: [id])
  members       TripMember[]
  invites       Invite[]
  activities    Activity[]
  bookings      Booking[]
  messages      TripMessage[]
  mediaItems    MediaItem[]
  notifications Notification[]
  
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model TripMember {
  id              String        @id @default(cuid())
  tripId          String
  userId          String
  role            MemberRole    @default(MEMBER)
  status          MemberStatus @default(INVITED)
  paymentStatus   String?       // "pending", "partial", "paid"
  paymentAmount   Decimal?      @db.Decimal(10, 2)
  paymentConfirmedAt DateTime?
  joinedAt        DateTime      @default(now())
  
  trip            Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [userId], references: [id])
  
  @@unique([tripId, userId])
}

model Invite {
  id            String        @id @default(cuid())
  tripId        String
  token         String        @unique
  email         String?
  phone         String?
  status        InviteStatus @default(PENDING)
  expiresAt     DateTime
  sentById      String
  
  trip          Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  sentBy        User          @relation("InviteSender", fields: [sentById], references: [id])
  channels      InviteChannel[]
  
  createdAt     DateTime      @default(now())
}

model InviteChannel {
  id          String    @id @default(cuid())
  inviteId    String
  channel     String    // "email", "whatsapp", "sms", "messenger", "telegram", "google_chat", "link"
  externalId  String?   // Message ID from external service
  
  invite      Invite    @relation(fields: [inviteId], references: [id], onDelete: Cascade)
}

model Activity {
  id          String    @id @default(cuid())
  tripId      String
  title       String
  description String?
  location    String?
  startTime   DateTime?
  endTime     DateTime?
  cost        Decimal?  @db.Decimal(10, 2)
  currency    String    @default("USD")
  category    String    // "accommodation", "excursion", "restaurant", "transport", "activity", "other"
  proposedBy  String
  
  trip        Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  proposer    User      @relation(fields: [proposedBy], references: [id])
  votes       Vote[]
  bookings    Booking[]
  mediaItems  MediaItem[]
  
  createdAt   DateTime  @default(now())
}

model Vote {
  id          String    @id @default(cuid())
  activityId  String
  userId      String
  option      String    // "yes", "no", "maybe"
  
  activity    Activity  @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
  
  @@unique([activityId, userId])
}

model Booking {
  id              String        @id @default(cuid())
  tripId          String
  activityId      String?
  bookedBy        String
  confirmationNum String?
  status          BookingStatus @default(PROPOSED)
  receiptUrl      String?
  notes           String?
  
  trip            Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  activity        Activity?     @relation(fields: [activityId], references: [id])
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model TripMessage {
  id            String        @id @default(cuid())
  tripId        String
  userId        String
  content       String
  messageType   MessageType   @default(TEXT)
  
  trip          Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user          User          @relation(fields: [userId], references: [id])
  
  createdAt     DateTime      @default(now())
}

model MediaItem {
  id            String    @id @default(cuid())
  tripId        String
  uploaderId    String
  type          String    // "image", "video"
  url           String
  thumbnailUrl  String?
  activityId    String?
  caption       String?
  
  trip          Trip      @relation(fields: [tripId], references: [id], onDelete: Cascade)
  uploader      User      @relation(fields: [uploaderId], references: [id])
  activity      Activity? @relation(fields: [activityId], references: [id])
  
  createdAt     DateTime  @default(now())
}

model Notification {
  id          String    @id @default(cuid())
  userId      String
  tripId      String?
  type        String    // "invite", "vote", "booking", "payment", "message", "reminder", "milestone"
  title       String
  body        String
  actionUrl   String?
  read        Boolean   @default(false)
  
  user        User      @relation(fields: [userId], references: [id])
  trip        Trip?     @relation(fields: [tripId], references: [id])
  
  createdAt   DateTime  @default(now())
}
```

---

## 4. API Endpoints

### Authentication
```
POST   /api/auth/[...nextauth]    NextAuth handlers
GET    /api/auth/session          Get current session
POST   /api/auth/signout          Sign out
```

### Users
```
GET    /api/users/me              Get current user profile
PATCH  /api/users/me              Update profile (name, avatar, payment handles)
GET    /api/users/:id             Get user by ID (public info only)
```

### Trips
```
GET    /api/trips                 List user's trips
POST   /api/trips                 Create new trip
GET    /api/trips/:id             Get trip details
PATCH  /api/trips/:id             Update trip (name, dates, status)
DELETE /api/trips/:id             Delete trip
POST   /api/trips/:id/status      Change trip status
```

### Trip Members
```
GET    /api/trips/:id/members     List trip members
POST   /api/trips/:id/members      Add member (by user ID)
PATCH  /api/trips/:id/members/:userId  Update member role/status
DELETE /api/trips/:id/members/:userId  Remove member
POST   /api/trips/:id/members/:userId/confirm-payment  Trip master confirms payment
```

### Invites
```
GET    /api/trips/:id/invites     List invites for trip
POST   /api/trips/:id/invites     Create invite
GET    /api/invites/:token        Accept invite (public)
POST   /api/invites/:token/accept Accept invite
POST   /api/invites/:token/decline Decline invite
DELETE /api/invites/:id           Revoke invite
```

### Activities
```
GET    /api/trips/:id/activities  List activities
POST   /api/trips/:id/activities  Propose activity
PATCH  /api/activities/:id        Update activity
DELETE /api/activities/:id        Remove activity
```

### Voting
```
GET    /api/activities/:id/votes  Get votes for activity
POST   /api/activities/:id/votes  Cast vote
DELETE /api/activities/:id/votes   Remove vote
```

### Bookings
```
GET    /api/trips/:id/bookings    List bookings
POST   /api/trips/:id/bookings    Create booking
PATCH  /api/bookings/:id          Update booking (confirm/cancel)
DELETE /api/bookings/:id          Delete booking
```

### Messages (Chat)
```
GET    /api/trips/:id/messages    Get chat history
POST   /api/trips/:id/messages    Send message
DELETE /api/messages/:id          Delete message
```

### Media
```
GET    /api/trips/:id/media       List media items
POST   /api/trips/:id/media       Upload media
DELETE /api/media/:id             Delete media
```

### Notifications
```
GET    /api/notifications         List notifications
PATCH  /api/notifications/:id     Mark as read
POST   /api/notifications/mark-all-read  Mark all as read
```

---

## 5. Shareable Invite Links

### Deep Link Format
```
https://tripplanner.app/invite/{token}
```

### Universal Link Structure
```
tripplanner://invite/{token}
```

### Channel-Specific Sharing
| Channel | Format | Implementation |
|---------|--------|----------------|
| Direct Link | `https://tripplanner.app/invite/{token}` | Copy to clipboard |
| WhatsApp | `wa.me` API or share text | Pre-filled message |
| SMS | `sms:` URI | Pre-filled text |
| Messenger | Messenger share dialog | OpenGraph tags |
| Instagram | Share via DM (link) | Web URL |
| Google Chat | Card format with buttons | Chat API |
| Telegram | `t.me` or bot API | Share button |
| Email | `mailto:` with HTML body | SendGrid template |

### Invite Response Flow
```
1. User receives invite link
2. If out → Auth logged flow → Redirect to invite
3. If logged in → Show invite preview
4. User accepts → Added to trip as MEMBER
5. Redirect to trip dashboard
```

---

## 6. User Interface Structure

### Page Hierarchy
```
/
├── /login                    # Auth pages (handled by NextAuth)
├── /dashboard                # Main dashboard
│   ├── /trips                # List of trips
│   └── /trips/new            # Create trip wizard
├── /trip/[id]                # Trip detail (tabbed)
│   ├── /trip/[id]/overview  # Trip overview
│   ├── /trip/[id]/planning  # Activities & voting
│   ├── /trip/[id]/bookings # Bookings
│   ├── /trip/[id]/chat     # Group chat
│   ├── /trip/[id]/photos   # Photos & videos
│   └── /trip/[id]/payments # Payment tracking
├── /trip/[id]/settings     # Trip settings
├── /invite/[token]         # Public invite acceptance
├── /profile                # User profile
└── /settings               # App settings
```

### Trip Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  TripPlanner           [Notifications] [Profile] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🎯 Active & Upcoming Trips                     │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  [Trip Card]  [Trip Card]  [+ New Trip]         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📋 Past Trips                                  │   │
│  ├─────────────────────────────────────────────────┤   │
│  │  [Trip Card]  [Trip Card]                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Trip Detail Layout (Mobile-First)
```
┌─────────────────────────────────────────────────────────┐
│  [Cover Image with Gradient Overlay]                    │
│  Trip Name                          [Settings] [Share] │
│  📍 Location  |  📅 Dates  |  👥 X members              │
├─────────────────────────────────────────────────────────┤
│  [Overview] [Planning] [Bookings] [Chat] [Photos] [$$$]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tab Content Area                                       │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Key Features Implementation

### Trip Status Workflow
```
IDEA ──→ PLANNING ──→ CONFIRMED ──→ IN_PROGRESS ──→ COMPLETED
  │         │              │              │            │
  │         │              │              │            │
  ▼         ▼              ▼              ▼            ▼
"Feelers" "Voting"   "Collect $    "Trip Active" "Settle Up"
           & Plan       & Book"
```

### Milestones & Notifications
| Trigger | Notification | Type |
|---------|---------------|------|
| Invite sent | "You've been invited to..." | invite |
| Vote on activity | "Vote now on..." | vote |
| Booking confirmed | "Booking confirmed:..." | booking |
| Payment requested | "Please send $XX via..." | payment |
| Payment confirmed | "Payment confirmed!" | payment |
| Trip starting soon | "Trip starts in X days!" | reminder |
| New message | "New message in..." | message |
| Photo uploaded | "New photos from..." | milestone |

### Payment Flow
```
Trip Master creates booking → System calculates shares
        ↓
Members see "Pay $XX" → Choose Venmo/PayPal/Zelle
        ↓
Member sends payment externally → Returns to app
        ↓
Trip Master confirms receipt → Status updates to "paid"
```

### Chat Features
- Real-time messaging via Socket.io
- Image/video sharing
- Trip-specific channels
- System messages for important events
- Typing indicators
- Read receipts

---

## 8. Mobile App Architecture

### React Native Structure
```
TripPlannerMobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/           # Screen components
│   ├── navigation/        # React Navigation setup
│   ├── services/          # API & Socket services
│   ├── hooks/             # Custom hooks
│   ├── store/             # State management (Zustand)
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── ios/
├── android/
└── App.tsx
```

### Native Features
- Push notifications (FCM)
- Camera & gallery access
- Share sheet integration
- Deep linking
- Biometric auth
- Offline support

---

## 9. Security Considerations

- **Authentication**: NextAuth.js with secure session handling
- **Authorization**: Role-based access control (MASTER, ORGANIZER, MEMBER, VIEWER)
- **Data**: All sensitive payment info encrypted at rest
- **API**: Rate limiting, CSRF protection, input validation
- **Media**: Signed URLs with expiration for S3 uploads

---

## 10. Testing Strategy

### Testing Philosophy
- **Test Pyramid**: More unit tests at the base, fewer E2E tests at the top
- **Fast Feedback**: Unit tests run in < 1 second, integration in < 10 seconds
- **Isolation**: All external services stubbed during unit testing
- **Realism**: Integration tests use real dependencies with test databases

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

---

### 10.1 Test Infrastructure

#### Tools & Frameworks
| Layer | Tool | Purpose |
|-------|------|---------|
| Unit Testing | Vitest | Fast unit tests with Jest-compatible API |
| API Testing | Supertest | HTTP integration tests |
| Database | testcontainers-node | PostgreSQL in Docker |
| Mocking | Mock Service Worker (MSW) | API mocking for frontend |
| E2E | Playwright | Browser automation |
| Coverage | Vitest + c8 | Code coverage reports |
| Fixtures | Factory Bot | Test data generation |

#### Test Database Strategy
```typescript
// Separate test database for isolation
DATABASE_URL="postgresql://test:test@localhost:5432/tripplanner_test"

// Each test gets a fresh database via testcontainers
// or uses database transactions with rollback
```

---

### 10.2 Unit Testing with Backend Stubs

#### Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    TEST LAYER                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌────────────┐  │
│  │   Unit      │    │  Unit       │    │  Unit      │  │
│  │   Tests     │    │  Tests      │    │  Tests     │  │
│  │             │    │             │    │            │  │
│  │ [Service A] │    │ [Service B] │    │ [Service C]│  │
│  └──────┬──────┘    └──────┬──────┘    └──────┬─────┘  │
│         │                  │                   │        │
│         ▼                  ▼                   ▼        │
│  ┌─────────────────────────────────────────────────┐   │
│  │              STUB LAYER                          │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │   │
│  │  │ Prisma   │  │ Socket   │  │ SendGrid     │ │   │
│  │  │ Stub     │  │ Stub     │  │ Stub         │ │   │
│  │  └──────────┘  └──────────┘  └──────────────┘ │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │   │
│  │  │ S3 Stub │  │ Auth     │  │ Notification │ │   │
│  │  │          │  │ Stub     │  │ Stub         │ │   │
│  │  └──────────┘  └──────────┘  └──────────────┘ │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Stub Implementation Pattern
```typescript
// src/lib/stubs/index.ts

// Base stub interface
interface Stub<T> {
  getImplementation(): T;
  mockReset(): void;
}

// Prisma Stub - in-memory mock of database
class PrismaStub implements Stub<PrismaClient> {
  private users: Map<string, User> = new Map();
  private trips: Map<string, Trip> = new Map();
  
  getImplementation() {
    return {
      user: {
        findUnique: vi.fn((args) => Promise.resolve(this.users.get(args.where.id))),
        create: vi.fn((args) => {
          const user = { id: crypto.randomUUID(), ...args.data };
          this.users.set(user.id, user);
          return Promise.resolve(user);
        }),
        // ... other prisma methods
      },
      trip: {
        findMany: vi.fn(() => Promise.resolve([...this.trips.values()])),
        // ... other prisma methods
      }
    } as unknown as PrismaClient;
  }
  
  mockReset() {
    this.users.clear();
    this.trips.clear();
  }
}

// Socket.io Stub
class SocketStub implements Stub<Server> {
  private rooms: Map<string, Set<string>> = new Map();
  
  getImplementation() {
    return {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn(),
      in: vi.fn().mockReturnThis(),
    } as unknown as Server;
  }
}

// SendGrid Stub
class SendGridStub implements Stub<any> {
  emails: any[] = [];
  
  getImplementation() {
    return {
      send: vi.fn(async (msg) => {
        this.emails.push(msg);
        return [{ statusCode: 202 }];
      })
    };
  }
  
  mockReset() {
    this.emails = [];
  }
}

// Export factory
export function createStubs() {
  return {
    prisma: new PrismaStub(),
    socket: new SocketStub(),
    sendGrid: new SendGridStub(),
    s3: {
      upload: vi.fn(() => Promise.resolve({ Location: 'https://test-bucket.s3.amazonaws.com/test.jpg' })),
      getSignedUrl: vi.fn(() => 'https://signed-url.test'),
    }
  };
}
```

#### Service Layer Unit Test Example
```typescript
// src/services/trip.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TripService } from './trip.service';
import { createStubs } from '@/lib/stubs';

describe('TripService', () => {
  let tripService: TripService;
  let stubs: ReturnType<typeof createStubs>;
  
  beforeEach(() => {
    stubs = createStubs();
    tripService = new TripService(stubs.prisma.getImplementation());
  });
  
  describe('createTrip', () => {
    it('should create a trip with the current user as master', async () => {
      const userId = 'user-123';
      const tripData = {
        name: 'Beach Vacation',
        destination: 'Hawaii',
        startDate: new Date('2026-06-01'),
        endDate: new Date('2026-06-07'),
      };
      
      const trip = await tripService.createTrip(userId, tripData);
      
      expect(trip.name).toBe('Beach Vacation');
      expect(trip.tripMasterId).toBe(userId);
      expect(stubs.prisma.getImplementation().trip.create).toHaveBeenCalled();
    });
    
    it('should add creator as first member', async () => {
      const userId = 'user-123';
      const trip = await tripService.createTrip(userId, { name: 'Test Trip' });
      
      expect(stubs.prisma.getImplementation().tripMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            role: 'MASTER'
          })
        })
      );
    });
  });
  
  describe('changeTripStatus', () => {
    it('should transition from IDEA to PLANNING', async () => {
      const tripId = 'trip-123';
      
      stubs.prisma.getImplementation().trip.findUnique = vi.fn()
        .mockResolvedValue({ id: tripId, status: 'IDEA' });
      
      const result = await tripService.changeStatus(tripId, 'PLANNING');
      
      expect(result.status).toBe('PLANNING');
    });
    
    it('should not allow invalid status transitions', async () => {
      const tripId = 'trip-123';
      
      stubs.prisma.getImplementation().trip.findUnique = vi.fn()
        .mockResolvedValue({ id: tripId, status: 'IDEA' });
      
      await expect(
        tripService.changeStatus(tripId, 'IN_PROGRESS')
      ).rejects.toThrow('Invalid status transition');
    });
  });
});
```

---

### 10.3 Repository/DAO Testing

```typescript
// src/lib/db/trip.repository.test.ts
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { TripRepository } from './trip.repository';

// Use testcontainers for real DB testing
const container = await new PostgreSQLContainer().start();

describe('TripRepository', () => {
  let repository: TripRepository;
  let prisma: PrismaClient;
  
  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: container.getConnectionUri()
    });
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS ...`;
    repository = new TripRepository(prisma);
  });
  
  afterAll(async () => {
    await container.stop();
  });
  
  describe('findUserTrips', () => {
    it('should return all trips for a user', async () => {
      // Seed test data
      await prisma.user.create({ data: { id: 'user-1', email: 'test@test.com', name: 'Test' }});
      await prisma.trip.create({ data: { id: 'trip-1', name: 'Trip 1', tripMasterId: 'user-1' }});
      
      const trips = await repository.findUserTrips('user-1');
      
      expect(trips).toHaveLength(1);
      expect(trips[0].name).toBe('Trip 1');
    });
  });
});
```

---

### 10.4 API Integration Testing

```typescript
// tests/api/trips.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from './test-app';
import { createTestUser, createTestTrip } from './fixtures';

describe('POST /api/trips', () => {
  const app = createTestApp();
  let authToken: string;
  
  beforeAll(async () => {
    const user = await createTestUser();
    authToken = user.token;
  });
  
  it('should create a new trip', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Summer Vacation',
        destination: 'Italy',
        startDate: '2026-07-01',
        endDate: '2026-07-14'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Summer Vacation');
  });
  
  it('should return 401 without auth', async () => {
    const response = await request(app)
      .post('/api/trips')
      .send({ name: 'Test' });
    
    expect(response.status).toBe(401);
  });
  
  it('should validate input with Zod', async () => {
    const response = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: '' }); // Invalid: empty name
    
    expect(response.status).toBe(400);
    expect(response.body.errors).toContain('name must be at least 1 character');
  });
});
```

---

### 10.5 Real-time (Socket.io) Testing

```typescript
// tests/sockets/chat.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io, Socket } from 'socket.io-client';
import { createServer } from '@/lib/socket';

describe('Chat Socket', () => {
  let server: any;
  let client: Socket;
  
  beforeAll((done) => {
    server = createServer();
    server.listen(3001);
    
    client = io('http://localhost:3001', {
      auth: { token: 'test-token' }
    });
    client.on('connect', done);
  });
  
  afterAll(() => {
    client.disconnect();
    server.close();
  });
  
  it('should send and receive messages', (done) => {
    const tripId = 'trip-123';
    
    client.emit('join-trip', tripId);
    
    client.on('new-message', (message) => {
      expect(message.content).toBe('Hello from test');
      done();
    });
    
    // Another client sends message
    const sender = io('http://localhost:3001', {
      auth: { token: 'sender-token' }
    });
    sender.emit('send-message', {
      tripId,
      content: 'Hello from test'
    });
  });
});
```

---

### 10.6 Frontend Testing with MSW

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const handlers = [
  // Stub all trip endpoints
  http.get('/api/trips', async () => {
    await delay(200);
    return HttpResponse.json([
      { id: '1', name: 'Beach Trip', status: 'PLANNING' }
    ]);
  }),
  
  http.post('/api/trips', async ({ request }) => {
    await delay(200);
    const body = await request.json();
    return HttpResponse.json(
      { id: 'new-trip-id', ...body },
      { status: 201 }
    );
  }),
  
  // Stub invite generation
  http.post('/api/trips/:tripId/invites', async ({ params }) => {
    return HttpResponse.json({
      token: 'invite-token-123',
      url: 'https://tripplanner.app/invite/invite-token-123'
    });
  }),
  
  // Stub share endpoints
  http.post('/api/share/whatsapp', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      shareUrl: `whatsapp://send?text=${encodeURIComponent(body.message)}`
    });
  }),
];

// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';

export const worker = setupWorker(...handlers);

// src/components/TripList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { TripList } from './TripList';

describe('TripList', () => {
  it('should render trips from API', async () => {
    render(<TripList />);
    
    await waitFor(() => {
      expect(screen.getByText('Beach Trip')).toBeInTheDocument();
    });
  });
});
```

---

### 10.7 E2E Testing with Playwright

```typescript
// tests/e2e/trip-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Trip Flow', () => {
  test('should create trip, invite friends, and vote on activities', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.click('[data-testid="google-login"]');
    await page.waitForURL('/dashboard');
    
    // 2. Create trip
    await page.click('[data-testid="new-trip-btn"]');
    await page.fill('[data-testid="trip-name"]', 'Beach Vacation');
    await page.fill('[data-testid="destination"]', 'Hawaii');
    await page.click('[data-testid="create-trip-btn"]');
    await page.waitForURL(/\/trip\/.+/);
    
    // 3. Invite friend
    await page.click('[data-testid="invite-btn"]');
    await page.fill('[data-testid="invite-email"]', 'friend@example.com');
    await page.click('[data-testid="send-invite-btn"]');
    await expect(page.locator('.toast')).toContainText('Invite sent');
    
    // 4. Propose activity
    await page.click('[data-testid="propose-activity-btn"]');
    await page.fill('[data-testid="activity-title"]', 'Surfing Lesson');
    await page.fill('[data-testid="activity-cost"]', '50');
    await page.click('[data-testid="submit-activity-btn"]');
    
    // 5. Vote on activity
    await page.click('[data-testid="vote-yes-btn"]');
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    
    // 6. Share via WhatsApp
    await page.click('[data-testid="share-btn"]');
    await page.click('[data-testid="share-whatsapp"]');
    await expect(page.url()).toContain('whatsapp://');
  });
});
```

---

### 10.8 Test Coverage Goals

| Category | Target | Minimum |
|----------|--------|---------|
| Unit Tests | 90% | 80% |
| API Routes | 85% | 75% |
| Services | 90% | 85% |
| Components | 70% | 60% |
| E2E | Key flows | Critical paths |

---

### 10.9 CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Run API tests
        run: npm run test:api

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: test-results/
```

---

### 10.10 Running Tests

```bash
# Run all unit tests with coverage
npm run test:unit

# Run unit tests in watch mode
npm run test:watch

# Run integration tests
npm run test:integration

# Run API tests
npm run test:api

# Run E2E tests
npm run test:e2e

# Run all tests
npm run test:all

# Run with coverage report
npm run test:coverage
```

---

## 10. Deployment Strategy

### 10.1 Docker Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Next.js   │  │   Socket.io  │  │   Worker    │                  │
│  │   Web/API   │  │   Server     │  │   (Cron)    │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                          │
│         └─────────────────┼─────────────────┘                          │
│                           │                                              │
│  ┌────────────────────────┼────────────────────────────────┐           │
│  │                  Traefik Reverse Proxy                  │           │
│  │            (SSL Termination + Load Balancing)            │           │
│  └────────────────────────┬────────────────────────────────┘           │
│                           │                                              │
│         ┌─────────────────┼─────────────────┐                            │
│         │                 │                 │                            │
│         ▼                 ▼                 ▼                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │ PostgreSQL  │  │    Redis     │  │      S3     │                  │
│  │  Database   │  │    Cache     │  │ (MinIO Dev) │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Dockerfiles

#### Production Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Development Dockerfile
```dockerfile
# Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Install Prisma
RUN npm install -g prisma

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### 10.3 Docker Compose Files

#### Development Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/tripplanner
      - NEXTAUTH_SECRET=dev-secret-change-in-prod
      - NEXTAUTH_URL=http://localhost:3000
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tripplanner
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Development mail catcher
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

volumes:
  postgres_data:
  redis_data:
```

#### Production Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
      target: runner
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - REDIS_URL=redis://redis:6379
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_ACCESS_KEY_ID=${S3_ACCESS_KEY_ID}
      - S3_SECRET_ACCESS_KEY=${S3_SECRET_ACCESS_KEY}
      - S3_BUCKET=${S3_BUCKET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app

  socket:
    build:
      context: .
      dockerfile: Dockerfile.socket
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - redis
      - db
    networks:
      - app

  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    networks:
      - app

  db:
    image: postgres:15-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - app

  traefik:
    image: traefik:v3.0
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/traefik.yml:/traefik.yml:ro
      - ./traefik/certs:/certs:ro
      - traefik_acme:/acme
    networks:
      - app

volumes:
  postgres_data:
  redis_data:
  traefik_acme:

networks:
  app:
    driver: bridge
```

### 10.4 Database Schema Migrations in Docker

```yaml
# docker-compose.migrate.yml
version: '3.8'

services:
  migrate:
    build: .
    command: sh -c "npx prisma migrate deploy && npx prisma generate"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  seed:
    build: .
    command: npx tsx prisma/seed.ts
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      migrate:
        condition: service_completed_successfully
```

### 10.5 Test Scripts with Docker

```bash
#!/bin/bash
set -e

# Run unit tests in Docker
function test:unit:docker() {
    echo "🧪 Running unit tests in Docker..."
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        sh -c "npm ci && npm run test:unit -- --coverage"
}

# Run integration tests with test database
function test:integration:docker() {
    echo "🧪 Running integration tests in Docker..."
    
    # Start test database
    docker compose -f docker-compose.test.yml up -d db test-redis
    
    # Wait for database
    sleep 5
    
    # Run tests
    docker run --rm \
        --network tripplanner_default \
        -v $(pwd):/app \
        -w /app \
        -e DATABASE_URL="postgresql://postgres:postgres@db:5432/tripplanner_test" \
        node:20-alpine \
        sh -c "npm ci && npm run test:integration"
    
    # Cleanup
    docker compose -f docker-compose.test.yml down
}

# Run full test suite in Docker
function test:all:docker() {
    echo "🧪 Running full test suite in Docker..."
    
    docker compose -f docker-compose.test.yml up --abort-on-container-exit
    
    # Check exit code
    EXIT_CODE=$(docker compose -f docker-compose.test.yml ps -q test-runner | xargs docker inspect -f '{{.State.ExitCode}}')
    
    docker compose -f docker-compose.test.yml down
    
    if [ "$EXIT_CODE" -eq 0 ]; then
        echo "✅ All tests passed!"
    else
        echo "❌ Tests failed!"
        exit 1
    fi
}

# Test Docker build
function test:build:docker() {
    echo "🔨 Testing Docker build..."
    docker build -t tripplanner:test .
    echo "✅ Build successful!"
}

# Lint in Docker
function lint:docker() {
    echo "🔍 Running linter in Docker..."
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        sh -c "npm ci && npm run lint"
}

# Typecheck in Docker
function typecheck:docker() {
    echo "🔍 Running type checker in Docker..."
    docker run --rm \
        -v $(pwd):/app \
        -w /app \
        node:20-alpine \
        sh -c "npm ci && npx tsc --noEmit"
}
```

### 10.6 Test Docker Compose

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/tripplanner_test
      - REDIS_URL=redis://test-redis:6379
    depends_on:
      db:
        condition: service_healthy
      test-redis:
        condition: service_started
    volumes:
      - ./coverage:/app/coverage
    command: sh -c "npm run test:all"

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tripplanner_test
    ports:
      - "5433:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    tmpfs:
      - /var/lib/postgresql/data

  test-redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"

  # Mailhog for testing emails
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"
```

### 10.7 CI/CD with Docker

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run unit tests
        run: docker compose -f docker-compose.test.yml run test-runner npm run test:unit
      
      - name: Run integration tests
        run: docker compose -f docker-compose.test.yml run test-runner npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
      
      - name: Build production image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: false
          tags: tripplanner:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Add your staging deployment commands

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add your production deployment commands
```

### 10.8 Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@host:5432/tripplanner"

# Auth
NEXTAUTH_SECRET="your-secret-key-min-32-chars-long"
NEXTAUTH_URL="https://tripplanner.app"

# OAuth Providers
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
APPLE_CLIENT_ID=""
APPLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""

# Redis
REDIS_URL="redis://localhost:6379"

# S3 / Storage
S3_ENDPOINT="https://s3.amazonaws.com"
S3_ACCESS_KEY_ID=""
S3_SECRET_ACCESS_KEY=""
S3_BUCKET="tripplanner-prod"

# Email
SENDGRID_API_KEY=""
EMAIL_FROM="noreply@tripplanner.app"

# App
NEXT_PUBLIC_APP_URL="https://tripplanner.app"
NEXT_PUBLIC_SOCKET_URL="wss://socket.tripplanner.app"
```

### 10.9 Deployment Commands

```bash
# Development
docker compose up -d              # Start all services
docker compose logs -f           # View logs
docker compose down               # Stop all services

# Run tests in Docker
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Database migrations
docker compose -f docker-compose.migrate.yml up migrate

# Production
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Database backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U user tripplanner > backup.sql

# Database restore
docker compose -f docker-compose.prod.yml exec -T db psql -U user tripplanner < backup.sql
```

### 10.10 Health Checks

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: false,
    redis: false,
    socket: false,
    s3: false,
    email: false,
    external: false,
    version: process.env.npm_package_version || '1.0.0',
  };

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.services.database = true;
  } catch (e) {
    checks.status = 'degraded';
  }

  // Redis check
  try {
    const redis = await import('redis');
    const client = redis.createClient({ url: process.env.REDIS_URL });
    await client.connect();
    await client.ping();
    await client.disconnect();
    checks.services.redis = true;
  } catch (e) {
    checks.status = 'degraded';
  }

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return NextResponse.json(checks, { status: statusCode });
}
```

---

## 11. MVP Scope (6+ months)

### Phase 1: Core (Month 1-2)
- [ ] User auth (Google, Apple, Facebook)
- [ ] Trip CRUD
- [ ] Member management
- [ ] Invite system with links

### Phase 2: Planning (Month 3-4)
- [ ] Activity proposals
- [ ] Voting system
- [ ] Basic bookings

### Phase 3: Payments (Month 4-5)
- [ ] Payment link integration (Venmo/PayPal/Zelle)
- [ ] Payment confirmation workflow

### Phase 4: Social (Month 5-6)
- [ ] Real-time chat
- [ ] Photo/video uploads
- [ ] Push notifications

### Post-MVP
- [ ] Mobile apps
- [ ] Advanced splitting
- [ ] AI suggestions
- [ ] Integration with travel APIs

---

*Document Version: 1.1*
*Updated: February 2026*
