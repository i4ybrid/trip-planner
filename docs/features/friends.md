# Friends Feature - Design Document

## Overview

The Friends feature enables users to build a social network within TripPlanner, allowing them to connect with other users, manage friend relationships, and communicate directly.

---

## 1. Feature Requirements

### 1.1 Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| View Friends List | Display all accepted friends with search/filter | Must Have |
| Add Friend | Send friend request to existing users | Must Have |
| Remove Friend | Remove a user from friends list | Must Have |
| Accept Friend Request | Accept incoming friend request | Must Have |
| Reject Friend Request | Decline incoming friend request | Must Have |
| Cancel Sent Request | Withdraw a sent friend request | Should Have |
| Block Users | Prevent users from sending requests or viewing profile | Should Have |
| Unblock Users | Remove user from blocked list | Should Have |
| Search by Email | Find users by their email address | Must Have |
| Invite by Code | Generate shareable invite code for non-users | Should Have |
| Invite by Email | Send email invitation (stub) | Could Have |
| Message Friend | Start or continue DM conversation | Must Have |
| Friend Request Notifications | Real-time notifications for incoming requests | Must Have |

---

## 2. Data Models

### 2.1 Database Schema Changes

```prisma
model BlockedUser {
  id          String   @id @default(cuid())
  userId      String
  blockedId   String
  createdAt   DateTime @default(now())

  user        User     @relation("UserBlocks", fields: [userId], references: [id])
  blocked     User     @relation("UserBlockedBy", fields: [blockedId], references: [id])

  @@unique([userId, blockedId])
}

model InviteCode {
  id          String   @id @default(cuid())
  code        String   @unique
  createdBy   String
  expiresAt   DateTime
  usedAt     DateTime?
  usedBy     String?
  createdAt   DateTime @default(now())

  creator     User     @relation("InviteCodeCreator", fields: [createdBy], references: [id])
}
```

### 2.2 TypeScript Types

```typescript
export interface BlockedUser {
  id: string;
  userId: string;
  blockedId: string;
  createdAt: string;
  blocked?: User;
}

export interface InviteCode {
  id: string;
  code: string;
  createdBy: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
  createdAt: string;
}
```

---

## 3. API Endpoints

### 3.1 Friends

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friends` | List all friends |
| POST | `/api/friends` | Send friend request |
| DELETE | `/api/friends/:id` | Remove friend |
| GET | `/api/friends/search` | Search users by email |

### 3.2 Friend Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/friend-requests` | List sent and received requests |
| POST | `/api/friend-requests` | Send friend request |
| PATCH | `/api/friend-requests/:id` | Accept or decline request |
| DELETE | `/api/friend-requests/:id` | Cancel sent request |

### 3.3 Blocked Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blocked` | List blocked users |
| POST | `/api/blocked` | Block a user |
| DELETE | `/api/blocked/:id` | Unblock a user |

### 3.4 Invite Codes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invite-codes` | List user's invite codes |
| POST | `/api/invite-codes` | Generate new invite code |
| POST | `/api/invite-codes/:code/use` | Use invite code |
| DELETE | `/api/invite-codes/:id` | Revoke invite code |

### 3.5 Email Invites (Stub)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/invites/email` | Send email invite (stub) |

---

## 4. UI Components

### 4.1 Pages

```
/friends                     # Main friends page with tabs
├── /friends/find           # Find users modal/page
├── /friends/requests       # Friend requests tab
├── /friends/blocked         # Blocked users management
└── /friends/[friendId]     # Friend profile/actions
```

### 4.2 Friends Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Friends                                          [Add Friend]│
├─────────────────────────────────────────────────────────────┤
│ [All Friends] [Pending] [Sent] [Blocked]                   │
├─────────────────────────────────────────────────────────────┤
│ [🔍 Search friends...]                                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Avatar] John Doe                                        ││
│ │          john@email.com                                  ││
│ │                                    [Message] [⋮]        ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Avatar] Jane Smith                                      ││
│ │          jane@email.com                                  ││
│ │                                    [Message] [⋮]        ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Add Friend Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Add Friend                                            [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Search by email                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔍 user@example.com                               [Send] ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ─────────────── OR ───────────────                         │
│                                                             │
│ Invite someone new                                          │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Generate Invite Code]                                   ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Your invite code: ABC123XY                                   │
│ [Copy Link] [Send via Email]                                 │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [📧 Send Email Invitation]                              ││
│ │         (Coming soon)                                     ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Friend Request Card

