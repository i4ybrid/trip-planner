# TripPlanner E2E Test Specification

**Document Version:** 1.0  
**Created:** 2026-03-26  
**Status:** DRAFT - Needs QA Review  
**Framework:** Playwright  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [Authentication Tests](#3-authentication-tests)
4. [Trip Tests](#4-trip-tests)
5. [Friends System Tests](#5-friends-system-tests)
6. [Chat/Messaging Tests](#6-chatmessaging-tests)
7. [Payments/Expenses Tests](#7-paymentsexpenses-tests)
8. [Activities & Voting Tests](#8-activities--voting-tests)
9. [Memories Tests](#9-memories-tests)
10. [Notifications Tests](#10-notifications-tests)
11. [Settings Tests](#11-settings-tests)
12. [Test Execution Order](#12-test-execution-order)

---

## 1. Overview

### Scope
This specification covers ALL user-facing features of the TripPlanner application. Every use case listed in the requirements must have an E2E test.

### Test Principles
- Tests are **user-centric**: they test what users do, not implementation details
- Tests are **independent**: each test can run standalone
- Tests use **real data flows**: no mocking of user interactions
- Tests are **stable**: proper waits and assertions for async operations

### Test Data Requirements
- Multiple test users with different roles
- Pre-existing trips with various statuses
- Friends relationships between users
- Existing chat messages for pagination tests

---

## 2. Test Environment Setup

### Required Test Users

| User | Role | Purpose |
|------|------|---------|
| `alice@test.com` | MASTER/OWNER | Primary test user, trip creator |
| `bob@test.com` | ORGANIZER | Can manage activities and payments |
| `charlie@test.com` | MEMBER | Standard member, can vote |
| `diana@test.com` | VIEWER | Can view only, cannot vote or spend |
| `eve@test.com` | Non-member | For invite testing |

### Required Test Data Setup

```
Test Users: alice, bob, charlie, diana, eve (all with passwords: Test123!)
Friends: alice ↔ bob, bob ↔ charlie (established friendships)
Trip: "Beach Vacation" owned by alice, with bob (ORGANIZER), charlie (MEMBER), diana (VIEWER)
Trip Status: PLANNING
Trip with IDEA status for status transition tests
Trip with CONFIRMED status for payment tests
Existing chat messages: >30 for pagination tests
Existing activities with votes for voting tests
Existing bill splits for payment workflow tests
Existing media items for memories tests
```

---

## 3. Authentication Tests

### AUTH-001: User Registration/Signup
**Priority:** P0 (Critical)  
**Path:** `/login` → Sign up flow

**Steps:**
1. Navigate to `/login`
2. Click "Sign up" link
3. Fill registration form (name, email, password)
4. Submit registration
5. Verify redirect to dashboard
6. Verify user appears in header with correct name

**Assertions:**
- [ ] Registration form accepts valid input
- [ ] Password strength validation works
- [ ] Email uniqueness validation works
- [ ] After signup, user is logged in automatically
- [ ] Dashboard loads with user's name in header

**Test Data:**
```
Name: New User
Email: newuser@test.com
Password: Test123!
```

---

### AUTH-002: User Login
**Priority:** P0 (Critical)  
**Path:** `/login`

**Steps:**
1. Navigate to `/login`
2. Enter valid email and password
3. Click "Sign in" button
4. Verify redirect to `/dashboard`

**Assertions:**
- [ ] Login form accepts valid credentials
- [ ] Successful login redirects to dashboard
- [ ] User's name/avatar appears in header
- [ ] Session persists across page refresh

**Test Data:**
```
Email: alice@test.com
Password: Test123!
```

---

### AUTH-003: User Logout
**Priority:** P0 (Critical)  
**Path:** Any authenticated page

**Steps:**
1. Login as alice@test.com
2. Click user avatar in header
3. Select "Logout" from dropdown
4. Verify redirect to `/login`
5. Attempt to access `/dashboard` - should redirect to login

**Assertions:**
- [ ] Logout option appears in user dropdown
- [ ] Clicking logout clears session
- [ ] User is redirected to login page
- [ ] Protected routes require re-authentication

---

### AUTH-004: Login with Invalid Credentials
**Priority:** P1 (High)  
**Path:** `/login`

**Steps:**
1. Navigate to `/login`
2. Enter invalid email or password
3. Click "Sign in"
4. Observe error message

**Assertions:**
- [ ] Error message displays for invalid credentials
- [ ] User stays on login page
- [ ] No session is created

---

## 4. Trip Tests

### TRIP-001: Create New Trip
**Priority:** P0 (Critical)  
**Path:** `/trip/new`

**Steps:**
1. Login as alice@test.com
2. Click "New Trip" button
3. Fill trip creation form:
   - Name: "Summer Italy Trip"
   - Destination: "Rome, Italy"
   - Start Date: future date
   - End Date: later future date
   - Description: "Our amazing Italian adventure!"
4. Submit form
5. Verify redirect to trip overview page

**Assertions:**
- [ ] Trip is created with correct name
- [ ] User is set as MASTER/OWNER
- [ ] Trip status is IDEA by default
- [ ] User is redirected to trip overview
- [ ] Trip appears in dashboard list

---

### TRIP-002: View Trip Overview
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/overview`

**Steps:**
1. Login as alice@test.com
2. Navigate to "Beach Vacation" trip
3. Verify overview page elements:
   - Trip name and destination
   - Trip status badge
   - Members grid with avatars and roles
   - Quick stats (activity count, member count)
   - Budget summary card

**Assertions:**
- [ ] Trip name displays correctly
- [ ] Destination shows if set
- [ ] Status badge shows correct status (PLANNING)
- [ ] All members show with correct roles (MASTER, ORGANIZER, MEMBER, VIEWER)
- [ ] Avatar initials fallback works for users without photos
- [ ] Quick stats are accurate
- [ ] Budget card shows total expenses

---

### TRIP-003: Trip User Roles Verification
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/overview`

**Steps:**
1. Login as alice (MASTER) - verify full controls
2. Login as bob (ORGANIZER) - verify can manage activities/payments
3. Login as charlie (MEMBER) - verify can vote
4. Login as diana (VIEWER) - verify view-only access

**Assertions:**
- [ ] MASTER can see all management options
- [ ] ORGANIZER sees activity and payment management
- [ ] MEMBER sees voting options
- [ ] VIEWER does NOT see vote buttons or expense creation
- [ ] Role badges display correctly on member cards

---

### TRIP-004: Invite Members to Trip
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/overview` → Invite flow

**Steps:**
1. Login as alice (MASTER)
2. Navigate to "Beach Vacation" trip
3. Click "Invite" button
4. Enter eve@test.com in invite field
5. Send invite
6. Verify success toast/notification

**Assertions:**
- [ ] Invite button is visible to MASTER/ORGANIZER
- [ ] Invite modal/form opens
- [ ] Email field accepts valid email format
- [ ] Invite sent confirmation appears
- [ ] Invite appears in trip's invite list

**Edge Cases:**
- Invite already invited user (should show warning)
- Invite non-existent email (should still create invite)

---

### TRIP-005: Accept Trip Invite
**Priority:** P0 (Critical)  
**Path:** `/invite/[token]`

**Steps:**
1. Login as eve@test.com (has pending invite)
2. Navigate to invite link or check notifications
3. Click "Accept" on invite
4. Verify redirect to trip overview
5. Verify eve appears as MEMBER in trip

**Assertions:**
- [ ] Invite page shows trip details preview
- [ ] Accept button adds user as MEMBER
- [ ] User is redirected to trip page
- [ ] User appears in trip members list

---

### TRIP-006: Remove Members from Trip
**Priority:** P1 (High)  
**Path:** `/trip/[id]/overview` → Member management

**Steps:**
1. Login as alice (MASTER)
2. Navigate to "Beach Vacation" trip
3. Find charlie's member card
4. Click remove/options menu
5. Remove charlie from trip
6. Verify charlie is no longer in member list

**Assertions:**
- [ ] Remove option visible to MASTER only
- [ ] Member is removed from list
- [ ] Removed user cannot access trip
- [ ] Other members still see updated list

---

### TRIP-007: Change Trip Status
**Priority:** P1 (High)  
**Path:** `/trip/[id]/overview`

**Steps:**
1. Login as alice (MASTER)
2. Navigate to "Beach Vacation" trip (status: IDEA)
3. Click status dropdown/button
4. Change status to PLANNING
5. Verify status updates

**Assertions:**
- [ ] Status dropdown is visible to MASTER/ORGANIZER
- [ ] Valid transitions work (IDEA → PLANNING → CONFIRMED → HAPPENING → COMPLETED)
- [ ] Invalid transitions are blocked (IDEA → HAPPENING)
- [ ] Status badge updates immediately

---

### TRIP-008: Delete Trip
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/overview` → Trip settings

**Steps:**
1. Login as alice (MASTER)
2. Navigate to trip settings
3. Click "Delete Trip"
4. Confirm deletion
5. Verify redirect to dashboard

**Assertions:**
- [ ] Delete option only for MASTER
- [ ] Confirmation dialog appears
- [ ] Trip is removed from dashboard
- [ ] All associated data is deleted

---

## 5. Friends System Tests

### FRIEND-001: View Friends List
**Priority:** P0 (Critical)  
**Path:** `/friends`

**Steps:**
1. Login as alice@test.com
2. Navigate to `/friends`
3. Verify friends list displays

**Assertions:**
- [ ] Friends tab shows all accepted friends
- [ ] Each friend shows name and avatar
- [ ] Avatar fallback shows initials
- [ ] Friends are sorted alphabetically or by recent interaction

---

### FRIEND-002: Send Friend Request
**Priority:** P0 (Critical)  
**Path:** `/friends` → Add friend

**Steps:**
1. Login as alice@test.com
2. Navigate to `/friends`
3. Click "Add Friend" button
4. Enter charlie@test.com
5. Send friend request
6. Verify request appears in "Sent" section

**Assertions:**
- [ ] Add friend button is visible
- [ ] Search/email field works
- [ ] Request appears in sent requests
- [ ] Success confirmation displays

---

### FRIEND-003: Accept Friend Request
**Priority:** P0 (Critical)  
**Path:** `/friends`

**Steps:**
1. Login as charlie@test.com (received friend request from alice)
2. Navigate to `/friends`
3. Find pending request from alice
4. Click "Accept" button
5. Verify alice moves to friends list

**Assertions:**
- [ ] Pending request shows in "Received" section
- [ ] Accept button adds friend
- [ ] Friend appears in friends list
- [ ] Request moves to "Sent" (as sent_to acceptance) or disappears

---

### FRIEND-004: Reject Friend Request
**Priority:** P1 (High)  
**Path:** `/friends`

**Steps:**
1. Login as charlie@test.com (has pending request from alice)
2. Navigate to `/friends`
3. Find pending request
4. Click "Reject" or "Decline"
5. Verify request is removed

**Assertions:**
- [ ] Reject option is visible
- [ ] Request disappears from received list
- [ ] Users are NOT added as friends

---

### FRIEND-005: Remove Friend
**Priority:** P1 (High)  
**Path:** `/friends`

**Steps:**
1. Login as alice@test.com (is friends with bob)
2. Navigate to `/friends`
3. Find bob in friends list
4. Click options/remove button
5. Confirm removal

**Assertions:**
- [ ] Remove option appears in friend options
- [ ] Confirmation dialog shows
- [ ] Friend is removed from list
- [ ] Both users can still use the app

---

### FRIEND-006: Block Friend
**Priority:** P1 (High)  
**Path:** `/friends`

**Steps:**
1. Login as alice@test.com
2. Navigate to `/friends`
3. Find bob in friends list
4. Click "Block" option
5. Confirm block

**Assertions:**
- [ ] Block option in friend options
- [ ] Confirmation appears
- [ ] Friend is removed from list
- [ ] Blocked user cannot send friend requests

---

### FRIEND-007: View Pending Friend Requests
**Priority:** P2 (Medium)  
**Path:** `/friends`

**Steps:**
1. Login as alice@test.com
2. Navigate to `/friends`
3. View "Sent" and "Received" sections

**Assertions:**
- [ ] Sent requests section shows pending requests
- [ ] Received requests section shows incoming requests
- [ ] Each request shows sender/receiver info
- [ ] Cancel option for sent requests

---

## 6. Chat/Messaging Tests

### CHAT-001: Send Message in Trip Chat
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Login as alice@test.com
2. Navigate to "Beach Vacation" trip
3. Click "Chat" tab
4. Type "Hello everyone!"
5. Press Enter to send
6. Verify message appears in chat

**Assertions:**
- [ ] Chat tab loads correctly
- [ ] Message input is visible
- [ ] Enter key sends message
- [ ] Message appears in chat with sender info
- [ ] Message shows timestamp

---

### CHAT-002: Multi-line Message with Shift+Enter
**Priority:** P1 (High)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Type first line
3. Press Shift+Enter for new line
4. Type second line
5. Press Enter to send
6. Verify multi-line message displays correctly

**Assertions:**
- [ ] Shift+Enter creates new line in textarea
- [ ] Message sends with both lines
- [ ] Message displays with line break preserved

---

### CHAT-003: @mention User in Trip Chat
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Type "@"
3. Verify mention dropdown appears
4. Select bob from dropdown
5. Complete message: "@bob Hello!"
6. Send message
7. Verify bob is mentioned

**Assertions:**
- [ ] @ triggers mention dropdown
- [ ] Dropdown shows all trip members
- [ ] Filtering works when typing name
- [ ] Selecting mention inserts @bob
- [ ] Mentioned user receives notification (or special styling)

---

### CHAT-004: @mention @everyone in Trip Chat
**Priority:** P1 (High)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Type "@"
3. Scroll/find "@everyone" option
4. Select @everyone
5. Send message
6. Verify @everyone mention works

**Assertions:**
- [ ] @everyone appears in mention dropdown
- [ ] Selecting @everyone inserts it in message
- [ ] Message sends successfully

---

### CHAT-005: Send Image/Video in Trip Chat
**Priority:** P1 (High)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Click attachment/media button
3. Select image file
4. Add optional caption
5. Send
6. Verify media appears in chat

**Assertions:**
- [ ] Attachment button opens file picker
- [ ] Image upload shows progress
- [ ] Media message appears in chat
- [ ] Media is viewable/playable in chat

---

### CHAT-006: Chat Message Display with Avatar
**Priority:** P1 (High)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat with existing messages
2. Observe message list
3. Verify each message shows:
   - Sender avatar (or initials)
   - Sender name
   - Message content
   - Timestamp

**Assertions:**
- [ ] Messages show sender avatar
- [ ] Avatar fallback shows initials for no-photo users
- [ ] Sender name displays
- [ ] Messages are chronologically ordered

---

### CHAT-007: Chat Pagination - Initial Load (First 30 Messages)
**Priority:** P1 (High)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Verify first 30 messages load
3. Scroll to top of chat
4. Look for "Load earlier messages" button

**Assertions:**
- [ ] First 30 messages load on page open
- [ ] Messages are newest first
- [ ] "Load earlier messages" button appears if more exist
- [ ] Button is NOT visible if < 30 messages

---

### CHAT-008: Chat Pagination - Load Older Messages
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Click "Load earlier messages"
3. Wait for older messages to load
4. Verify older messages appear above current

**Assertions:**
- [ ] Clicking button loads 30 more messages
- [ ] New messages appear at top
- [ ] Scroll position adjusts properly
- [ ] Button hides when no more messages

---

### CHAT-009: Direct Message (DM) a Friend
**Priority:** P0 (Critical)  
**Path:** `/messages`

**Steps:**
1. Login as alice@test.com
2. Navigate to `/messages`
3. Click "New Message" or find bob
4. Select bob from friends list
5. Send DM: "Hey bob, how are you?"
6. Verify message appears

**Assertions:**
- [ ] Messages page loads
- [ ] Friends list shows for DM start
- [ ] DM conversation opens
- [ ] Message sends and appears
- [ ] Conversation persists

---

### CHAT-010: Emoji Reaction on Message
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Hover over a message
3. Click reaction button (or emoji picker)
4. Select 👍 emoji
5. Verify reaction appears on message

**Assertions:**
- [ ] Reaction button visible on hover
- [ ] Emoji picker opens
- [ ] Selected emoji shows on message
- [ ] Reaction count/user updates

---

### CHAT-011: Reply to Message
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/chat`

**Steps:**
1. Navigate to trip chat
2. Hover over a message
3. Click "Reply" option
4. Type reply in composer
5. Send
6. Verify reply threads correctly

**Assertions:**
- [ ] Reply option visible on hover
- [ ] Composer shows "replying to..." context
- [ ] Reply sends successfully
- [ ] Reply is visually connected to original

---

## 7. Payments/Expenses Tests

### PAY-001: Create Trip Expense
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/payments/add`

**Steps:**
1. Login as alice@test.com
2. Navigate to "Beach Vacation" trip
3. Click "Payments" tab
4. Click "Add Expense" button
5. Fill expense form:
   - Title: "Dinner at Nobu"
   - Category: Restaurant
   - Amount: 250.00
   - Paid by: alice
   - Split type: Equal
   - Select all members
6. Submit

**Assertions:**
- [ ] Add Expense button is visible
- [ ] Form has all required fields
- [ ] Category dropdown works
- [ ] Amount accepts decimal values
- [ ] Paid by selector shows members
- [ ] Split type options work (EQUAL, SHARES, PERCENTAGE, MANUAL)
- [ ] Member selection works
- [ ] Expense appears in payment list

---

### PAY-002: Equal Split
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/payments/add`

**Steps:**
1. Create expense with amount 300.00
2. Select 3 members
3. Choose "Equal" split
4. Submit

**Assertions:**
- [ ] Each member owes 100.00
- [ ] Split amounts display correctly
- [ ] Total matches expense amount

---

### PAY-003: Shares Split
**Priority:** P1 (High)  
**Path:** `/trip/[id]/payments/add`

**Steps:**
1. Create expense with amount 300.00
2. Choose "Shares" split
3. Set member shares:
   - alice: 2 shares
   - bob: 1 share
4. Submit

**Assertions:**
- [ ] Total shares = 3
- [ ] alice owes 200.00 (2/3)
- [ ] bob owes 100.00 (1/3)

---

### PAY-004: Percentage Split
**Priority:** P1 (High)  
**Path:** `/trip/[id]/payments/add`

**Steps:**
1. Create expense with amount 200.00
2. Choose "Percentage" split
3. Set member percentages:
   - alice: 60%
   - bob: 40%
4. Submit

**Assertions:**
- [ ] alice owes 120.00 (60%)
- [ ] bob owes 80.00 (40%)
- [ ] Percentages must sum to 100 (validation)

---

### PAY-005: Manual Split
**Priority:** P1 (High)  
**Path:** `/trip/[id]/payments/add`

**Steps:**
1. Create expense with amount 150.00
2. Choose "Manual" split
3. Set custom amounts:
   - alice: 100.00
   - bob: 50.00
4. Submit

**Assertions:**
- [ ] Custom amounts are respected
- [ ] Total matches expense amount
- [ ] Validation ensures amounts sum to total

---

### PAY-006: Mark Expense as Paid (Member)
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/payments`

**Steps:**
1. Login as bob@test.com (owes money)
2. Navigate to trip payments
3. Find expense where bob owes money
4. Click "Mark as Paid" button
5. Select payment method: Venmo
6. Submit

**Assertions:**
- [ ] "Mark as Paid" button visible to member who owes
- [ ] Payment method dropdown shows options (Venmo, PayPal, Zelle, CashApp, Cash, Other)
- [ ] Status changes to PAID
- [ ] Visual indicator updates

---

### PAY-007: Mark Expense as Paid - Payment Flow PENDING → PAID → CONFIRMED
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/payments`

**Steps:**
1. Bob marks expense as PAID
2. Verify status is PAID
3. Alice (payer) clicks "Confirm Receipt"
4. Verify status changes to CONFIRMED

**Assertions:**
- [ ] Member marks self as PAID → status is PAID
- [ ] Payer sees "Confirm Receipt" option
- [ ] Payer confirms → status is CONFIRMED
- [ ] Status badge reflects correct state

---

### PAY-008: Payment Method Selection
**Priority:** P1 (High)  
**Path:** `/trip/[id]/payments`

**Steps:**
1. When marking as PAID, observe payment method options
2. Select each method type and verify selection

**Assertions:**
- [ ] Venmo option available
- [ ] PayPal option available
- [ ] Zelle option available
- [ ] CashApp option available
- [ ] Cash option available
- [ ] Other option available
- [ ] Selected method is saved

---

### PAY-009: Notify Trip Members for Payment
**Priority:** P1 (High)  
**Path:** `/trip/[id]/payments`

**Steps:**
1. Create expense
2. Notify members
3. Verify notification appears for members

**Assertions:**
- [ ] Notification is sent to members
- [ ] Members see payment notification
- [ ] Notification links to expense

---

### PAY-010: View Payment Balances
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/payments`

**Steps:**
1. Login as alice@test.com
2. Navigate to "Beach Vacation" payments
3. View balance summary

**Assertions:**
- [ ] Total trip expenses display
- [ ] Per-member balances show
- [ ] Who owes whom is clear
- [ ] Member avatars display
- [ ] Payment status for each member shows

---

### PAY-011: Edit Expense
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/payments/edit/[billId]`

**Steps:**
1. Login as alice (creator)
2. Click on existing expense
3. Click "Edit"
4. Change title or amount
5. Save changes

**Assertions:**
- [ ] Edit option available to creator/payer
- [ ] Form pre-fills with existing data
- [ ] Changes are saved
- [ ] Updated amounts reflect correctly

---

### PAY-012: Delete Expense
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/payments`

**Steps:**
1. Login as alice (creator)
2. Find existing expense
3. Click delete option
4. Confirm deletion

**Assertions:**
- [ ] Delete option available to creator
- [ ] Confirmation dialog appears
- [ ] Expense is removed from list

---

## 8. Activities & Voting Tests

### ACTIVITY-001: Propose Activity
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Login as bob@test.com (ORGANIZER)
2. Navigate to "Beach Vacation" trip
3. Click "Activities" tab
4. Click "Propose Activity" button
5. Fill activity form:
   - Title: "Surfing Lesson"
   - Category: Excursion
   - Location: "North Beach"
   - Cost: 50.00
   - Start Time: future date/time
6. Submit

**Assertions:**
- [ ] Propose Activity button visible
- [ ] Form has all required fields
- [ ] Category dropdown works
- [ ] Activity appears in list
- [ ] Proposed by shows correct user

---

### ACTIVITY-002: Vote YES on Activity
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Login as charlie@test.com (MEMBER)
2. Navigate to activities
3. Find "Surfing Lesson" activity
4. Click "YES" vote button

**Assertions:**
- [ ] Vote buttons visible (YES, NO, MAYBE)
- [ ] Clicking YES registers vote
- [ ] Vote count updates
- [ ] User's vote is recorded

---

### ACTIVITY-003: Vote NO on Activity
**Priority:** P1 (High)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Navigate to activities
2. Find "Surfing Lesson" activity
3. Click "NO" vote button

**Assertions:**
- [ ] NO vote is registered
- [ ] Vote count updates

---

### ACTIVITY-004: Vote MAYBE on Activity
**Priority:** P1 (High)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Navigate to activities
2. Find "Surfing Lesson" activity
3. Click "MAYBE" vote button

**Assertions:**
- [ ] MAYBE vote is registered
- [ ] Vote count updates

---

### ACTIVITY-005: Change Vote
**Priority:** P1 (High)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. User has voted YES
2. Click NO instead
3. Verify vote changes

**Assertions:**
- [ ] Previous vote is replaced
- [ ] New vote is recorded
- [ ] Counts update correctly

---

### ACTIVITY-006: Remove Vote
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. User has voted YES
2. Click "Remove vote" or click YES again
3. Verify vote is removed

**Assertions:**
- [ ] Vote is removed
- [ ] User no longer appears in vote list

---

### ACTIVITY-007: View Activity Results
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Multiple users vote on "Surfing Lesson"
2. Navigate to activity details
3. View vote summary

**Assertions:**
- [ ] YES votes show count and voters
- [ ] NO votes show count and voters
- [ ] MAYBE votes show count and voters
- [ ] Total votes display

---

### ACTIVITY-008: View Activity Details
**Priority:** P1 (High)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Navigate to activities list
2. Click on "Surfing Lesson"

**Assertions:**
- [ ] Activity details show title
- [ ] Description displays
- [ ] Location shows
- [ ] Cost displays
- [ ] Category badge shows
- [ ] Proposed by shows user

---

### ACTIVITY-009: Propose Accommodation (Hotel)
**Priority:** P1 (High)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Propose activity with category: Accommodation
2. Fill in hotel details
3. Submit

**Assertions:**
- [ ] Accommodation category works
- [ ] Hotel activity appears in list
- [ ] Hotel-specific fields work

---

### ACTIVITY-010: Edit Activity
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Login as bob (proposer or ORGANIZER)
2. Find proposed activity
3. Click edit
4. Modify details
5. Save

**Assertions:**
- [ ] Edit option available
- [ ] Changes save correctly

---

### ACTIVITY-011: Delete Activity
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/activities`

**Steps:**
1. Login as proposer or ORGANIZER
2. Find proposed activity
3. Click delete
4. Confirm

**Assertions:**
- [ ] Activity is removed
- [ ] Votes are removed
- [ ] Activity no longer appears

---

## 9. Memories Tests

### MEMORY-001: Upload Photo to Memories
**Priority:** P0 (Critical)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Login as alice@test.com
2. Navigate to "Beach Vacation" trip
3. Click "Memories" tab
4. Drag and drop photo file
5. Wait for upload
6. Verify photo appears in grid

**Assertions:**
- [ ] Memories tab loads
- [ ] Drag-drop zone is visible
- [ ] Upload shows progress
- [ ] Photo appears in grid after upload
- [ ] Thumbnail shows correctly

---

### MEMORY-002: Upload Video to Memories
**Priority:** P1 (High)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Navigate to Memories
2. Drag and drop video file
3. Wait for upload
4. Verify video appears

**Assertions:**
- [ ] Video file accepted
- [ ] Upload shows progress
- [ ] Video appears in grid
- [ ] Video is playable

---

### MEMORY-003: View Full-Size Photo
**Priority:** P1 (High)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Navigate to Memories
2. Click on a photo
3. View full-size modal

**Assertions:**
- [ ] Photo opens in modal/lightbox
- [ ] Full resolution displays
- [ ] Download option available

---

### MEMORY-004: Edit Photo Caption
**Priority:** P1 (High)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Hover over photo
2. Click three-dot menu
3. Click "Edit Caption"
4. Type new caption
5. Save

**Assertions:**
- [ ] Three-dot menu appears on hover
- [ ] Edit caption option works
- [ ] Caption updates
- [ ] Caption persists after reload

---

### MEMORY-005: Delete Memory
**Priority:** P1 (High)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Hover over photo
2. Click three-dot menu
3. Click "Delete"
4. Confirm deletion

**Assertions:**
- [ ] Delete option in menu
- [ ] Confirmation dialog appears
- [ ] Photo is removed from grid

---

### MEMORY-006: Memories Sorted Chronologically
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Navigate to Memories
2. View photo grid
3. Verify order

**Assertions:**
- [ ] Photos sorted by date
- [ ] Oldest photos appear first (or last, per spec - should be "oldest first")

---

### MEMORY-007: Hover Overlay on Memory
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Navigate to Memories
2. Hover over a photo
3. Observe overlay

**Assertions:**
- [ ] Hover overlay appears
- [ ] Shows caption
- [ ] Shows uploader info

---

### MEMORY-008: Upload Progress Indicator
**Priority:** P2 (Medium)  
**Path:** `/trip/[id]/memories`

**Steps:**
1. Navigate to Memories
2. Start uploading large file
3. Observe progress indicator

**Assertions:**
- [ ] Progress bar shows during upload
- [ ] UI is disabled during upload
- [ ] Success/error shown after completion

---

## 10. Notifications Tests

### NOTIF-001: View Notifications
**Priority:** P0 (Critical)  
**Path:** Header notification bell

**Steps:**
1. Login as alice@test.com
2. Look for notification bell in header
3. Click notification bell
4. View notification dropdown/panel

**Assertions:**
- [ ] Notification bell is visible
- [ ] Bell shows unread count badge
- [ ] Click opens notification panel
- [ ] Notifications list displays

---

### NOTIF-002: Notification Types
**Priority:** P0 (Critical)

**Test each notification type by triggering its action:**

| Notification Type | Trigger Action |
|-------------------|----------------|
| INVITE | Send trip invite |
| FRIEND_REQUEST | Send friend request |
| VOTE | Vote on activity |
| ACTIVITY | Propose activity |
| PAYMENT | Create expense |
| MESSAGE | Send trip message |
| DM_MESSAGE | Send direct message |

**Assertions:**
- [ ] Each notification type appears
- [ ] Notification shows correct title/body
- [ ] Notification is associated with correct trip/item

---

### NOTIF-003: Mark Notification as Read
**Priority:** P1 (High)  
**Path:** Notifications panel

**Steps:**
1. Open notifications
2. Find unread notification
3. Click on it
4. Verify it's marked read

**Assertions:**
- [ ] Click marks notification as read
- [ ] Unread count decreases
- [ ] Visual styling changes

---

### NOTIF-004: Mark All Notifications as Read
**Priority:** P2 (Medium)  
**Path:** Notifications panel

**Steps:**
1. Open notifications
2. Click "Mark all as read"
3. Verify all are marked read

**Assertions:**
- [ ] Button is visible
- [ ] All notifications marked read
- [ ] Badge count goes to 0

---

### NOTIF-005: Notification Click Navigation
**Priority:** P1 (High)  
**Path:** Notifications panel

**Steps:**
1. Receive notification for trip activity
2. Click notification
3. Verify navigation to relevant page

**Assertions:**
- [ ] Click navigates to correct page
- [ ] Relevant item is highlighted

---

## 11. Settings Tests

### SETTINGS-001: View Settings Page
**Priority:** P0 (Critical)  
**Path:** `/settings`

**Steps:**
1. Login as alice@test.com
2. Click user avatar dropdown
3. Select "Settings"
4. Verify settings page loads

**Assertions:**
- [ ] Settings page loads
- [ ] All settings categories visible

---

### SETTINGS-002: Update Profile Name
**Priority:** P1 (High)  
**Path:** `/settings/profile`

**Steps:**
1. Navigate to Settings → Profile
2. Change name
3. Save
4. Verify name updated

**Assertions:**
- [ ] Name field is editable
- [ ] Save button works
- [ ] Name updates in header

---

### SETTINGS-003: Upload Avatar
**Priority:** P1 (High)  
**Path:** `/settings/profile`

**Steps:**
1. Navigate to Settings → Profile
2. Click upload avatar button
3. Select image file
4. Upload

**Assertions:**
- [ ] Upload button opens file picker
- [ ] Image validates (type, size)
- [ ] Upload shows progress
- [ ] Avatar updates in preview
- [ ] Avatar updates in header

---

### SETTINGS-004: Remove Avatar
**Priority:** P2 (Medium)  
**Path:** `/settings/profile`

**Steps:**
1. Navigate to Settings → Profile
2. Click remove avatar option
3. Confirm

**Assertions:**
- [ ] Remove option available
- [ ] Avatar shows initials fallback
- [ ] Header shows initials

---

### SETTINGS-005: Update Payment Handles
**Priority:** P1 (High)  
**Path:** `/settings/payments`

**Steps:**
1. Navigate to Settings → Payments
2. Enter Venmo username
3. Enter PayPal email
4. Enter Zelle info
5. Enter CashApp username
6. Save

**Assertions:**
- [ ] All payment fields are editable
- [ ] Save works
- [ ] Payment handles persist

---

### SETTINGS-006: Change Password
**Priority:** P1 (High)  
**Path:** `/settings/password`

**Steps:**
1. Navigate to Settings → Password
2. Enter current password
3. Enter new password
4. Confirm new password
5. Save

**Assertions:**
- [ ] Password change works
- [ ] Validation (password match)
- [ ] Session updates

---

### SETTINGS-007: Notification Preferences - Email
**Priority:** P1 (High)  
**Path:** `/settings/notifications`

**Steps:**
1. Navigate to Settings → Notifications
2. Toggle email notification options
3. Save

**Assertions:**
- [ ] Email notification toggles work
- [ ] Save persists changes
- [ ] Settings reflect saved state

---

### SETTINGS-008: Notification Preferences - Push
**Priority:** P2 (Medium)  
**Path:** `/settings/notifications`

**Steps:**
1. Navigate to Settings → Notifications
2. Toggle push notification options
3. Save

**Assertions:**
- [ ] Push toggles work
- [ ] Save persists

---

### SETTINGS-009: Notification Preferences - In-App
**Priority:** P2 (Medium)  
**Path:** `/settings/notifications`

**Steps:**
1. Navigate to Settings → Notifications
2. Toggle in-app notification options
3. Save

**Assertions:**
- [ ] In-app toggles work
- [ ] Save persists

---

### SETTINGS-010: Friend Request Settings
**Priority:** P2 (Medium)  
**Path:** `/settings`

**Steps:**
1. Navigate to Settings
2. Find friend request settings
3. Change who can send friend requests
4. Save

**Assertions:**
- [ ] Options visible
- [ ] Setting persists

---

### SETTINGS-011: Theme Toggle (Bright/Vigilante)
**Priority:** P2 (Medium)  
**Path:** Header

**Steps:**
1. Find theme toggle in header
2. Click to switch themes
3. Observe theme change

**Assertions:**
- [ ] Theme toggle visible
- [ ] Bright theme activates
- [ ] Vigilante (dark) theme activates
- [ ] Theme persists on refresh

---

## 12. Test Execution Order

### Priority 0 (Must Pass Before Release)
```
AUTH-001 → AUTH-002 → AUTH-003
TRIP-001 → TRIP-002 → TRIP-003
FRIEND-001 → FRIEND-002 → FRIEND-003
CHAT-001 → CHAT-009
PAY-001 → PAY-002 → PAY-006 → PAY-007 → PAY-010
ACTIVITY-001 → ACTIVITY-002 → ACTIVITY-007
MEMORY-001
NOTIF-001 → NOTIF-002
SETTINGS-001
```

### Priority 1 (High Priority)
```
AUTH-004
TRIP-004 → TRIP-005 → TRIP-006 → TRIP-007
FRIEND-004 → FRIEND-005 → FRIEND-006
CHAT-002 → CHAT-003 → CHAT-004 → CHAT-005 → CHAT-006
PAY-003 → PAY-004 → PAY-005 → PAY-008 → PAY-009
ACTIVITY-003 → ACTIVITY-004 → ACTIVITY-005 → ACTIVITY-008
MEMORY-002 → MEMORY-003 → MEMORY-004 → MEMORY-005
NOTIF-003 → NOTIF-005
SETTINGS-002 → SETTINGS-003 → SETTINGS-005 → SETTINGS-006
```

### Priority 2 (Medium Priority)
```
TRIP-008
FRIEND-007
CHAT-007 → CHAT-008 → CHAT-010 → CHAT-011
PAY-011 → PAY-012
ACTIVITY-006 → ACTIVITY-009 → ACTIVITY-010 → ACTIVITY-011
MEMORY-006 → MEMORY-007 → MEMORY-008
NOTIF-004
SETTINGS-004 → SETTINGS-007 → SETTINGS-008 → SETTINGS-009 → SETTINGS-010 → SETTINGS-011
```

---

## Appendix: Test Data Fixtures

### Users Fixture
```javascript
const testUsers = [
  { email: 'alice@test.com', password: 'Test123!', name: 'Alice Smith' },
  { email: 'bob@test.com', password: 'Test123!', name: 'Bob Jones' },
  { email: 'charlie@test.com', password: 'Test123!', name: 'Charlie Brown' },
  { email: 'diana@test.com', password: 'Test123!', name: 'Diana Prince' },
  { email: 'eve@test.com', password: 'Test123!', name: 'Eve Wilson' },
];
```

### Trip Fixture
```javascript
const beachVacationTrip = {
  name: 'Beach Vacation',
  destination: 'Miami, FL',
  status: 'PLANNING',
  members: [
    { email: 'alice@test.com', role: 'MASTER' },
    { email: 'bob@test.com', role: 'ORGANIZER' },
    { email: 'charlie@test.com', role: 'MEMBER' },
    { email: 'diana@test.com', role: 'VIEWER' },
  ]
};
```

---

**Document Status:** COMPLETE  
**Next Steps:** QA agent to implement Playwright tests based on this specification
