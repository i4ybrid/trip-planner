# TripPlanner Backend - Technical Design Document

## 1. Overview

The TripPlanner backend is a **Node.js + Express** REST API server that provides the core business logic, data persistence, and real-time communication for the trip planning platform.

### Core Responsibilities
- User authentication and authorization
- Trip and activity management
- Real-time messaging via Socket.io
- Payment tracking and reconciliation
- Invite generation and management
- Notification delivery (email, SMS, push)
- Media upload and storage management

---

## 2. Architecture

### Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Runtime | Node.js 20+ | JavaScript runtime |
| Framework | Express 4.18 | Web framework |
| Language | TypeScript 5.3 | Type-safe development |
| ORM | Prisma 5.10 | Database ORM |
| Database | PostgreSQL | Relational database |
| Real-time | Socket.io 4.7 | WebSocket server |
| Validation | Zod 3.22 | Request validation |
| Auth | NextAuth.js adapter | Authentication |
| Email | SendGrid | Transactional emails |
| SMS | Twilio | SMS notifications |
| Push | web-push | Browser push notifications |
| API Docs | Swagger | OpenAPI documentation |
| Testing | Vitest + Supertest | Unit/integration tests |
| E2E Testing | Playwright | End-to-end tests |

### Project Structure

```
backend/
├── src/
│   ├── index.ts              # Application entry point
│   │
│   ├── routes/               # Express route handlers
│   │   ├── index.ts          # Route aggregator
│   │   ├── auth.ts           # Authentication routes
│   │   ├── users.ts          # User management
│   │   ├── trips.ts          # Trip CRUD operations
│   │   ├── activities.ts     # Activity & voting
│   │   ├── invites.ts        # Invite management
│   │   ├── messages.ts       # Chat messages
│   │   ├── media.ts          # Media uploads
│   │   ├── notifications.ts  # Notification management
│   │   └── payments.ts       # Payment tracking
│   │
│   ├── services/             # Business logic layer
│   │   ├── trip.service.ts           # Trip operations
│   │   ├── activity.service.ts       # Activity & voting logic
│   │   ├── invite.service.ts         # Invite generation & tracking
│   │   ├── message.service.ts        # Message operations
│   │   ├── media.service.ts          # Media handling
│   │   ├── notification.service.ts   # Notification orchestration
│   │   ├── email-notification.service.ts  # Email delivery
│   │   ├── sms-notification.service.ts    # SMS delivery
│   │   ├── push-notification.service.ts   # Push notifications
│   │   ├── payment.service.ts      # Payment tracking
│   │   ├── user.service.ts         # User operations
│   │   └── thumbnail.service.ts    # Image thumbnail generation
│   │
│   ├── middleware/           # Express middleware
│   │   ├── error-handler.ts  # Global error handling
│   │   └── validation.ts     # Request validation
│   │
│   ├── lib/                  # Utilities
│   │   ├── validation-schemas.ts  # Zod schemas
│   │   └── utils.ts          # Helper functions
│   │
│   ├── auth/                 # Authentication configuration
│   │   └── index.ts          # NextAuth config
│   │
│   └── types/                # TypeScript types
│       └── index.ts          # Type definitions
│
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeding
│
├── tests/                    # Test files
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
│
├── logs/                     # Application logs
├── coverage/                 # Test coverage reports
├── dist/                     # Compiled output
├── node_modules/
├── Dockerfile
├── Dockerfile.dev
├── Dockerfile.test
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

---

## 3. Application Architecture

### Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      HTTP Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Express Routes (/routes)                           │    │
│  │  - Request parsing                                   │    │
│  │  - Response formatting                               │    │
│  │  - Route-level validation                            │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Layer                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  - Error handling                                    │    │
│  │  - Input validation (Zod)                            │    │
│  │  - Authentication                                    │    │
│  │  - Authorization                                     │    │
│  │  - Rate limiting                                     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Business Logic (/services)                          │    │
│  │  - TripService                                       │    │
│  │  - ActivityService                                   │    │
│  │  - InviteService                                     │    │
│  │  - MessageService                                    │    │
│  │  - NotificationService                               │    │
│  │  - PaymentService                                    │    │
│  │  - UserService                                       │    │
│  │  - MediaService                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Prisma ORM                                          │    │
│  │  - Query building                                    │    │
│  │  - Transaction management                            │    │
│  │  - Connection pooling                                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL Database                        │
└─────────────────────────────────────────────────────────────┘
```

