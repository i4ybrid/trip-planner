# Use Cases

> Extracted from DESIGN.md Sections 5-7. User flows, UI structure, and key feature descriptions.

---

## 1. Invite & Join Flow

### Deep Link Format
```
https://tripplanner.app/invite/{code}
tripplanner://invite/{code}       (mobile deep link)
```

### Shareable Invite Link
1. Organizer opens trip settings → clicks "Invite"
2. System generates a shareable `code` (e.g., `Hawaii2026`)
3. User can copy link or share directly
4. Recipient visits `/invite/[code]` to see trip info

### Email Invite
1. Organizer enters recipient's email address
2. System sends email with invite link via SendGrid
3. Recipient clicks link to accept/decline

### Invite Response Flow
```
1. User A invites User B to a trip (via email invite or link)
2. User B receives notification ("[User A] invited you to [Trip Name]")
3. User B clicks Accept or Decline in:
   - The notification panel
   - The /invites/pending page
4. If Accept:
   - OPEN trips: User B → CONFIRMED member immediately
   - MANAGED trips: User B → INVITED (pending MASTER/ORGANIZER approval)
   - A **pending badge** appears on the notification bell when invites are awaiting acceptance
   - For MANAGED trips: after accepting an invite, the user sees a 'pending approval' state until a trip admin approves their join request
5. If Decline: Invite marked DECLINED, User B not added
6. Accepted: User B redirected to trip dashboard
```

### Pending Invites Page (`/invites/pending`)
- Lists all pending invites for the current user
- Accept/Decline buttons for each
- Visual indicator for MANAGED trips (requires approval)
- After accept: redirect to trip (OPEN) or stay on page (MANAGED)

### Notification-Based Invite Flow
1. Invite record created with unique token
2. Notification created with:
   - Type: `INVITE`
   - ActionType: `invite`
   - ActionId: the invite token
   - ActionUrl: `/invites/pending`
3. Notification panel shows Accept/Decline buttons
4. `/invites/pending` page also lists all pending invites

---

## 2. UI Structure & Page Hierarchy

### Page Hierarchy
```
/
├── /login                    # Auth pages (NextAuth)
├── /dashboard                # Main dashboard — all user trips
├── /friends                  # Friends list & requests
├── /messages                 # Direct messages (DMs)
├── /trip/new                 # Create new trip wizard
├── /trip/[id]                # Trip detail (tabbed)
│   ├── /trip/[id]/overview   # Trip overview (default tab)
│   ├── /trip/[id]/activities # Activities, hotels & voting
│   ├── /trip/[id]/timeline   # Event timeline (past + upcoming milestones)
│   ├── /trip/[id]/chat       # Group chat
│   ├── /trip/[id]/payments   # Payment list & summary
│   │   ├── /trip/[id]/payments/add
│   │   └── /trip/[id]/payments/edit/[billId]
│   └── /trip/[id]/memories  # Photos & videos
├── /settings                 # User settings
│   ├── /settings/profile
│   ├── /settings/password
│   ├── /settings/payments    # Venmo, PayPal, Zelle, CashApp handles
│   └── /settings/notifications
└── /invite/[code]           # Public invite acceptance
```

### Layout Structure
```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌────────────────────────────────────────┐ │
│ │  Left    │ │ [AppHeader: Title | Theme | Notif |👤]│ │
│ │ Sidebar  │ ├────────────────────────────────────────┤ │
│ │          │ │                                          │ │
│ │ [Logo]   │ │           Main Content Area               │ │
│ │          │ │                                          │ │
│ │ [Menu]   │ │                                          │ │
│ │ - Dash   │ │                                          │ │
│ │ - New    │ │                                          │ │
│ │ - Friend │ │                                          │ │
│ │ - Msgs   │ │                                          │ │
│ │ - Set    │ │                                          │ │
│ └──────────┘ └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### AppHeader Component
- Title (optional, page-specific)
- Back button (optional, for nested pages)
- Custom actions slot
- Theme switcher (sun/moon toggle)
- Notification drawer button
- User menu (avatar dropdown → Settings, Profile, Logout)

### Trip Overview Page Sections
1. **Trip Header** — Name, destination, invite button, settings
2. **Trip Status Card** — Current status + description + date range
3. **Members Card** — Grid of members with avatars and roles
4. **Activities List** — Proposed and confirmed activities with voting status
5. **Quick Stats Card** — Activity count, member count, memory count
6. **Budget Card** — Total expenses, collected amount, link to Payments

### Timeline Tab
The Timeline tab shows a chronological event log of trip activity: votes cast, activities proposed/confirmed, members joining/leaving, payment/settlement events, etc. This is where milestones and trip history are now displayed.

---

## 3. Trip Status Workflow

```
IDEA ──→ PLANNING ──→ CONFIRMED ──→ HAPPENING ──→ COMPLETED
  │         │              │              │            │
"Feelers" "Voting"    "Collect $   "Trip Active" "Settle Up"
           & Plan       & Book"
```

| Status | Description |
|--------|-------------|
| `IDEA` | Gauging interest — feelers out |
| `PLANNING` | Active planning & voting on activities |
| `CONFIRMED` | Trip confirmed, collecting payments |
| `HAPPENING` | Trip has started |
| `COMPLETED` | Trip finished — settle up |
| `CANCELLED` | Trip cancelled |

**`IDEA → PLANNING` transition:** Triggers automatic milestone generation.

---

## 4. Trip Styles

| Style | Behavior |
|-------|----------|
| `OPEN` | Anyone can join immediately after accepting invite |
| `MANAGED` | MASTER/ORGANIZER must approve new members after accept |

---

## 5. Payment Flow

### Create Expense
```
1. User clicks "Add Expense" on Payments page
2. Selects category: Restaurant, Excursion, House, Other
3. Enters description (title)
4. Enters subtotal + tax + tip → Total = subtotal + tax + tip
5. Selects who paid (paidBy)
6. Selects split type:
   - Equal: split evenly among all members
   - Shares: each member has share count → amount = (shares/totalShares) * total
   - Percentage: each member has % → must sum to 100%
   - Manual: each member has manually set dollar amount