```
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] Sarah Johnson                                      │
│            sarah@email.com                                   │
│                                                             │
│ [Accept] [Decline] [Block]                                   │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Friend Action Menu (⋮)

```
┌─────────────────────┐
│ Message             │
│ View Profile        │
│ Invite to Trip      │
├─────────────────────┤
│ Block User          │
│ Remove Friend       │
└─────────────────────┘
```

---

## 5. Component Specifications

### 5.1 FriendCard Component

```typescript
interface FriendCardProps {
  friend: Friend;
  onMessage: () => void;
  onRemove: () => void;
  onBlock: () => void;
  onViewProfile: () => void;
  onInviteToTrip: () => void;
}
```

**States:**
- Default: Shows avatar, name, email, online indicator
- Hover: Reveals action buttons
- Loading: Skeleton placeholder

### 5.2 FriendRequestCard Component

```typescript
interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'received' | 'sent';
  onAccept?: () => void;
  onDecline?: () => void;
  onCancel?: () => void;
  onBlock?: () => void;
}
```

### 5.3 AddFriendModal Component

```typescript
interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendRequest: (userId: string) => Promise<void>;
  onGenerateCode: () => Promise<string>;
}
```

### 5.4 SearchResultItem Component

```typescript
interface SearchResultItemProps {
  user: User;
  status: 'not_friend' | 'pending_sent' | 'pending_received' | 'already_friend';
  onSendRequest?: () => void;
  onCancelRequest?: () => void;
  onAcceptRequest?: () => void;
}
```

---

## 6. Friend Request Notifications

### 6.1 Notification Types

Friend requests generate notifications to keep users informed of incoming requests. These notifications appear in the notification dropdown in the app header.

| Event | Notification Type | Title | Body | Action |
|-------|------------------|-------|------|--------|
| Friend request received | `FRIEND_REQUEST` | "New Friend Request" | "{senderName} sent you a friend request" | Navigate to Friends page, Pending tab |
| Friend request accepted | `FRIEND_REQUEST` | "Friend Request Accepted" | "{receiverName} accepted your friend request" | Navigate to Friends page |
| Friend request declined | `FRIEND_REQUEST` | "Friend Request Declined" | "{receiverName} declined your friend request" | None |

### 6.2 Notification Data Structure

```typescript
interface FriendRequestNotification {
  id: string;
  userId: string;           // Recipient's user ID
  type: 'FRIEND_REQUEST';
  title: string;
  body: string;
  actionType: 'friend_request' | 'friend_accepted' | 'friend_declined';
  actionId: string;         // FriendRequest ID
  actionUrl: string;         // '/friends?tab=pending' or '/friends'
  read: boolean;
  priority: 'normal';
  createdAt: string;
}
```

### 6.3 Notification Dropdown UI

```
┌─────────────────────────────────────────────────────────────┐
│ Notifications                                         [Mark all read] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔔 New Friend Request                                   ││
│ │    Sarah Johnson sent you a friend request              ││
│ │    2 minutes ago                                        ││
│ │    [View] [Accept] [Decline]                           ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 💬 New Message                                           ││
│ │    John Doe: Hey, are you free this weekend?           ││
│ │    15 minutes ago                                       ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 👥 Trip Update                                           ││
│ │    Mike joined "Barcelona Trip"                         ││
│ │    1 hour ago                                            ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [View All Notifications]                                    │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Notification Actions

**From Notification Dropdown:**
- **View**: Navigate to `/friends?tab=pending` (or appropriate tab)
- **Accept** (friend requests only): Quick accept from notification
- **Decline** (friend requests only): Quick decline from notification

### 6.5 Notification Badge

The notification bell in the app header displays an unread count badge:

```
[🔔] → [🔔(3)]  ← Red badge with unread count
```

- Badge shows count up to 9+, then "9+"
- Badge pulses briefly when new notification arrives
- Badge clears when all notifications are read

