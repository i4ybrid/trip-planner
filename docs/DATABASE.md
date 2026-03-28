# Database Schema

> Extracted from DESIGN.md Section 3. Contains the complete Prisma schema, enums, and model documentation.

---

## Enums

```prisma
enum TripStatus {
  IDEA        // "Feelers" - gauging interest
  PLANNING    // Active planning & voting
  CONFIRMED   // Trip confirmed, collecting payments
  HAPPENING   // Trip has started
  COMPLETED   // Trip finished
  CANCELLED   // Trip cancelled
}

enum MemberRole {
  MASTER      // Trip master/owner - full control
  ORGANIZER   // Can manage activities and payments
  MEMBER      // Standard member - can vote
  VIEWER      // Can view only - can't vote or spend
}

enum MemberStatus {
  INVITED
  DECLINED
  MAYBE
  CONFIRMED
  REMOVED
}

enum VoteOption {
  YES
  NO
  MAYBE
}

enum InviteStatus {
  PENDING
  ACCEPTED
  EXPIRED
  REVOKED
}

enum MessageType {
  TEXT
  IMAGE
  VIDEO
  SYSTEM  // Automated messages
}

enum FriendRequestStatus {
  PENDING
  ACCEPTED
  DECLINED
}

enum FriendRequestSource {
  ANYONE       // Allow friend requests from anyone
  TRIP_MEMBERS // Only allow from people in same trip
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
  CONFIRMED
  CANCELLED
}

enum PaymentMethod {
  VENMO
  PAYPAL
  ZELLE
  CASHAPP
  CASH
  OTHER
}

enum SplitType {
  EQUAL      // Split evenly among all members
  SHARES     // Split by share count (e.g., 2 shares, 1 share)
  PERCENTAGE // Split by percentage (must sum to 100)
  MANUAL     // Custom amount per member
}

enum NotificationType {
  INVITE
  VOTE
  ACTIVITY
  PAYMENT
  MESSAGE
  REMINDER
  MILESTONE
  PAYMENT_DUE
  PAYMENT_RECEIVED
  VOTE_DEADLINE
  TRIP_STARTING
  FRIEND_REQUEST
  DM_MESSAGE
}

enum TripStyle {
  OPEN      // Anyone can join after accepting invite
  MANAGED   // MASTER/ORGANIZER must approve new members
}

enum MilestoneType {
  COMMITMENT_REQUEST   // Ask members to confirm attendance
  COMMITMENT_DEADLINE  // Hard deadline to commit
  FINAL_PAYMENT_DUE    // Final payment deadline
  SETTLEMENT_DUE       // Payment collection opens after trip
  SETTLEMENT_COMPLETE  // Trip officially closed
  CUSTOM               // Organizer-defined milestone
}

enum MilestoneStatus {
  PENDING     // Not yet due
  COMPLETED   // Member completed this milestone
  SKIPPED     // Organizer skipped this milestone
  OVERDUE     // Past due date
}

enum MilestoneActionType {
  PAYMENT_REQUEST      // Organizer requested immediate payment
  SETTLEMENT_REMINDER  // Organizer reminded to settle balances
}
```

---

## Models

### User

```prisma
model User {
  id              String    @id @default(cuid())
  email           String    @unique
  name            String
  avatarUrl       String?
  phone           String?
  venmo           String?
  paypal          String?
  zelle           String?
  cashapp         String?
  passwordHash    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  memberships     TripMember[]
  createdTrips    Trip[]         @relation("TripMaster")
  activities      Activity[]
  votes           Vote[]
  messages        Message[]
  mediaItems      MediaItem[]
  notifications   Notification[]
  sentInvites     Invite[]      @relation("InviteSender")

  // Friends
  friends         Friend[]       @relation("UserFriends")
  friendOf        Friend[]       @relation("FriendOf")
  sentRequests    FriendRequest[] @relation("SentRequests")
  receivedRequests FriendRequest[] @relation("ReceivedRequests")

  // User settings
  settings       Settings?

  // Payments
  billSplitsCreated BillSplit[]     @relation("BillSplitCreator")
  billSplitsPaid    BillSplit[]     @relation("BillSplitPayer")
  billSplitMembers BillSplitMember[]

  // DMs
  dmConversations  DmConversation[] @relation("ConversationParticipants")
}
```

### Settings