### Server Entry Point (`src/index.ts`)

```typescript
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' },
});

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/notifications', notificationsRouter);

// Frontend logging endpoint
app.post('/api/logs', (req, res) => {
  log(`[FRONTEND][${level}] ${message}`);
  res.status(204).send();
});

// Error handler
app.use(errorHandler);

// Socket.io for real-time features
io.on('connection', (socket) => {
  socket.on('authenticate', (userId: string) => { /* ... */ });
  socket.on('join-trip', (tripId: string) => { /* ... */ });
  socket.on('send-message', (data) => { /* ... */ });
  socket.on('typing', (data) => { /* ... */ });
  socket.on('mark-read', (data) => { /* ... */ });
});

httpServer.listen(PORT, HOST, () => {
  log(`🚀 Server running on http://${HOST}:${PORT}`);
});
```

---

## 4. Database Schema

### Entity Overview

| Entity | Description |
|--------|-------------|
| User | User accounts with payment handles |
| Trip | Trip plans with status workflow |
| TripMember | User membership in trips |
| Invite | Shareable invite links |
| InviteChannel | Channel tracking for invites |
| Activity | Proposed activities with voting |
| Vote | User votes on activities |
| Booking | Confirmed bookings |
| TripMessage | Chat messages |
| MessageReaction | Emoji reactions |
| MessageReadReceipt | Read status tracking |
| MediaItem | Photos and videos |
| Notification | User notifications |
| PushSubscription | Browser push subscriptions |

### Key Relationships

```
User ──┬── TripMember ── Trip
       ├── Activity (proposer)
       ├── Vote
       ├── TripMessage
       ├── MediaItem (uploader)
       ├── Notification
       ├── Invite (sentBy)
       └── PushSubscription

Trip ──┬── TripMember
       ├── Invite
       ├── Activity
       ├── Booking
       ├── TripMessage
       ├── MediaItem
       └── Notification

Activity ──┬── Vote
           ├── Booking
           └── MediaItem

Invite ─── InviteChannel

TripMessage ──┬── MessageReaction
              ├── MessageReadReceipt
              └── TripMessage (edits/replies)
```

### Indexes & Constraints

```prisma
// Unique constraints
@@unique([tripId, userId])  // TripMember
@@unique([activityId, userId])  // Vote
@@unique([messageId, userId, emoji])  // MessageReaction
@@unique([messageId, userId])  // MessageReadReceipt
@@unique([userId, endpoint])  // PushSubscription

// Cascading deletes
@relation(fields: [tripId], references: [id], onDelete: Cascade)
```

---

## 5. API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET | `/api/auth/session` | Get current session |
| POST | `/api/auth/signout` | Sign out |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile |
| GET | `/api/users/:id` | Get user by ID |

### Trips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List user's trips |
| POST | `/api/trips` | Create new trip |
| GET | `/api/trips/:id` | Get trip details |
| PATCH | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| POST | `/api/trips/:id/status` | Change trip status |
| GET | `/api/trips/:id/members` | List members |
| POST | `/api/trips/:id/members` | Add member |
| PATCH | `/api/trips/:id/members/:userId` | Update member role |
| DELETE | `/api/trips/:id/members/:userId` | Remove member |

### Activities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/activities` | List activities |
| POST | `/api/trips/:id/activities` | Propose activity |
| PATCH | `/api/activities/:id` | Update activity |
| DELETE | `/api/activities/:id` | Remove activity |
| GET | `/api/activities/:id/votes` | Get votes |
| POST | `/api/activities/:id/votes` | Cast vote |
| DELETE | `/api/activities/:id/votes` | Remove vote |

### Invites

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/invites` | List invites |
| POST | `/api/trips/:id/invites` | Create invite |
| GET | `/api/invites/:token` | Get invite (public) |
| POST | `/api/invites/:token/accept` | Accept invite |
| POST | `/api/invites/:token/decline` | Decline invite |
| DELETE | `/api/invites/:id` | Revoke invite |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/messages` | Get chat history |
| POST | `/api/trips/:id/messages` | Send message |
| DELETE | `/api/messages/:id` | Delete message |
| POST | `/api/messages/:id/reactions` | Add reaction |
| DELETE | `/api/messages/:id/reactions/:emoji` | Remove reaction |
| POST | `/api/messages/:id/read` | Mark as read |

