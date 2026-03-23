# Direct Messages - Friends Integration Design

## Overview

Enable users to start conversations with friends from the Friends page or Messages page. Users can only message confirmed friends.

---

## 1. Problem Statement

Currently:
- `handleMessage(friendId)` in Friends page navigates to `/messages?friend=${friendId}`
- Messages page doesn't handle the `friend` query parameter
- If no existing conversation exists, nothing happens

Goal:
- When navigating to `/messages?friend=${friendId}`, the app should:
  1. Check if a conversation with that friend exists
  2. If not, create a new conversation
  3. Select that conversation for messaging

---

## 2. User Flows

### 2.1 Message Friend from Friends Page

```
1. User is on Friends page
2. User clicks "Message" on a friend's card
3. System navigates to /messages?friend={friendId}
4. Messages page handles the query parameter:
   a. Fetch existing conversations
   b. Find conversation with friendId
   c. If found: select it
   d. If not found: create new conversation via POST /api/dm/conversations
   e. Select the conversation
5. User can now send messages
```

### 2.2 Start New Conversation from Messages Page

```
1. User is on Messages page
2. User clicks "New Message" button
3. Modal opens showing friends list (not blocked, confirmed friends only)
4. User selects a friend
5. System creates/finds conversation
6. Modal closes
7. Conversation is selected and displayed
```

### 2.3 Message Button States

From Friends page:
- **Not a friend**: Button disabled with tooltip "Not friends yet"
- **Pending request (sent)**: Button disabled with tooltip "Request pending"
- **Pending request (received)**: Button disabled with tooltip "Accept request first"
- **Already have conversation**: Opens existing conversation
- **No conversation yet**: Creates new conversation

---

## 3. API Changes

### 3.1 Existing Endpoint (Already Working)

```typescript
POST /api/dm/conversations
{
  "participantId": "user-123"
}
// Returns existing or newly created conversation
```

### 3.2 New Endpoint (Optional Enhancement)

```typescript
GET /api/dm/conversations?withUser={userId}
// Returns conversation with specific user if exists, null otherwise
```

This would be an optimization to avoid fetching all conversations. However, we can achieve the same by filtering the existing list client-side.

---

## 4. UI Changes

### 4.1 Friends Page - Message Button

Update `FriendCard` to show better state:

```typescript
interface FriendCardProps {
  friend: Friend;
  onMessage: () => void;  // Always callable for friends
  // ... other props
}
```

Message button is always enabled for confirmed friends.

### 4.2 Messages Page - New Message Button

Add "New Message" button in the sidebar header:

```
┌─────────────────────────────────────┐
│ Messages        [+ New Message]    │
├─────────────────────────────────────┤
│ [🔍 Search messages...]             │
├─────────────────────────────────────┤
│ [Conversation List...]              │
└─────────────────────────────────────┘
```

### 4.3 New Conversation Modal

```
┌─────────────────────────────────────────────────────────────┐
│ New Message                                          [×]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Search friends...                                          │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ 🔍 Search by name...                                    ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Avatar] John Doe                                       ││
│ │          john@email.com                                 ││
│ └─────────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────────┐│
│ │ [Avatar] Jane Smith                                     ││
│ │          jane@email.com                                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- Shows only confirmed friends (not pending, blocked)
- Search/filter by name
- Click to select and start conversation

---

## 5. Implementation Plan

### Phase 1: Fix Friends → Messages Navigation

**Files to modify:**
1. `frontend/src/app/friends/page.tsx` - Update `handleMessage` to navigate properly
2. `frontend/src/app/messages/page.tsx` - Handle `friend` query param
3. `frontend/src/services/api.ts` - Ensure `createDmConversation` is exposed

**Logic:**
```typescript
// In messages/page.tsx useEffect
useEffect(() => {
  const friendId = searchParams.get('friend');
  if (friendId && currentUserId) {
    // Find existing conversation
    const existing = conversations.find(c => {
      const other = getOtherParticipant(c, currentUserId);
      return other?.id === friendId;
    });
    
    if (existing) {
      setSelectedConversation(existing.id);
    } else {
      // Create new conversation
      api.createDmConversation(friendId).then(result => {
        if (result.data) {
          setConversations(prev => [result.data!, ...prev]);
          setSelectedConversation(result.data.id);
        }
      });
    }
  }
}, [searchParams, currentUserId, conversations]);
```

### Phase 2: Add "New Message" Button

**Files to modify:**
1. `frontend/src/app/messages/page.tsx` - Add button and modal
2. Create `NewConversationModal` component

---

## 6. Component Specifications

### 6.1 NewConversationModal Component

```typescript
interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  friends: Friend[];
  onSelectFriend: (friendId: string) => void;
  currentUserId: string;
}
```

**Features:**
- Search/filter friends by name
- List only confirmed friends (exclude pending, blocked)
- Click friend to start conversation
- Loading state while creating conversation

---

## 7. Edge Cases

| Case | Handling |
|------|----------|
| Friend parameter but user not logged in | Redirect to login |
| Invalid friend ID | Show error toast, stay on page |
| User is not a friend | Button disabled, tooltip explains why |
| Conversation creation fails | Show error toast, log to console |
| User navigates away while loading | Cancel pending requests |

---

## 8. Security Considerations

1. **Friendship verification**: Only allow DMs between confirmed friends
2. **Backend validation**: The existing endpoint should verify friendship before allowing conversation creation
3. **Rate limiting**: Prevent spam by limiting new conversations per minute

---

## 9. Testing Checklist

- [ ] Click "Message" on friend card → Opens/finds conversation
- [ ] New conversation created if none exists
- [ ] "New Message" button opens modal
- [ ] Modal shows only confirmed friends
- [ ] Search filters friends correctly
- [ ] Click friend in modal → Conversation created and selected
- [ ] Error handling for failed conversation creation