```prisma
model Settings {
  userId                    String            @id

  // Friend request settings
  friendRequestSource       FriendRequestSource @default(ANYONE)

  // Email notifications
  emailTripInvites         Boolean            @default(true)
  emailPaymentRequests     Boolean            @default(true)
  emailVotingReminders     Boolean            @default(true)
  emailTripReminders       Boolean            @default(true)
  emailMessages            Boolean            @default(true)

  // Push notifications
  pushTripInvites          Boolean            @default(true)
  pushPaymentRequests      Boolean            @default(true)
  pushVotingReminders      Boolean            @default(true)
  pushTripReminders        Boolean            @default(true)
  pushMessages             Boolean            @default(true)

  // In-app notifications
  inAppAll                 Boolean            @default(true)

  user                     User              @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Trip

```prisma
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
  messages      Message[]
  mediaItems    MediaItem[]
  notifications Notification[]
  timelineEvents TimelineEvent[]
  billSplits   BillSplit[]

  // Milestones
  milestones    Milestone[]
  autoMilestonesGenerated Boolean @default(false)
  style                   TripStyle @default(OPEN)

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}
```

### TripMember

```prisma
model TripMember {
  id              String        @id @default(cuid())
  tripId          String
  userId          String
  role            MemberRole    @default(MEMBER)
  status          MemberStatus  @default(INVITED)
  joinedAt        DateTime      @default(now())

  trip            Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  user            User          @relation(fields: [userId], references: [id])

  @@unique([tripId, userId])
}
```

### Invite

```prisma
model Invite {
  id            String        @id @default(cuid())
  tripId        String
  token         String        @unique
  code          String        @unique  // Short shareable invite code
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
```

### Activity

```prisma
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
  mediaItems  MediaItem[]

  createdAt   DateTime  @default(now())
}

