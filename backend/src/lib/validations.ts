import { z } from 'zod';

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
  venmo: z.string().optional(),
  paypal: z.string().optional(),
  zelle: z.string().optional(),
  cashapp: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  phone: z.string().optional(),
  venmo: z.string().optional(),
  paypal: z.string().optional(),
  zelle: z.string().optional(),
  cashapp: z.string().optional(),
});

// Trip schemas
export const createTripSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImage: z.string().url().optional(),
});

export const updateTripSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  coverImage: z.string().url().optional(),
  status: z.enum(['IDEA', 'PLANNING', 'CONFIRMED', 'HAPPENING', 'COMPLETED', 'CANCELLED']).optional(),
  style: z.enum(['OPEN', 'MANAGED']).optional(),
});

// Activity schemas
export const createActivitySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  currency: z.string().default('USD'),
  category: z.string(),
});

export const updateActivitySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  cost: z.number().positive().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
});

// Vote schemas
export const createVoteSchema = z.object({
  option: z.enum(['YES', 'NO', 'MAYBE']),
});

// Invite schemas
export const createInviteSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  expiresAt: z.string().datetime(),
  channels: z.array(z.string()).optional(),
});

// Message schemas
export const createMessageSchema = z.object({
  content: z.string().min(1),
  messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'SYSTEM']).optional(),
  mentions: z.array(z.string()).optional(),
  replyToId: z.string().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1).optional(),
  mentions: z.array(z.string()).optional(),
  reactions: z.record(z.array(z.string())).optional(),
});

// BillSplit schemas
export const createBillSplitSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  splitType: z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']).default('EQUAL'),
  paidBy: z.string(),
  activityId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  members: z.array(z.object({
    userId: z.string(),
    dollarAmount: z.number().positive().optional(),
    shares: z.number().positive().optional(),
    percentage: z.number().min(0).max(100).optional(),
  })).optional(),
});

export const updateBillSplitSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  splitType: z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']).optional(),
  status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'CONFIRMED', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
  paidBy: z.string().optional(),
  members: z.array(z.object({
    userId: z.string(),
    dollarAmount: z.number().positive().optional(),
    shares: z.number().positive().optional(),
    percentage: z.number().min(0).max(100).optional(),
  })).optional(),
});

export const createBillSplitMemberSchema = z.object({
  userId: z.string(),
  dollarAmount: z.number().positive(),
  type: z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']),
});

// Friend schemas
export const createFriendRequestSchema = z.object({
  receiverId: z.string(),
});

// Notification schemas
export const updateNotificationSchema = z.object({
  read: z.boolean().optional(),
});

// Media schemas
export const createMediaItemSchema = z.object({
  type: z.enum(['image', 'video']),
  url: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  activityId: z.string().optional(),
  caption: z.string().optional(),
});

// Settings schemas
export const updateSettingsSchema = z.object({
  friendRequestSource: z.enum(['ANYONE', 'TRIP_MEMBERS']).optional(),
  emailTripInvites: z.boolean().optional(),
  emailPaymentRequests: z.boolean().optional(),
  emailVotingReminders: z.boolean().optional(),
  emailTripReminders: z.boolean().optional(),
  emailMessages: z.boolean().optional(),
  pushTripInvites: z.boolean().optional(),
  pushPaymentRequests: z.boolean().optional(),
  pushVotingReminders: z.boolean().optional(),
  pushTripReminders: z.boolean().optional(),
  pushMessages: z.boolean().optional(),
  inAppAll: z.boolean().optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('20'),
});
