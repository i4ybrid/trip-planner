export type TripStatus = 'IDEA' | 'PLANNING' | 'CONFIRMED' | 'HAPPENING' | 'COMPLETED' | 'CANCELLED';

export type TripStyle = 'OPEN' | 'MANAGED';

export type MemberRole = 'MASTER' | 'ORGANIZER' | 'MEMBER' | 'VIEWER';

export type MemberStatus = 'INVITED' | 'DECLINED' | 'MAYBE' | 'CONFIRMED' | 'REMOVED';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type VoteOption = 'YES' | 'NO' | 'MAYBE';

export type ActivityStatus = 'PROPOSED' | 'CONFIRMED' | 'REJECTED';

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CONFIRMED' | 'CANCELLED';

export type PaymentMethod = 'VENMO' | 'PAYPAL' | 'ZELLE' | 'CASHAPP' | 'CASH' | 'OTHER';

export type SplitType = 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';

export type CostType = 'PER_PERSON' | 'FIXED';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type FriendRequestSource = 'ANYONE' | 'TRIP_MEMBERS';

export type NotificationType =
  | 'INVITE'
  | 'VOTE'
  | 'ACTIVITY'
  | 'PAYMENT'
  | 'MESSAGE'
  | 'REMINDER'
  | 'MILESTONE'
  | 'PAYMENT_DUE'
  | 'PAYMENT_RECEIVED'
  | 'VOTE_DEADLINE'
  | 'TRIP_STARTING'
  | 'FRIEND_REQUEST'
  | 'DM_MESSAGE'
  | 'PAYMENT_REQUEST'
  | 'SETTLEMENT_REMINDER';

export type MilestoneType =
  | 'COMMITMENT_REQUEST'
  | 'COMMITMENT_DEADLINE'
  | 'FINAL_PAYMENT_DUE'
  | 'SETTLEMENT_DUE'
  | 'SETTLEMENT_COMPLETE'
  | 'CUSTOM';

export type MilestoneActionType = 'PAYMENT_REQUEST' | 'SETTLEMENT_REMINDER';

export type MilestoneStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'OVERDUE';

export type ActivityCategory = 'accommodation' | 'excursion' | 'restaurant' | 'transport' | 'activity' | 'other';

export type ShareChannel = 'email' | 'whatsapp' | 'sms' | 'messenger' | 'telegram' | 'google_chat' | 'link';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  image?: string | null;  // For NextAuth compatibility
  phone?: string;
  venmo?: string;
  paypal?: string;
  zelle?: string;
  cashapp?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  userId: string;
  friendRequestSource: FriendRequestSource;
  emailTripInvites: boolean;
  emailPaymentRequests: boolean;
  emailVotingReminders: boolean;
  emailTripReminders: boolean;
  emailMessages: boolean;
  emailFriendRequests: boolean;
  pushTripInvites: boolean;
  pushPaymentRequests: boolean;
  pushVotingReminders: boolean;
  pushTripReminders: boolean;
  pushMessages: boolean;
  inAppAll: boolean;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  timezone?: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  status: TripStatus;
  style: TripStyle;
  tripMasterId: string;
  createdAt: string;
  updatedAt: string;
  autoMilestonesGenerated?: boolean;
  _count?: {
    members: number;
    activities?: number;
    messages?: number;
    mediaItems?: number;
  };
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
  trip?: Trip;
  invitedBy?: User;
}

export interface Activity {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  cost?: number;
  currency: string;
  category: ActivityCategory;
  costType?: CostType;
  proposedBy: string;
  proposer?: User;
  votes?: Vote[];
  status?: ActivityStatus;
  confirmedAt?: string;
  rejectedAt?: string;
  confirmedBy?: string;
  rejectedBy?: string;
  createdAt: string;
}

export interface Vote {
  id: string;
  activityId: string;
  userId: string;
  option: VoteOption;
  user?: User;
}

export interface Invite {
  id: string;
  tripId: string;
  token: string;
  code?: string;
  email?: string;
  phone?: string;
  status: InviteStatus;
  expiresAt: string;
  sentById: string;
  inviteUrl?: string;
  channels?: InviteChannel[];
  trip?: Trip;
  sentBy?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

export interface InviteChannel {
  id: string;
  inviteId: string;
  channel: ShareChannel;
  externalId?: string;
}

export interface Message {
  id: string;
  tripId?: string;
  conversationId?: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  mentions?: string[];
  reactions?: Record<string, string[]>;
  replyToId?: string;
  editedAt?: string;
  deletedAt?: string;
  createdAt: string;
  sender?: User;
}

export interface MessageReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  readAt: string;
}

