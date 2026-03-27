# Trip Invite Feature - Design Document

## Overview

This document outlines the design for the Trip Invite feature, including invitation methods, role management, and trip access control.

---

## 1. Feature Requirements

### 1.1 Trip Management Styles

| Style | Description | Invite Permissions |
|-------|-------------|---------------------|
| `OPEN` | Anyone in the trip can invite other users | Any trip member can invite |
| `MANAGED` | Only organizers can invite | MASTER and ORGANIZER roles only |

### 1.2 Invitation Methods

| Method | Description | Priority |
|--------|-------------|----------|
| Invite Existing Friend | Invite a friend who is already on the platform | Must Have |
| Invite by Code | Generate a shareable invite link/code | Must Have |
| Invite by Email | Send invitation via email (placeholder) | Could Have |

### 1.3 Trip User Roles

| Role | Can Invite | Can Remove Members | Can Delegate Organizer | Can Leave Trip |
|------|------------|---------------------|-------------------------|-----------------|
| MASTER | Yes (MANAGED/OPEN) | Yes (any role) | Yes | No |
| ORGANIZER | Yes (OPEN only, MANAGED only if permitted) | Yes (MEMBER/VIEWER) | No | Yes |
| MEMBER | Yes (OPEN only) | No | No | Yes |
| VIEWER | No | No | No | Yes |

### 1.4 Role Delegation

- Only MASTER can delegate another member as ORGANIZER
- MASTER can also revoke ORGANIZER role from any organizer
- ORGANIZERs cannot delegate - only MASTER has this power

---

## 2. Data Models

### 2.1 Database Schema Changes

#### New Enum: TripStyle

```prisma
enum TripStyle {
  OPEN     // Anyone can invite
  MANAGED  // Only organizers can invite
}
```

#### Update Trip Model

```prisma
model Trip {
  // ... existing fields
  style           TripStyle     @default(OPEN)
  
  // ... existing relations
}
```

#### Update TripMember Model (add invitedBy)

```prisma
model TripMember {
  // ... existing fields
  invitedById     String?       // User who sent the invite
  
  // ... existing relations
  invitedBy       User?         @relation("InviteSender", fields: [invitedById], references: [id])
}
```

### 2.2 TypeScript Types

```typescript
export type TripStyle = 'OPEN' | 'MANAGED';

export type MemberRole = 'MASTER' | 'ORGANIZER' | 'MEMBER' | 'VIEWER';

export interface Trip {
  id: string;
  name: string;
  style: TripStyle;
  // ... existing fields
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedById?: string;
  joinedAt: string;
  user?: User;
  invitedBy?: User;
}
```

---

## 3. API Endpoints

### 3.1 Trip Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id` | Get trip details (includes `style`) |
| PATCH | `/api/trips/:id` | Update trip (includes `style`) |

### 3.2 Trip Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:id/members` | List trip members |
| POST | `/api/trips/:id/members` | Add member (invite flow) |
| PATCH | `/api/trips/:id/members/:userId` | Update member role/status |
| DELETE | `/api/trips/:id/members/:userId` | Remove member |

### 3.3 Trip Invites (Existing, Extend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trips/:tripId/invites` | List trip invites |
| POST | `/api/trips/:tripId/invites` | Create invite |
| DELETE | `/api/invites/:id` | Revoke invite |

---

## 4. Authorization Logic

### 4.1 Can User Invite?

```typescript
function canUserInviteTrip(user: TripMember, trip: Trip): boolean {
  // MASTER can always invite
  if (user.role === 'MASTER') return true;
  
  // ORGANIZER can invite only if trip is OPEN
  if (user.role === 'ORGANIZER' && trip.style === 'OPEN') return true;
  
  // MEMBER can invite only if trip is OPEN
  if (user.role === 'MEMBER' && trip.style === 'OPEN') return true;
  
  return false;
}
```

### 4.2 Can User Remove Member?

```typescript
function canUserRemoveMember(requester: TripMember, target: TripMember): boolean {
  // MASTER can remove anyone
  if (requester.role === 'MASTER') return true;
  
  // ORGANIZER can remove MEMBER or VIEWER (not MASTER or other ORGANIZERs)
  if (requester.role === 'ORGANIZER') {
    return target.role === 'MEMBER' || target.role === 'VIEWER';
  }
  
  return false;
}
```