7. Configures member splits
   ↓
BillSplit created with:
   - Total amount = subtotal + tax + tip
   - paidBy = user who paid
   - members[] = array of member splits with dollarAmounts
   ↓
Members see their owed amount in trip payments
   ↓
Member marks self as paid:
   - Selects payment method (Venmo/PayPal/Zelle/CashApp/Cash)
   - Optional: enters transaction ID
   - Status → "PAID"
   ↓
Creator (payer) confirms receipt → Status → "CONFIRMED"
```

### Editing Expenses
Bill splits can be edited after creation. All fields editable. The `members[]` array **replaces** all existing member splits.

---

## 6. Voting Flow

1. Member proposes an activity (with title, description, location, cost, category)
2. Other members cast votes: YES / NO / MAYBE
3. Voting results displayed on activity card
4. Organizers can lock/confirm activities based on voting

---

## 7. Chat Features

- Real-time messaging via Socket.io
- Image/video sharing
- Emoji reactions on messages
- @mentions for user tagging
- Message editing and deletion
- Reply threads
- Typing indicators
- Read receipts
- Real-time events via Socket.io: `message_sent`, `message_edited`, `message_deleted`, `typing_indicator`, `message_read`

**Input Behavior:**
- `Enter` → Send message
- `Shift+Enter` → New line (multi-line)

**Pagination:**
- Initial load: 30 newest messages
- Scroll to top → loads older messages
- Uses `createdAt` timestamp cursor for pagination

---

## 8. Milestone System

### Scheduled Milestones (Auto-Generated)

Auto-generated when trip transitions `IDEA → PLANNING`.

| Type | Description |
|------|-------------|
| `COMMITMENT_REQUEST` | Ask members to confirm they're joining |
| `COMMITMENT_DEADLINE` | Hard deadline to commit |
| `FINAL_PAYMENT_DUE` | Final payment deadline |
| `SETTLEMENT_DUE` | Payment collection opens after trip ends |
| `SETTLEMENT_COMPLETE` | Trip officially closed |
| `CUSTOM` | Organizer-defined milestone |

### Manual Default Generation

If a trip has zero milestones (e.g., created without going through `IDEA → PLANNING`), organizers can trigger default generation via "Generate Default Milestones" button.

Uses **today** as baseline (not trip creation date).

### Custom Milestones

Organizers (`ORGANIZER` or `MASTER`) can add custom milestones at any time via "+ Add Milestone" button.

### On-Demand Actions

| Action | Description |
|--------|-------------|
| `PAYMENT_REQUEST` | Organizer requests immediate payment from selected members |
| `SETTLEMENT_REMINDER` | Organizer reminds all members to settle outstanding balances |

---

## 9. Friends & Direct Messages

### Friends
- View friends list
- Send/accept/decline friend requests
- Friend request source configurable (anyone or trip members only)

### Direct Messages
- Start 1-on-1 conversations with any user
- Real-time messaging via Socket.io
- Paginated message history

---

## 10. Notifications

### Notification Types
| Event | Notification Type |
|-------|-----------------|
| Invite sent | `TRIP_INVITE` |
| Friend request sent/received | `FRIEND_REQUEST` |
| Friend request accepted | `FRIEND_ACCEPTED` |
| Vote on activity | `VOTE_CAST` |
| Vote deadline approaching | `VOTE_DEADLINE` |
| Activity proposed | `ACTIVITY_PROPOSED` |
| Activity confirmed | `ACTIVITY_CONFIRMED` |
| Payment requested | `PAYMENT_REQUESTED` |
| Payment due reminder | `SETTLEMENT_DUE` |
| Payment received | `PAYMENT_RECEIVED` |
| Trip starting soon | `TRIP_STARTING` |
| Milestone approaching | `MILESTONE_DUE` |
| Milestone overdue | `MILESTONE_OVERDUE` |
| New trip message | `MESSAGE` |
| New DM | `DM_MESSAGE` |
| Join request (MANAGED trips) | `JOIN_REQUEST` |
| Join request approved | `JOIN_REQUEST_APPROVED` |
| Join request denied | `JOIN_REQUEST_DENIED` |

### Notification Preferences
Users can configure how they receive notifications:
- **Channels**: Email, Push (mobile), In-App
- **Per-type toggles**: Enable/disable specific notification types independently
- **Quiet hours**: Suppress non-urgent notifications during configured time windows

### Notification Settings Page (`/settings/notifications`)
- Toggle channels per notification type
- Configure quiet hours (start/end time, days of week)
- Preview of current preferences

### Notification Bell
- Displays unread count badge when there are unread notifications
- Pending invite count shown when invites are awaiting acceptance
- **Mark all as read** button to dismiss all unread notifications
- Clicking a notification navigates to the relevant trip or action page

### Real-time Delivery
Notifications are pushed in real-time via Socket.io to the user's personal room (`user:${userId}`).

---

*Extracted from DESIGN.md Sections 5-7 — User Flows & UI Structure*
*For the complete technical design, see [DESIGN.md](../DESIGN.md)*
