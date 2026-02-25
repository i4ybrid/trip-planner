# TripPlanner Backend

Node.js/Express API server for the TripPlanner collaborative trip planning application.

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Validation**: Zod
- **Testing**: Vitest

## Project Structure

```
backend/
├── src/
│   ├── routes/          # Express route handlers
│   │   ├── trips.ts
│   │   ├── activities.ts
│   │   ├── invites.ts
│   │   ├── messages.ts
│   │   ├── payments.ts
│   │   ├── users.ts
│   │   ├── friends.ts
│   │   └── notifications.ts
│   ├── services/        # Business logic layer
│   │   ├── trip.service.ts
│   │   ├── activity.service.ts
│   │   ├── vote.service.ts
│   │   ├── invite.service.ts
│   │   ├── message.service.ts
│   │   ├── billSplit.service.ts
│   │   ├── user.service.ts
│   │   ├── friend.service.ts
│   │   ├── notification.service.ts
│   │   └── media.service.ts
│   ├── middleware/      # Express middleware
│   │   └── auth.ts
│   ├── lib/             # Utilities and configuration
│   │   ├── prisma.ts
│   │   ├── socket.ts
│   │   ├── validations.ts
│   │   └── stubs.ts
│   ├── types/           # TypeScript type definitions
│   │   └── index.ts
│   └── index.ts         # Application entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── tests/
│   └── integration/     # Integration tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── Dockerfile
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Docker (optional, for containerized development)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials.

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Run database migrations:
```bash
npm run db:migrate
```

### Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:4000`.

### Docker Development

Start all services (frontend, backend, database, redis):
```bash
docker compose up -d
```

View logs:
```bash
docker compose logs -f backend
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user profile |
| PATCH | `/api/users/me` | Update profile |
| POST | `/api/users/me/password` | Change password |
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings` | Update settings |

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips` | List user's trips |
| POST | `/api/trips` | Create new trip |
| GET | `/api/trips/:id` | Get trip details |
| PATCH | `/api/trips/:id` | Update trip |
| DELETE | `/api/trips/:id` | Delete trip |
| POST | `/api/trips/:id/status` | Change trip status |
| GET | `/api/trips/:id/timeline` | Get trip history |
| GET | `/api/trips/:id/members` | Get trip members |

### Activities & Voting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:tripId/activities` | List activities |
| POST | `/api/trips/:tripId/activities` | Propose activity |
| GET | `/api/activities/:id` | Get activity details |
| PATCH | `/api/activities/:id` | Update activity |
| DELETE | `/api/activities/:id` | Delete activity |
| GET | `/api/activities/:id/votes` | Get votes |
| POST | `/api/activities/:id/votes` | Cast vote |
| DELETE | `/api/activities/:id/votes` | Remove vote |

### Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invites/:token` | Get invite (public) |
| POST | `/api/invites/:token/accept` | Accept invite |
| POST | `/api/invites/:token/decline` | Decline invite |
| GET | `/api/trips/:tripId/invites` | List trip invites |
| POST | `/api/trips/:tripId/invites` | Create invite |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:tripId/messages` | Get trip messages |
| POST | `/api/trips/:tripId/messages` | Send trip message |
| GET | `/api/dm/conversations` | List DM conversations |
| POST | `/api/dm/conversations` | Start DM conversation |
| GET | `/api/dm/conversations/:id` | Get DM messages |
| POST | `/api/dm/conversations/:id/messages` | Send DM |

### Payments (Bill Splits)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:tripId/payments` | List bill splits |
| POST | `/api/trips/:tripId/payments` | Create bill split |
| GET | `/api/payments/:id` | Get bill split details |
| PATCH | `/api/payments/:id` | Update bill split |
| DELETE | `/api/payments/:id` | Delete bill split |
| POST | `/api/payments/:id/members/:userId/paid` | Mark as paid |

### Friends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | List friends |
| POST | `/api/friends` | Send friend request |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friend-requests` | List friend requests |
| PATCH | `/api/friend-requests/:id` | Accept/decline request |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PATCH | `/api/notifications/:id` | Mark as read |
| POST | `/api/notifications/mark-all-read` | Mark all as read |

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Database Commands

```bash
# Generate Prisma client
npm run db:generate

# Create a new migration
npm run db:migrate

# Deploy migrations to production
npm run db:migrate:deploy

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed the database with test data
npm run db:seed
```

## Seed Data

The `db:seed` command populates the database with sample data for development and testing:

- **4 users** (password: `password123` for all)
  - Test User (test@example.com)
  - Sarah Chen (sarah@example.com)
  - Mike Johnson (mike@example.com)
  - Emma Wilson (emma@example.com)

- **5 trips** in various statuses:
  - Hawaii Beach Vacation (PLANNING)
  - NYC Birthday Weekend (CONFIRMED)
  - European Adventure (IDEA)
  - Ski Trip 2025 (COMPLETED)
  - Nashville Trip (HAPPENING)

- **8 activities** with votes
- **6 trip messages**
- **2 bill splits** with payment tracking
- **Friendships and friend requests**
- **Notifications and media items**
- **DM conversations**

## Real-time Events (Socket.io)

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-trip` | `tripId` | Join trip room |
| `leave-trip` | `tripId` | Leave trip room |
| `send-message` | `{ tripId, content }` | Send message |
| `typing` | `{ tripId }` | Typing indicator |
| `vote-cast` | `{ activityId, tripId }` | Vote update |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `new-message` | Message data | New message received |
| `user-typing` | `{ tripId, userId }` | User typing |
| `vote-updated` | `{ activityId }` | Vote changed |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |

## License

MIT