### 4.3 Can User Promote to Organizer?

```typescript
function canUserPromoteToOrganizer(requester: TripMember, target: TripMember): boolean {
  // Only MASTER can promote
  return requester.role === 'MASTER';
}
```

---

## 5. User Flows

### 5.1 Invite Existing Friend

```
1. User navigates to trip page → Members tab
2. User clicks "Invite Member" button
3. Modal opens with options:
   a. Select from friends list
   b. Enter email/username search
4. User selects a friend
5. System checks if user can invite (role + trip style)
6. If authorized:
   a. Create TripMember with status INVITED
   b. Set invitedById to current user
   c. Create notification for invited user
   d. Add timeline event
7. Return success
8. Show confirmation toast
```

### 5.2 Invite by Code

```
1. User navigates to trip page → Members tab
2. User clicks "Invite by Code" button
3. System generates unique invite code
4. Display code/link:
   - Code: ABC123XY
   - Link: https://tripplanner.app/invite/ABC123XY
5. User shares link/code
6. Non-user clicks link:
   a. If not logged in → prompt login/signup
   b. After login → add to trip as MEMBER (CONFIRMED)
   c. Create notification to trip members
7. Existing user clicks link:
   a. Add to trip as MEMBER (CONFIRMED)
   b. If already in trip → show "Already a member"
```

### 5.3 Invite by Email (Placeholder)

```
1. User navigates to trip page → Members tab
2. User clicks "Invite by Email"
3. User enters email address
4. System checks if email is registered:
   a. If registered → treat as friend invite (send notification)
   b. If not registered → show placeholder:
      "Email invitation will be sent (Coming Soon)"
5. Log for future implementation
```

### 5.4 Promote Member to Organizer

```
1. MASTER views trip member list
2. MASTER clicks "..." menu on a member
3. Options shown: "Make Organizer" (if member/viewer)
4. MASTER clicks "Make Organizer"
5. Confirmation dialog: "Promote [Name] to Organizer?"
6. MASTER confirms
7. System updates member role to ORGANIZER
8. Create timeline event
9. Notify promoted member
```

### 5.5 Remove Member

```
1. MASTER/ORGANIZER views trip member list
2. MASTER/ORGANIZER clicks "..." menu on member
3. Options: "Remove from Trip"
4. Click remove
5. Confirmation dialog:
   - MASTER: "Remove [Name] from trip?"
   - ORGANIZER: "Remove [Name] from trip? (Cannot remove organizers)"
6. User confirms
7. System updates member status to REMOVED
8. Create timeline event
9. Notify removed member
```

---

## 6. UI Components

### 6.1 Trip Settings Panel

```
┌─────────────────────────────────────────────────────────────┐
│ Trip Settings                                          [×] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Trip Name: Summer Vacation 2025                            │
│ Style:  [● Open    ○ Managed]                              │
│          ○ - Anyone can invite                             │
│          ● - Only organizers can invite                    │
│                                                             │
│ [Save Changes]                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Invite Member Modal

```
┌─────────────────────────────────────────────────────────────┐
│ Invite to Trip                                         [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔍 Search by name or email...                          ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ─────────────── OR ───────────────                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Select from Friends]                                  ││
│ └─────────────────────────────────────────────────────────┘│
│ Friends list (if selected):                                │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Avatar] John Doe                      [Invite]        ││
│ │          john@email.com                                 ││
│ ├─────────────────────────────────────────────────────────┤│
│ │ [Avatar] Jane Smith                    [Invite]        ││
│ │          jane@email.com                                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ─────────────── OR ───────────────                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Generate Invite Link]                                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ─────────────── OR ───────────────                         │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Send Email Invitation]                                ││
│ │         (Coming soon)                                     ││
│ └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Member List Item Actions