### 6.6 Backend Implementation

When a friend request is created:

```typescript
// In FriendService.sendFriendRequest()
async sendFriendRequest(senderId: string, receiverId: string) {
  // ... existing validation ...

  const request = await prisma.friendRequest.create({ ... });

  // Create notification for receiver
  const sender = await prisma.user.findUnique({
    where: { id: senderId },
    select: { name: true, avatarUrl: true }
  });

  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'FRIEND_REQUEST',
      title: 'New Friend Request',
      body: `${sender.name} sent you a friend request`,
      actionType: 'friend_request',
      actionId: request.id,
      actionUrl: '/friends?tab=pending',
      read: false,
      priority: 'normal'
    }
  });

  return request;
}
```

When a friend request is accepted:

```typescript
// In FriendService.acceptFriendRequest()
async acceptFriendRequest(requestId: string) {
  // ... existing logic to create friendship ...

  // Notify the sender
  const request = await prisma.friendRequest.findUnique({
    where: { id: requestId },
    include: { sender: true, receiver: true }
  });

  await prisma.notification.create({
    data: {
      userId: request.senderId,
      type: 'FRIEND_REQUEST',
      title: 'Friend Request Accepted',
      body: `${request.receiver.name} accepted your friend request`,
      actionType: 'friend_accepted',
      actionId: requestId,
      actionUrl: '/friends',
      read: false,
      priority: 'normal'
    }
  });

  return updatedRequest;
}
```

### 6.7 Real-time Notifications (Optional Enhancement)

For immediate notification delivery:

- Use Socket.io to emit `friend_request` events
- Frontend listens for events and updates notification badge
- Toast notification appears for incoming friend requests

---

## 7. User Flows

### 7.1 Send Friend Request

```
1. User clicks "Add Friend" button
2. Add Friend modal opens
3. User enters email address
4. System searches for user by email
5. User found:
   a. Display user info (avatar, name, email)
   b. Show "Send Friend Request" button
   c. User clicks send
   d. Request sent successfully
   e. Show confirmation toast
   f. Modal closes or shows "Request Sent" state
6. User not found:
   a. Show "No user found" message
   b. Offer "Invite by Code" option
```

### 7.2 Accept Friend Request

```
1. User sees pending request notification badge
2. User navigates to Friends page
3. Pending tab shows incoming requests
4. User clicks "Accept" on a request
5. System creates bidirectional friend relationship
6. Request removed from pending list
7. User appears in friends list
8. Success toast notification
```

### 7.3 Block User

```
1. User selects "Block User" from friend menu (⋮)
2. Confirmation dialog appears:
   "Block [Name]? They won't be able to see your profile or send you messages."
3. User confirms
4. System:
   a. Creates BlockedUser record
   b. Removes any existing friend relationship
   c. Removes any pending friend requests (both directions)
   d. Optionally: leave active DM conversations (configurable)
5. User moved to blocked list
6. Toast: "[Name] has been blocked"
```

### 7.4 Invite by Code

```
1. User clicks "Add Friend" → "Invite someone new"
2. System generates unique 8-character code
3. Display code with copy button
4. User shares code via:
   a. Copy to clipboard
   b. Share link: tripplanner.app/invite/ABC123XY
5. Non-user receives code
6. Non-user visits link or enters code
7. If not logged in: prompt to sign up
8. After signup: automatically become friends
```

---

## 8. Business Rules

### 8.1 Friend Request Logic

- Cannot send request to self
- Cannot send request if already friends
- Cannot send request if blocked (either direction)
- Cannot send request if pending request exists (either direction)
- User settings control who can send requests:
  - `ANYONE`: Accepts from all users
  - `TRIP_MEMBERS`: Only from shared trip members

### 8.2 Block Logic

- Blocked users cannot:
  - See blocker's profile
  - Send friend requests to blocker
  - Message blocker via DM
  - Appear in search results (for blocker)
- Blocking removes existing friendship
- Blocking cancels pending requests (both directions)
- Blocked users can still see public trip info if invited by third party

### 8.3 Invite Code Rules

