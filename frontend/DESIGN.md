# TripPlanner Frontend - Technical Design Document

## 1. Overview

The TripPlanner frontend is a **Next.js 14** web application that provides a collaborative trip planning interface for users to create, manage, and coordinate trips with friends.

### Core Responsibilities
- User authentication and session management
- Trip creation, viewing, and management
- Real-time chat and notifications
- Activity proposal and voting
- Payment tracking and confirmation
- Media upload and gallery viewing
- Invite link generation and sharing

---

## 2. Architecture

### Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | Next.js 14 (App Router) | React framework with SSR/SSG |
| Language | TypeScript 5.3 | Type-safe development |
| Styling | Tailwind CSS 3.4 | Utility-first CSS |
| UI Icons | Lucide React | Icon library |
| State Management | Zustand 4.5 | Lightweight state management |
| Forms | React Hook Form 7.50 | Form handling |
| Validation | Zod 3.22 | Schema validation |
| Auth | NextAuth.js 4.24 | Authentication |
| Real-time | Socket.io Client 4.7 | WebSocket communication |
| Dates | date-fns 3.3 | Date manipulation |
| Testing | Vitest + Testing Library | Unit/component tests |
| E2E Testing | Playwright | End-to-end tests |

### Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Main dashboard page
│   │   ├── feed/               # Activity feed
│   │   ├── friends/            # Friends management
│   │   ├── login/              # Login page
│   │   ├── messages/           # Direct messages
│   │   ├── settings/           # User settings
│   │   ├── signup/             # Sign up page
│   │   ├── trip/
│   │   │   └── [id]/           # Trip detail pages (tabbed)
│   │   │       ├── overview/   # Trip overview
│   │   │       ├── activities/ # Activities & voting
│   │   │       ├── timeline/   # Event timeline
│   │   │       ├── chat/       # Group chat
│   │   │       ├── payments/   # Payment tracking
│   │   │       └── memories/   # Photos & videos
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   │
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (buttons, inputs, etc.)
│   │   ├── app-header.tsx      # Unified header component
│   │   ├── auth-guard.tsx      # Authentication wrapper
│   │   ├── hover-dropdown.tsx  # Hover-activated dropdown
│   │   ├── left-sidebar.tsx    # Navigation sidebar
│   │   ├── notification-drawer.tsx  # Notifications panel
│   │   ├── notification-utils.tsx   # Notification helpers
│   │   ├── page-layout.tsx     # Page layout wrapper
│   │   ├── tabs.tsx            # Tab navigation
│   │   ├── theme-switcher.tsx  # Light/dark theme toggle
│   │   ├── trip-card.tsx       # Trip summary card
│   │   └── index.ts            # Component exports
│   │
│   ├── hooks/                  # Custom React hooks
│   │
│   ├── lib/                    # Utilities
│   │
│   ├── services/               # API client services
│   │   ├── api.ts              # API client wrapper
│   │   ├── socket.ts           # Socket.io client
│   │   └── mock-api/           # Mock API for development
│   │
│   ├── store/                  # Zustand state stores
│   │   ├── activity-store.ts   # Activity state
│   │   ├── auth-store.ts       # Auth state
│   │   ├── notification-store.ts  # Notification state
│   │   ├── trip-store.ts       # Trip state
│   │   └── index.ts            # Store exports
│   │
│   ├── test/                   # Test utilities
│   │   ├── mocks/              # MSW handlers
│   │   ├── setup.ts            # Test setup
│   │   └── test-utils.tsx      # Test utilities
│   │
│   └── types/                  # TypeScript types
│       └── index.ts            # Type definitions
│
├── public/                     # Static assets
├── .next/                      # Build output
├── node_modules/
├── Dockerfile
├── Dockerfile.test
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vitest.config.ts
```

---

## 3. Component Architecture

### Component Hierarchy

```
App
└── RootLayout
    └── AuthGuard
        └── PageLayout
            ├── LeftSidebar
            ├── AppHeader
            │   ├── ThemeSwitcher
            │   └── NotificationDrawer
            └── Main Content
                ├── Dashboard
                │   └── TripCard[]
                ├── TripDetail
                │   ├── Tabs
                │   │   ├── Overview
                │   │   ├── Activities
                │   │   │   ├── ActivityCard[]
                │   │   │   └── VoteButton[]
                │   │   ├── Timeline
                │   │   ├── Chat
                │   │   │   ├── MessageList
                │   │   │   │   └── Message[]
                │   │   │   └── MessageInput
                │   │   ├── Payments
                │   │   │   └── PaymentCard[]
                │   │   └── Memories
                │   │       └── MediaGrid[]
                │   └── ...
                ├── Friends
                ├── Messages
                ├── Feed
                └── Settings