export interface MediaItem {
  id: string;
  tripId: string;
  uploaderId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  activityId?: string;
  caption?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  tripId: string;
  eventType: string;
  description: string;
  createdAt: string;
  createdBy?: string;
}

export interface BillSplit {
  id: string;
  tripId: string;
  activityId?: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  splitType: SplitType;
  costType?: CostType;
  paidBy: string;
  createdBy: string;
  status: PaymentStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  members?: BillSplitMember[];
}

export interface BillSplitMember {
  id: string;
  billSplitId: string;
  userId: string;
  dollarAmount: number;
  type: SplitType;
  percentage?: number;  // For PERCENTAGE split type (0-100)
  shares?: number;      // For SHARES split type
  status: PaymentStatus;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  user?: User;
}

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
  friend?: User;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  respondedAt?: string;
  sender?: User;
  receiver?: User;
}

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

export type UserRelationship = 'none' | 'friends' | 'request_sent' | 'request_received' | 'blocked';

export interface UserSearchResult {
  found: boolean;
  user?: User;
  relationship?: UserRelationship;
}

export interface DmConversation {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt: string;
  participants?: User[];
  messages?: Message[];
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  referenceId?: string;
  referenceType?: NotificationReferenceType;
  link?: string;
  isRead: boolean;
  tripId?: string;
  actionType?: string;
  createdAt: string;
}


export type NotificationCategory =
  | 'MILESTONE'
  | 'INVITE'
  | 'FRIEND'
  | 'PAYMENT'
  | 'SETTLEMENT'
  | 'CHAT'
  | 'MEMBER';

export type NotificationReferenceType =
  | 'TRIP'
  | 'INVITE'
  | 'FRIEND_REQUEST'
  | 'BILL_SPLIT'
  | 'MILESTONE'
  | 'MESSAGE'
  | 'USER';

export interface Milestone {
  id: string;
  tripId: string;
  type: MilestoneType;
  name: string;
  dueDate: string;
  isManualOverride: boolean;
  isSkipped: boolean;
  isLocked: boolean;
  isHard: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  memberCompletions?: MilestoneMemberCompletion[];
  completedCount?: number;
  totalMembers?: number;
}

export interface MilestoneMemberCompletion {
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  status: MilestoneStatus;
  completedAt?: string;
  note?: string;
}

export interface MilestoneCompletion {
  id: string;
  milestoneId: string;
  userId: string;
  status: MilestoneStatus;
  completedAt?: string;
  note?: string;
  createdAt: string;
}

export interface MilestoneAction {
  id: string;
  tripId: string;
  actionType: MilestoneActionType;
  sentById: string;
  message?: string;
  recipientIds: string[];
  sentAt: string;
}

export interface MilestoneProgress {
  milestones: {
    id: string;
    name: string;
    type: MilestoneType;
    dueDate: string;
    isHard: boolean;
    isLocked: boolean;
    isSkipped: boolean;
  }[];
  memberProgress: {
    userId: string;
    userName: string;
    userAvatarUrl?: string;
    completions: {
      milestoneId: string;
      milestoneName: string;
      milestoneType: MilestoneType;
      dueDate: string;
      status: MilestoneStatus;
      completedAt?: string;
    }[];
    completedMilestones: number;
    totalMilestones: number;
    progressPercentage: number;
  }[];
  summary: {
    totalMilestones: number;
    completedMilestones: number;
    overdueMilestones: number;
  };
}

export interface CreateTripInput {
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  style?: TripStyle;
}

export interface UpdateTripInput {
  name?: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  cost?: number;
  category: ActivityCategory;
  costType?: CostType;
}

export interface CreateInviteInput {
  email?: string;
  phone?: string;
}

export interface SendMessageInput {
  content: string;
  messageType?: MessageType;
  mentions?: string[];
}

export interface CreateBillSplitInput {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  splitType: SplitType;
  costType?: CostType;
  paidBy: string;
  activityId?: string;
  dueDate?: string;
  members?: {
    userId: string;
    shares?: number;
    percentage?: number;
    dollarAmount?: number;
  }[];
}

export interface UpdateBillSplitInput {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  splitType?: SplitType;
  costType?: CostType;
  status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'CONFIRMED' | 'CANCELLED';
  dueDate?: string;
  paidBy?: string;
  members?: {
    userId: string;
    shares?: number;
    percentage?: number;
    dollarAmount?: number;
  }[];
}

export interface CreateFriendRequestInput {
  receiverId: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