- Code format: 8 alphanumeric characters (uppercase)
- Default expiry: 7 days
- One-time use only
- Creator can revoke before use
- User who joins via code becomes friend with creator automatically

---

## 9. Implementation Phases

### Phase 1: Core Friends (MVP)
- [ ] View friends list with search
- [ ] Send friend request by email
- [ ] Accept/Reject friend requests
- [ ] Remove friend
- [ ] Message friend from friends list

### Phase 2: User Search & Blocking
- [ ] Search users by email
- [ ] User profile preview
- [ ] Block/Unblock users
- [ ] Blocked users management page

### Phase 3: Invite System
- [ ] Generate invite codes
- [ ] Use invite codes (signup flow)
- [ ] Auto-friend on invite acceptance
- [ ] Email invite stub UI

### Phase 4: Polish
- [ ] Notifications for friend requests
- [ ] Friend request settings
- [ ] Empty states and loading states
- [ ] Error handling

---

## 10. API Request/Response Examples

### 9.1 Search Users by Email

```
GET /api/friends/search?email=user@example.com

Response (200 OK):
{
  "data": {
    "found": true,
    "user": {
      "id": "user-123",
      "name": "John Doe",
      "email": "user@example.com",
      "avatarUrl": "..."
    },
    "relationship": "none" // "none" | "friends" | "request_sent" | "request_received" | "blocked"
  }
}

Response (200 OK - Not Found):
{
  "data": {
    "found": false
  }
}
```

### 9.2 Block User

```
POST /api/blocked
Content-Type: application/json
Authorization: Bearer <token>

{
  "blockedId": "user-456"
}

Response (201 Created):
{
  "data": {
    "id": "block-789",
    "userId": "current-user",
    "blockedId": "user-456",
    "createdAt": "2025-03-22T10:00:00Z"
  }
}
```

### 9.3 Generate Invite Code

```
POST /api/invite-codes
Authorization: Bearer <token>

Response (201 Created):
{
  "data": {
    "id": "invite-123",
    "code": "ABC123XY",
    "createdBy": "current-user",
    "expiresAt": "2025-03-29T10:00:00Z",
    "createdAt": "2025-03-22T10:00:00Z"
  }
}
```

### 9.4 Use Invite Code

```
POST /api/invite-codes/ABC123XY/use
Authorization: Bearer <token>

Response (200 OK):
{
  "data": {
    "success": true,
    "friendId": "invite-creator-id",
    "friendshipCreated": true
  }
}

Response (400 Bad Request - Already Used):
{
  "error": "This invite code has already been used"
}

Response (400 Bad Request - Expired):
{
  "error": "This invite code has expired"
}
```

### 9.5 Send Email Invite (Stub)

```
POST /api/invites/email
Authorization: Bearer <token>

{
  "email": "friend@example.com",
  "message": "Join me on TripPlanner!" // optional
}

Response (200 OK):
{
  "data": {
    "success": true,
    "message": "Email invite stub - not implemented"
  }
}
```

---

## 11. Error Handling

| Error | HTTP Code | User Message |
|-------|-----------|--------------|
| User not found | 404 | "No user found with this email" |
| Already friends | 400 | "You're already friends with this user" |
| Request exists | 400 | "A friend request is already pending" |
| Cannot block self | 400 | "You cannot block yourself" |
| Already blocked | 400 | "This user is already blocked" |
| User blocked you | 403 | "Unable to send request" |
| Invite code expired | 400 | "This invite code has expired" |
| Invite code used | 400 | "This invite code has already been used" |

---

## 12. Testing Checklist

### Unit Tests
- [ ] FriendService: sendFriendRequest validation
- [ ] FriendService: removeFriend removes bidirectional
- [ ] BlockService: block prevents requests
- [ ] InviteCodeService: code generation uniqueness
- [ ] InviteCodeService: expiry validation

### Integration Tests
- [ ] Full friend request flow (send → accept)
- [ ] Block removes friendship
- [ ] Invite code → signup → friend
- [ ] Blocked user cannot send request

### E2E Tests
- [ ] Send friend request by email
- [ ] Accept friend request
- [ ] Remove friend
- [ ] Block/unblock user
- [ ] Generate and use invite code