```

### Key Components

#### AppHeader
Unified header component used across all pages.

**Props:**
- `title?: string` - Page title
- `showBack?: boolean` - Show back button
- `onBack?: () => void` - Back button handler
- `actions?: React.ReactNode` - Custom action buttons

**Features:**
- Responsive design
- Theme switcher integration
- Notification drawer trigger
- Optional back navigation

#### LeftSidebar
Navigation sidebar with responsive behavior.

**Behavior:**
- **Desktop (≥1024px)**: Always expanded (256px width)
- **Mobile (<1024px)**: 
  - Starts collapsed (80px width)
  - Auto-expands on hover
  - Collapses after 5 seconds when mouse leaves

**Navigation Items:**
- Dashboard
- New Trip
- Friends
- Messages
- Feed
- Settings

#### AuthGuard
Wrapper component that ensures user authentication.

**Logic:**
```tsx
if (!session) {
  redirect('/login');
}
return children;
```

#### PageLayout
Standard page layout wrapper.

**Structure:**
```tsx
<div className="flex h-screen">
  <LeftSidebar />
  <div className="flex-1 flex flex-col">
    <AppHeader />
    <main className="flex-1 overflow-auto">
      {children}
    </main>
  </div>
</div>
```

---

## 4. State Management

### Zustand Stores

#### Trip Store (`trip-store.ts`)
Manages trip-related state and API interactions.

```typescript
interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTrips: () => Promise<void>;
  fetchTrip: (id: string) => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<Trip | null>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
  deleteTrip: (id: string) => Promise<boolean>;
  changeStatus: (id: string, status: TripStatus) => Promise<Trip | null>;
  setCurrentTrip: (trip: Trip | null) => void;
  clearError: () => void;
}
```

#### Activity Store (`activity-store.ts`)
Manages activities and voting state.

```typescript
interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;

  fetchActivities: (tripId: string) => Promise<void>;
  createActivity: (tripId: string, input: CreateActivityInput) => Promise<void>;
  vote: (activityId: string, option: VoteOption) => Promise<void>;
  deleteVote: (activityId: string) => Promise<void>;
}
```

#### Notification Store (`notification-store.ts`)
Manages notifications and real-time updates.

```typescript
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  toggleDrawer: () => void;
  addNotification: (notification: Notification) => void;
}
```

#### Auth Store (`auth-store.ts`)
Manages authentication state.

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;

  signIn: (provider: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

### State Flow

```
┌─────────────────┐     ┌─────────────────┐
│   Component     │────▶│   Zustand Store │
└─────────────────┘     └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   API Service   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   Backend API   │
                        └─────────────────┘
```

---

## 5. API Client

### Service Layer (`services/api.ts`)

Centralized API client with error handling and authentication.

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const api = {
  // Trips
  getTrips: () => fetch(`${API_BASE}/trips`),
  getTrip: (id: string) => fetch(`${API_BASE}/trips/${id}`),
  createTrip: (input: CreateTripInput) => post(`${API_BASE}/trips`, input),
  updateTrip: (id: string, input: UpdateTripInput) => patch(`${API_BASE}/trips/${id}`, input),
  deleteTrip: (id: string) => del(`${API_BASE}/trips/${id}`),
  changeTripStatus: (id: string, status: TripStatus) => post(`${API_BASE}/trips/${id}/status`, { status }),
  
  // Activities
  getActivities: (tripId: string) => fetch(`${API_BASE}/trips/${tripId}/activities`),
  createActivity: (tripId: string, input: CreateActivityInput) => post(`${API_BASE}/trips/${tripId}/activities`, input),
  vote: (activityId: string, option: VoteOption) => post(`${API_BASE}/activities/${activityId}/votes`, { option }),
  
  // Messages
  getMessages: (tripId: string) => fetch(`${API_BASE}/trips/${tripId}/messages`),
  sendMessage: (tripId: string, content: string) => post(`${API_BASE}/trips/${tripId}/messages`, { content }),
  
  // Notifications
  getNotifications: () => fetch(`${API_BASE}/notifications`),
  markAsRead: (id: string) => patch(`${API_BASE}/notifications/${id}`),
  
  // Users
  getMe: () => fetch(`${API_BASE}/users/me`),
  updateProfile: (input: UpdateProfileInput) => patch(`${API_BASE}/users/me`, input),
};
```

### Socket.io Client (`services/socket.ts`)

Real-time communication for chat and live updates.

```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';

let socket: Socket | null = null;

export const connectSocket = (userId: string) => {
  socket = io(SOCKET_URL, {
    auth: { userId },
  });
  
  socket.on('connect', () => {
    socket?.emit('authenticate', userId);
  });
  
  return socket;
};

export const joinTrip = (tripId: string) => {
  socket?.emit('join-trip', tripId);
};

export const leaveTrip = (tripId: string) => {
  socket?.emit('leave-trip', tripId);
};

export const sendMessage = (tripId: string, content: string) => {
  socket?.emit('send-message', { tripId, content, userId: currentUser.id });
};

export const subscribeToTripMessages = (tripId: string, callback: (message: Message) => void) => {
  socket?.on('new-message', (message) => {
    if (message.tripId === tripId) {
      callback(message);
    }
  });
};
```