### Media

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/media` | List media |
| POST | `/api/trips/:id/media` | Upload media |
| DELETE | `/api/media/:id` | Delete media |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/bookings` | List bookings |
| POST | `/api/trips/:id/bookings` | Create booking |
| PATCH | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Delete booking |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/payments` | List payment status |
| POST | `/api/trips/:id/payments/request` | Request payment |
| POST | `/api/trips/:id/payments/:memberId/confirm` | Confirm payment received |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id` | Mark as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |
| POST | `/api/notifications/push-subscription` | Register push subscription |

---

## 6. Service Layer

### TripService

```typescript
class TripService {
  constructor(private prisma: PrismaClient) {}

  async getUserTrips(userId: string): Promise<Trip[]> {
    return this.prisma.trip.findMany({
      where: {
        members: { some: { userId } }
      },
      include: { members: { include: { user: true } } }
    });
  }

  async createTrip(userId: string, data: CreateTripInput): Promise<Trip> {
    return this.prisma.trip.create({
      data: {
        ...data,
        tripMasterId: userId,
        members: {
          create: { userId, role: 'MASTER', status: 'CONFIRMED' }
        }
      }
    });
  }

  async changeStatus(tripId: string, status: TripStatus): Promise<Trip> {
    return this.prisma.trip.update({
      where: { id: tripId },
      data: { status }
    });
  }
}
```

### ActivityService

```typescript
class ActivityService {
  constructor(private prisma: PrismaClient) {}

  async proposeActivity(tripId: string, data: CreateActivityInput): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        ...data,
        tripId,
        votingEndsAt: this.calculateVotingDeadline(tripId)
      }
    });
  }

  async castVote(activityId: string, userId: string, option: VoteOption): Promise<Vote> {
    return this.prisma.vote.upsert({
      where: { activityId_userId: { activityId, userId } },
      create: { activityId, userId, option },
      update: { option }
    });
  }

  async getVotingResults(activityId: string): Promise<VotingResults> {
    const votes = await this.prisma.vote.findMany({
      where: { activityId }
    });
    // Calculate yes/no/maybe counts
    return this.calculateResults(votes);
  }
}
```

### InviteService

```typescript
class InviteService {
  constructor(private prisma: PrismaClient) {}

  async createInvite(tripId: string, sentById: string, channels: string[]): Promise<Invite> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.invite.create({
      data: {
        tripId,
        token,
        sentById,
        expiresAt,
        channels: {
          create: channels.map(channel => ({ channel }))
        }
      }
    });
  }

  async acceptInvite(token: string, userId: string): Promise<TripMember> {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: { trip: true }
    });

    if (!invite || invite.expiresAt < new Date()) {
      throw new Error('Invalid or expired invite');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' }
      });

      return tx.tripMember.create({
        data: {
          tripId: invite.tripId,
          userId,
          role: 'MEMBER',
          status: 'CONFIRMED'
        }
      });
    });
  }
}
```

### NotificationService

```typescript
class NotificationService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailNotificationService,
    private smsService: SmsNotificationService,
    private pushService: PushNotificationService
  ) {}

  async sendNotification(data: CreateNotificationInput): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data
    });

    // Send via appropriate channel
    if (data.type === 'invite') {
      await this.emailService.sendInviteEmail(notification);
    } else if (data.type === 'payment') {
      await this.smsService.sendPaymentSMS(notification);
    }

    // Push notification for real-time users
    await this.pushService.sendPush(notification);

    return notification;
  }

  async sendTripNotification(
    tripId: string,
    type: NotificationType,
    title: string,
    body: string
  ): Promise<void> {
    const members = await this.prisma.tripMember.findMany({
      where: { tripId },
      include: { user: true }
    });

    for (const member of members) {
      await this.sendNotification({
        userId: member.userId,
        tripId,
        type,
        title,
        body
      });
    }
  }
}
```

### MessageService

```typescript
class MessageService {
  constructor(private prisma: PrismaClient) {}

  async sendMessage(tripId: string, userId: string, content: string): Promise<TripMessage> {
    return this.prisma.tripMessage.create({
      data: { tripId, userId, content }
    });
  }

  async addReaction(messageId: string, userId: string, emoji: string): Promise<MessageReaction> {
    return this.prisma.messageReaction.create({
      data: { messageId, userId, emoji }
    });
  }

  async markAsRead(messageId: string, userId: string): Promise<MessageReadReceipt> {
    return this.prisma.messageReadReceipt.create({
      data: { messageId, userId }
    });
  }

  async getChatHistory(tripId: string, limit = 50): Promise<TripMessage[]> {
    return this.prisma.tripMessage.findMany({
      where: { tripId },
      include: {
        user: true,
        reactions: true,
        readReceipts: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}
```