```
Member (MEMBER/VIEWER) - shown to MASTER:
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] John Doe                                           │
│          Member • Joined Jan 15                            │
│                                    [Make Organizer] [···]  │
└─────────────────────────────────────────────────────────────┘

[···] Menu:
┌─────────────────────┐
│ Make Organizer      │
│ Remove from Trip    │
├─────────────────────┤
│ View Profile        │
└─────────────────────┘

Member (ORGANIZER) - shown to MASTER:
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] Jane Smith                                         │
│          Organizer • Joined Jan 10                          │
│                                    [Remove Organizer] [···]│
└─────────────────────────────────────────────────────────────┘

[···] Menu:
┌─────────────────────┐
│ Remove Organizer   │
│ Remove from Trip   │
├─────────────────────┤
│ View Profile        │
└─────────────────────┘

Member - shown to ORGANIZER:
┌─────────────────────────────────────────────────────────────┐
│ [Avatar] John Doe                                           │
│          Member • Joined Jan 15                            │
│                                    [Remove] [···]          │
└─────────────────────────────────────────────────────────────┘

[···] Menu:
┌─────────────────────┐
│ Remove from Trip   │
├─────────────────────┤
│ View Profile        │
└─────────────────────┘
```

### 6.4 Open Trip Notice (for MEMBERs in MANAGED trips)

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ You can't invite members to this trip                   │
│ Only organizers can invite new members.                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Notifications

### 7.1 Notification Types

| Event | Type | Title | Body |
|-------|------|-------|------|
| Invited to trip | `TRIP_INVITE` | "Trip Invitation" | "{inviterName} invited you to {tripName}" |
| Promoted to organizer | `TRIP_ROLE` | "Role Updated" | "{masterName} promoted you to organizer for {tripName}" |
| Demoted from organizer | `TRIP_ROLE` | "Role Updated" | "{masterName} removed your organizer role for {tripName}" |
| Removed from trip | `TRIP_ROLE` | "Removed from Trip" | "{removerName} removed you from {tripName}" |
| Member joined via invite link | `TRIP_UPDATE` | "New Member" | "{userName} joined {tripName} via invite link" |

### 7.2 Notification Actions

- **Trip Invitation**: Accept / Decline buttons (for pending invites not yet accepted)
- **Role Update**: Navigate to trip page
- **Removed from Trip**: Navigate to trips list

---

## 8. Error Handling

| Error | HTTP Code | User Message |
|-------|-----------|--------------|
| Trip not found | 404 | "Trip not found" |
| Not a member | 403 | "You are not a member of this trip" |
| Cannot invite (role) | 403 | "You don't have permission to invite members" |
| Cannot invite (managed style) | 403 | "Only organizers can invite members to this trip" |
| Cannot remove (role) | 403 | "You don't have permission to remove this member" |
| Cannot promote (not master) | 403 | "Only the trip master can promote members to organizers" |
| User already in trip | 400 | "{name} is already a member of this trip" |
| Invite code invalid | 400 | "This invite link is invalid or expired" |

---

## 9. Implementation Phases

### Phase 1: Core Invite System
- [ ] Add `style` field to Trip model
- [ ] Add `invitedById` field to TripMember model
- [ ] Update trips API to handle style
- [ ] Implement authorization checks for invite
- [ ] Create invite member endpoint
- [ ] Create generate invite code endpoint

### Phase 2: Role Management
- [ ] Create promote/demote organizer endpoint
- [ ] Create remove member endpoint with authorization
- [ ] Add timeline events for role changes

### Phase 3: Notifications
- [ ] Add notification types for role changes
- [ ] Add notification for removed members
- [ ] Add notification for invite link joins

### Phase 4: Frontend
- [ ] Update trip settings to show style toggle
- [ ] Update invite modal with friend selection
- [ ] Update member list with role actions
- [ ] Add error messages for permission denied

---

## 10. API Request/Response Examples

### 10.1 Update Trip Style

```
PATCH /api/trips/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "style": "MANAGED"
}

Response (200 OK):
{
  "data": {
    "id": "trip-123",
    "name": "Summer Vacation",
    "style": "MANAGED",
    ...
  }
}
```

### 10.2 Invite Member

```
POST /api/trips/:id/members
Content-Type: application/json
Authorization: Bearer <token>

{
  "userId": "user-456"  // Existing user to invite
}

Response (201 Created):
{
  "data": {
    "id": "member-789",
    "tripId": "trip-123",
    "userId": "user-456",
    "role": "MEMBER",
    "status": "INVITED",
    "invitedById": "current-user",
    "joinedAt": "2025-03-22T10:00:00Z"
  }
}
```