model Vote {
  id          String      @id @default(cuid())
  activityId  String
  userId      String
  option      VoteOption

  activity    Activity    @relation(fields: [activityId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [userId], references: [id])

  @@unique([activityId, userId])
}
```

### Message

```prisma
model Message {
  id             String        @id @default(cuid())

  // Polymorphic: either trip or conversation, not both
  tripId         String?
  conversationId String?

  senderId       String
  content        String
  messageType    MessageType   @default(TEXT)
  mentions       String[]       // user IDs tagged
  reactions      Json?          // {"👍": ["user1", "user2"], "🎉": ["user3"]}
  replyToId      String?
  editedAt       DateTime?
  deletedAt      DateTime?

  // Relations
  trip           Trip?          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  conversation   DmConversation? @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User            @relation(fields: [senderId], references: [id])
  replyTo        Message?       @relation("MessageReplies", fields: [replyToId], references: [id])
  replies        Message[]      @relation("MessageReplies")
  readReceipts   MessageReadReceipt[]

  createdAt      DateTime       @default(now())
}

model MessageReadReceipt {
  id          String       @id @default(cuid())
  messageId   String
  userId      String
  readAt      DateTime     @default(now())

  message     Message      @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user        User         @relation(fields: [userId], references: [id])

  @@unique([messageId, userId])
}
```

### TimelineEvent

```prisma
model TimelineEvent {
  id          String   @id @default(cuid())
  tripId      String
  eventType   String   // "activity_added", "member_joined", "payment_made", "vote_cast", etc.
  description String
  createdAt   DateTime @default(now())
  createdBy   String?

  trip        Trip     @relation(fields: [tripId], references: [id], onDelete: Cascade)

  @@index([tripId, createdAt])
}
```

### MediaItem

```prisma
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
```

### Notification

```prisma
model Notification {
  id            String           @id @default(cuid())
  userId        String
  tripId        String?
  type          NotificationType
  title         String
  body          String
  actionType    String?          // "payment", "vote", "trip", "friend_request", "dm"
  actionId      String?
  actionUrl     String?
  read          Boolean          @default(false)
  priority      String           @default("normal") // "low", "normal", "high", "urgent"
  scheduledFor  DateTime?

  user          User             @relation(fields: [userId], references: [id])
  trip          Trip?            @relation(fields: [tripId], references: [id])

  createdAt     DateTime         @default(now())
}
```

### Friends

```prisma
model Friend {
  id        String   @id @default(cuid())
  userId    String
  friendId  String
  createdAt DateTime @default(now())

  user      User     @relation("UserFriends", fields: [userId], references: [id])
  friend    User     @relation("FriendOf", fields: [friendId], references: [id])

  @@unique([userId, friendId])
}

model FriendRequest {
  id          String             @id @default(cuid())
  senderId    String
  receiverId  String
  status      FriendRequestStatus @default(PENDING)
  createdAt   DateTime           @default(now())
  respondedAt DateTime?

  sender      User               @relation("SentRequests", fields: [senderId], references: [id])
  receiver    User               @relation("ReceivedRequests", fields: [receiverId], references: [id])
}
```

### Direct Messages

```prisma
model DmConversation {
  id             String   @id @default(cuid())
  participant1   String
  participant2  String
  lastMessageAt DateTime @default(now())

  participants   User[]   @relation("ConversationParticipants")
  messages       Message[]

  @@unique([participant1, participant2])
}
```

### Payments

```prisma
model BillSplit {
  id            String        @id @default(cuid())
  tripId        String
  activityId    String?       // Optional: linked to an activity

  title         String        // "Hotel", "Dinner at Nobu", "Uber"
  description   String?
  amount        Decimal       @db.Decimal(10, 2)  // Total dollar amount
  currency      String        @default("USD")

  splitType     SplitType     @default(EQUAL)

  paidBy        String        // userId who initially paid
  createdBy     String

  status        PaymentStatus @default(PENDING)
  dueDate       DateTime?

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  // Relations
  trip          Trip          @relation(fields: [tripId], references: [id], onDelete: Cascade)
  activity      Activity?     @relation(fields: [activityId], references: [id])
  payer         User          @relation("BillSplitPayer", fields: [paidBy], references: [id])
  creator       User          @relation("BillSplitCreator", fields: [createdBy], references: [id])
  members       BillSplitMember[]
}

model BillSplitMember {
  id            String        @id @default(cuid())
  billSplitId   String
  userId        String

  // The literal dollar amount this person owes
  dollarAmount  Decimal       @db.Decimal(10, 2)

  // How the amount was determined
  type          SplitType     // EQUAL, SHARES, PERCENTAGE, MANUAL

  // Split configuration (for SHARES and PERCENTAGE types)
  percentage    Decimal?      @db.Decimal(5, 2)  // Percentage (0-100)
  shares        Int?          // Number of shares

  // Payment status for this member
  status        PaymentStatus @default(PENDING)
  paidAt        DateTime?
  paymentMethod PaymentMethod?
  transactionId String?

  billSplit     BillSplit    @relation(fields: [billSplitId], references: [id], onDelete: Cascade)
  user          User         @relation(fields: [userId], references: [id])

  @@unique([billSplitId, userId])
}
```

### Milestones

```prisma
model Milestone {
  id                String            @id @default(cuid())
  tripId            String
  type              MilestoneType
  name              String
  dueDate           DateTime
  isManualOverride  Boolean           @default(false)
  isSkipped         Boolean           @default(false)
  isLocked          Boolean           @default(false)
  isHard            Boolean           @default(true)
  priority          Int               @default(0)
  trip              Trip              @relation(fields: [tripId], references: [id], onDelete: Cascade)
  completions       MilestoneCompletion[]
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model MilestoneCompletion {
  id           String         @id @default(cuid())
  milestoneId  String
  userId       String
  status       MilestoneStatus @default(PENDING)
  completedAt  DateTime?
  note         String?
  milestone    Milestone      @relation(fields: [milestoneId], references: [id], onDelete: Cascade)
  user         User            @relation(fields: [userId], references: [id])
  createdAt    DateTime        @default(now())

  @@unique([milestoneId, userId])
}

model MilestoneAction {
  id            String              @id @default(cuid())
  tripId        String
  actionType    MilestoneActionType
  sentById      String
  message       String?
  recipientIds  String[]
  trip          Trip               @relation(fields: [tripId], references: [id], onDelete: Cascade)
  sentBy        User               @relation(fields: [sentById], references: [id])
  sentAt        DateTime           @default(now())
}
```

---

## Indexes

Key indexes for performance:

- `TripMember([tripId, userId])` — unique constraint for member membership
- `Message([tripId, createdAt])` — efficient trip chat pagination
- `Message([conversationId, createdAt])` — efficient DM pagination
- `MessageReadReceipt([messageId, userId])` — unique constraint for read receipts
- `Friend([userId, friendId])` — unique constraint for friendships
- `TimelineEvent([tripId, createdAt])` — efficient timeline queries
- `MilestoneCompletion([milestoneId, userId])` — unique constraint for milestone completions
- `BillSplitMember([billSplitId, userId])` — unique constraint for bill split members

---

*Extracted from DESIGN.md Section 3 — Database Schema*
*For the complete technical design, see [DESIGN.md](../DESIGN.md)*
