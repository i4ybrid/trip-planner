// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Trip types
export interface TripCreateInput {
  name: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  coverImage?: string;
}

export interface TripUpdateInput {
  name?: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  coverImage?: string;
  status?: 'IDEA' | 'PLANNING' | 'CONFIRMED' | 'HAPPENING' | 'COMPLETED' | 'CANCELLED';
}

// Activity types
export interface ActivityCreateInput {
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  cost?: number;
  currency?: string;
  category: string;
  proposedBy: string;
}

// Vote types
export interface VoteCreateInput {
  activityId: string;
  userId: string;
  option: 'YES' | 'NO' | 'MAYBE';
}

// Invite types
export interface InviteCreateInput {
  tripId: string;
  email?: string;
  phone?: string;
  expiresAt: Date;
  sentById: string;
  channels?: string[];
}

// Message types
export interface MessageCreateInput {
  tripId?: string;
  conversationId?: string;
  senderId: string;
  content: string;
  messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
  mentions?: string[];
  replyToId?: string;
}

// BillSplit types
export interface BillSplitCreateInput {
  tripId: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  splitType: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
  paidBy: string;
  createdBy: string;
  activityId?: string;
  dueDate?: Date;
}

export interface BillSplitMemberCreateInput {
  billSplitId: string;
  userId: string;
  dollarAmount: number;
  type: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
}

// Friend types
export interface FriendRequestCreateInput {
  senderId: string;
  receiverId: string;
}

// Notification types
export interface NotificationCreateInput {
  userId: string;
  tripId?: string;
  type: string;
  title: string;
  body: string;
  actionType?: string;
  actionId?: string;
  actionUrl?: string;
  priority?: string;
}

// Media types
export interface MediaItemCreateInput {
  tripId: string;
  uploaderId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  activityId?: string;
  caption?: string;
}

// Timeline types
export interface TimelineEventCreateInput {
  tripId: string;
  eventType: string;
  description: string;
  createdBy?: string;
}