---

## 6. Routing

### Page Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Landing page / redirect to dashboard |
| `/dashboard` | Dashboard | User's trip list |
| `/friends` | Friends | Friend management |
| `/messages` | Messages | Direct messages |
| `/feed` | Feed | Activity feed |
| `/settings` | Settings | User settings |
| `/login` | Login | Login page |
| `/signup` | Signup | Sign up page |
| `/trip/new` | NewTrip | Create trip form |
| `/trip/[id]` | TripDetail | Trip detail (redirects to overview) |
| `/trip/[id]/overview` | TripOverview | Trip overview tab |
| `/trip/[id]/activities` | TripActivities | Activities & voting tab |
| `/trip/[id]/timeline` | TripTimeline | Event timeline tab |
| `/trip/[id]/chat` | TripChat | Group chat tab |
| `/trip/[id]/payments` | TripPayments | Payment tracking tab |
| `/trip/[id]/memories` | TripMemories | Photos & videos tab |
| `/invite/[token]` | InviteAccept | Public invite acceptance |

### Route Guards

All routes except `/login`, `/signup`, and `/invite/[token]` require authentication.

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthGuard>
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
```

---

## 7. Styling & Theming

### Design System

TripPlanner supports two visual themes:

#### Bright Theme (Farmhouse)
- Warm, inviting farmhouse aesthetics
- Floral and sunny elements
- Cream, beige, warm white backgrounds
- Rose, lavender, sage green accents
- Golden amber highlights

#### Vigilante Theme (Warm Brown)
- Cozy dark theme
- Warm brown tones
- Evening-friendly

### Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        // ... more color variables
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
```

### CSS Variables

```css
:root {
  /* Bright Theme defaults */
  --primary: 38 57% 45%;
  --primary-foreground: 0 0% 100%;
  --secondary: 340 60% 75%;
  --background: 40 30% 97%;
  --foreground: 30 20% 25%;
  --accent: 45 90% 60%;
  --radius: 0.75rem;
}

.dark {
  /* Vigilante Theme */
  --primary: 25 30% 60%;
  --background: 25 20% 15%;
  --foreground: 30 20% 85%;
  /* ... */
}
```

---

## 8. Testing Strategy

### Test Types

| Type | Tool | Purpose |
|------|------|---------|
| Unit Tests | Vitest | Component logic, utilities |
| Component Tests | Testing Library | Component rendering |
| E2E Tests | Playwright | Full user flows |

### Test Structure

```
src/
├── test/
│   ├── mocks/
│   │   ├── handlers.ts       # MSW request handlers
│   │   └── browser.ts        # MSW browser setup
│   ├── setup.ts              # Vitest setup
│   └── test-utils.tsx        # Custom render utilities
│
├── components/
│   ├── trip-card.test.tsx
│   ├── app-header.test.tsx
│   └── ...
│
├── store/
│   ├── trip-store.test.ts
│   └── ...
│
└── app/
    └── **/*.test.tsx
```

### Mock API

Development mode supports mock API via `NEXT_PUBLIC_USE_MOCK_API=true`.

```typescript
// services/mock-api/trips.ts
export const mockTrips = [
  {
    id: '1',
    name: 'Summer Vacation',
    destination: 'Hawaii',
    startDate: '2024-07-01',
    endDate: '2024-07-14',
    status: 'PLANNING',
  },
  // ...
];
```

---

## 9. Performance Optimization

### Strategies

1. **Code Splitting**: Next.js automatic route-based splitting
2. **Image Optimization**: Next.js Image component
3. **Lazy Loading**: `React.lazy()` for heavy components
4. **Memoization**: `React.memo()`, `useMemo()`, `useCallback()`
5. **Virtual Scrolling**: For long message lists
6. **Prefetching**: API data prefetching on hover

### Bundle Analysis

```bash
npm run build
# Analyze with @next/bundle-analyzer
```

---

## 10. Security

### Best Practices

- **XSS Prevention**: React's built-in escaping, no `dangerouslySetInnerHTML`
- **CSRF Protection**: NextAuth.js handles CSRF tokens
- **Input Validation**: Zod schemas on all user inputs
- **Auth State**: Server-side session verification
- **API Keys**: Never expose sensitive keys in frontend code

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_DEBUG=false
```

---

## 11. Docker Configuration

### Development (`Dockerfile.dev`)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
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
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 12. Future Considerations

### Mobile App
- React Native implementation planned
- Shared component library
- Push notifications via FCM

### PWA Features
- Offline support
- Install prompt
- Background sync

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast verification