### 10.3 Generate Invite Code

```
POST /api/trips/:id/invites
Authorization: Bearer <token>

Response (201 Created):
{
  "data": {
    "id": "invite-123",
    "tripId": "trip-123",
    "code": "ABC123XY",
    "inviteUrl": "https://tripplanner.app/invite/ABC123XY",
    "expiresAt": "2025-03-29T10:00:00Z",
    "sentById": "current-user",
    "createdAt": "2025-03-22T10:00:00Z"
  }
}
```

### 10.4 Use Invite Code

```
POST /api/invites/ABC123XY/use
Authorization: Bearer <token>

Response (200 OK):
{
  "data": {
    "tripId": "trip-123",
    "tripName": "Summer Vacation",
    "memberId": "member-789",
    "status": "CONFIRMED"
  }
}
```

### 10.5 Promote to Organizer

```
PATCH /api/trips/:id/members/:userId
Content-Type: application/json
Authorization: Bearer <token> (MASTER only)

{
  "role": "ORGANIZER"
}

Response (200 OK):
{
  "data": {
    "id": "member-789",
    "userId": "user-456",
    "role": "ORGANIZER",
    "status": "CONFIRMED"
  }
}
```

### 10.6 Remove Member

```
DELETE /api/trips/:id/members/:userId
Authorization: Bearer <token>

Response (200 OK):
{
  "data": {
    "id": "member-789",
    "userId": "user-456",
    "status": "REMOVED"
  }
}
```

### 10.7 Invite by Email (Placeholder)

```
POST /api/trips/:id/invites/email
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "friend@example.com"
}

Response (200 OK):
{
  "data": {
    "success": true,
    "message": "Email invitation placeholder - feature not implemented",
    "existingUserNotified": false  // Will be true if email is registered
  }
}
```

---

## 11. Frontend Integration

### 11.1 Updated Types

```typescript
// frontend/src/types/index.ts

export type TripStyle = 'OPEN' | 'MANAGED';

export interface Trip {
  id: string;
  name: string;
  style: TripStyle;
  // ... existing
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  invitedById?: string;
  user?: User;
  invitedBy?: User;
  // ... existing
}
```

### 11.2 API Service Updates

```typescript
// frontend/src/services/api.ts

export const tripApi = {
  // ... existing
  
  updateStyle: (tripId: string, style: TripStyle) =>
    patch(`/api/trips/${tripId}`, { style }),
    
  inviteMember: (tripId: string, userId: string) =>
    post(`/api/trips/${tripId}/members`, { userId }),
    
  generateInviteCode: (tripId: string) =>
    post(`/api/trips/${tripId}/invites`),
    
  useInviteCode: (code: string) =>
    post(`/api/invites/${code}/use`),
    
  updateMemberRole: (tripId: string, userId: string, role: MemberRole) =>
    patch(`/api/trips/${tripId}/members/${userId}`, { role }),
    
  removeMember: (tripId: string, userId: string) =>
    delete(`/api/trips/${tripId}/members/${userId}`),
    
  inviteByEmail: (tripId: string, email: string) =>
    post(`/api/trips/${tripId}/invites/email`, { email }),
};
```

---

## 12. Migration Strategy

### 12.1 Database Migration

```sql
-- Add TripStyle enum (if not exists in your DB)
CREATE TYPE TripStyle AS ENUM ('OPEN', 'MANAGED');

-- Add style column to Trip
ALTER TABLE "Trip" ADD COLUMN "style" "TripStyle" NOT NULL DEFAULT 'OPEN';

-- Add invitedById column to TripMember
ALTER TABLE "TripMember" ADD COLUMN "invitedById" TEXT;
ALTER TABLE "TripMember" ADD CONSTRAINT "TripMember_invitedById_fkey" 
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL;
```

### 12.2 Deployment Order

1. Run database migration
2. Deploy backend with new endpoints
3. Deploy frontend with updated components
4. Feature flagged rollout (optional)