### PaymentService

```typescript
class PaymentService {
  constructor(private prisma: PrismaClient) {}

  async calculateShares(tripId: string): Promise<MemberShare[]> {
    const bookings = await this.prisma.booking.findMany({
      where: { tripId, status: 'CONFIRMED' }
    });

    const members = await this.prisma.tripMember.findMany({
      where: { tripId, status: 'CONFIRMED' }
    });

    const total = bookings.reduce((sum, b) => sum + Number(b.receiptUrl || 0), 0);
    const perPerson = total / members.length;

    return members.map(m => ({
      memberId: m.id,
      userId: m.userId,
      share: perPerson,
      paid: m.paymentStatus === 'paid'
    }));
  }

  async confirmPayment(
    tripId: string,
    memberId: string,
    confirmedById: string
  ): Promise<TripMember> {
    // Verify confirmer is trip master
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId }
    });

    if (trip?.tripMasterId !== confirmedById) {
      throw new Error('Only trip master can confirm payments');
    }

    return this.prisma.tripMember.update({
      where: { id: memberId },
      data: {
        paymentStatus: 'paid',
        paymentConfirmedAt: new Date()
      }
    });
  }
}
```

---

## 7. Real-time Features (Socket.io)

### Events

#### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `userId: string` | Authenticate socket connection |
| `join-trip` | `tripId: string` | Join trip room |
| `leave-trip` | `tripId: string` | Leave trip room |
| `send-message` | `{ tripId, content, userId }` | Send chat message |
| `typing` | `{ tripId, userId, isTyping }` | Typing indicator |
| `mark-read` | `{ tripId, userId, messageId }` | Mark message read |

#### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | `Message` | New chat message |
| `user-typing` | `{ tripId, userId, isTyping }` | User typing status |
| `message-read` | `{ userId, messageId }` | Read receipt |
| `notification` | `Notification` | New notification |
| `trip-updated` | `Trip` | Trip data changed |
| `vote-cast` | `{ activityId, userId, option }` | Vote was cast |

### Connection Flow

```
┌──────────┐                          ┌──────────┐
│  Client  │                          │  Server  │
└────┬─────┘                          └────┬─────┘
     │                                     │
     │────────── connect() ───────────────▶│
     │                                     │
     │◀───────── connection ack ───────────│
     │                                     │
     │────── authenticate(userId) ────────▶│
     │                                     │
     │◀─────── authentication ack ─────────│
     │                                     │
     │─────── join-trip(tripId) ──────────▶│
     │                                     │
     │◀─────── room joined ack ────────────│
     │                                     │
     │─────── send-message(data) ─────────▶│
     │                                     │
     │◀────── new-message (broadcast) ─────│
     │                                     │
```

---

## 8. Middleware

### Error Handler

```typescript
// middleware/error-handler.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  log.error('Error:', err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      error: 'Database error',
      code: err.code
    });
  }

  res.status(err['status'] || 500).json({
    error: err.message || 'Internal server error'
  });
};
```

### Validation Middleware

```typescript
// middleware/validation.ts
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}
```

---

## 9. Validation Schemas

```typescript
// lib/validation-schemas.ts
import { z } from 'zod';

export const createTripSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  coverImage: z.string().url().optional()
});

export const updateTripSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(['IDEA', 'PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional()
});

export const createActivitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  category: z.enum(['accommodation', 'excursion', 'restaurant', 'transport', 'activity', 'other'])
});

export const voteSchema = z.object({
  option: z.enum(['yes', 'no', 'maybe'])
});

export const createInviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  channels: z.array(z.enum(['email', 'whatsapp', 'sms', 'link']))
});
```

---

## 10. Testing Strategy

### Test Types

| Type | Tool | Purpose |
|------|------|---------|
| Unit Tests | Vitest | Service logic, utilities |
| Integration Tests | Vitest + Supertest | API endpoints |
| E2E Tests | Playwright | Full user flows |

### Test Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── trip.service.test.ts
│   │   ├── activity.service.test.ts
│   │   ├── invite.service.test.ts
│   │   └── ...
│   └── lib/
│       └── validation-schemas.test.ts
│
├── integration/
│   ├── routes/
│   │   ├── trips.test.ts
│   │   ├── activities.test.ts
│   │   └── ...
│   └── middleware/
│       └── error-handler.test.ts
│
└── e2e/
    ├── trip-flow.test.ts
    ├── invite-flow.test.ts
    └── chat-flow.test.ts
```

### Example Test

```typescript
// tests/unit/services/trip.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { TripService } from '../../../src/services/trip.service';
import { PrismaClient } from '@prisma/client';

describe('TripService', () => {
  let prisma: PrismaClient;
  let tripService: TripService;

  beforeEach(() => {
    prisma = new PrismaClient();
    tripService = new TripService(prisma);
  });

  it('should create a trip with the user as MASTER', async () => {
    const trip = await tripService.createTrip('user-123', {
      name: 'Test Trip',
      destination: 'Hawaii'
    });

    expect(trip.name).toBe('Test Trip');
    expect(trip.tripMasterId).toBe('user-123');
  });

  it('should change trip status', async () => {
    const trip = await tripService.createTrip('user-123', { name: 'Test' });
    
    const updated = await tripService.changeStatus(trip.id, 'PLANNING');
    
    expect(updated.status).toBe('PLANNING');
  });
});
```

---

## 11. Security

### Authentication & Authorization

- **NextAuth.js**: Handles OAuth providers (Google, Facebook, etc.)
- **JWT Tokens**: Stateless session management
- **Role-based Access Control**: MASTER, ORGANIZER, MEMBER, VIEWER

### Authorization Checks

```typescript
// In route handlers
const trip = await tripService.getTripById(tripId);
const member = trip.members.find(m => m.userId === userId);

if (!member) {
  throw new UnauthorizedError('Not a member of this trip');
}

if (action === 'delete' && member.role !== 'MASTER') {
  throw new ForbiddenError('Only trip master can delete trips');
}
```

### Data Protection

- **Encryption at rest**: PostgreSQL TDE or disk encryption
- **HTTPS**: Required for all production traffic
- **Input sanitization**: Zod validation on all inputs
- **Rate limiting**: Prevent abuse (express-rate-limit)

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/tripplanner
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
PORT=4000
HOST=0.0.0.0

# Email
SENDGRID_API_KEY=SG.xxx

# SMS
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Push Notifications
VAPID_PUBLIC_KEY=xxx
VAPID_PRIVATE_KEY=xxx

# File Storage
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_BUCKET=tripplanner-media
AWS_REGION=us-east-1

# Logging
LOG_DIR=/logs
LOG_LEVEL=info
```

---

## 12. Logging & Monitoring

### Logging

```typescript
// Structured logging
function log(...args: unknown[]) {
  const msg = `[${new Date().toISOString()}] ${args.map(a => 
    typeof a === 'object' ? JSON.stringify(a) : a
  ).join(' ')}`;
  
  if (logStream) {
    logStream.write(msg + '\n');
  }
  console.log(...args);
}
```

### Log Levels

| Level | Purpose |
|-------|---------|
| ERROR | Errors that require attention |
| WARN | Potential issues |
| INFO | Normal operations |
| DEBUG | Detailed debugging |

---

## 13. Docker Configuration

### Development (`Dockerfile.dev`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
```

### Production (`Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 4000
CMD ["npm", "start"]
```

### Test (`Dockerfile.test`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "test:coverage"]
```

---

## 14. Performance Optimization

### Strategies

1. **Database Indexing**: Indexes on foreign keys and frequently queried fields
2. **Connection Pooling**: Prisma connection pool configuration
3. **Query Optimization**: Selective field fetching, avoiding N+1 queries
4. **Caching**: Redis for session caching (future)
5. **Pagination**: Cursor-based pagination for large lists

### Database Indexes

```prisma
model Trip {
  // ...
  @@index([tripMasterId])
  @@index([status])
}

model TripMember {
  // ...
  @@index([userId])
  @@index([tripId, status])
}

model Notification {
  // ...
  @@index([userId, read])
}
```

---

## 15. Future Considerations

### Scalability

- **Horizontal scaling**: Load balancer + multiple API instances
- **Database replication**: Read replicas for read-heavy workloads
- **Message queue**: Bull/Redis for background jobs
- **CDN**: CloudFront for static media

### Features

- **Activity deadlines**: Auto-close voting at deadline
- **Expense splitting**: Integration with Splitwise
- **Calendar sync**: Google Calendar, iCal export
- **Maps integration**: Google Maps for locations

### Observability

- **Metrics**: Prometheus + Grafana
- **Tracing**: OpenTelemetry
- **Alerting**: PagerDuty integration
