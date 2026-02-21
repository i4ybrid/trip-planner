import { z } from 'zod';

export const createTripSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    destination: z.string().max(100).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    coverImage: z.string().url().optional(),
  }),
});

export const updateTripSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    destination: z.string().max(100).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    coverImage: z.string().url().optional(),
    status: z.enum(['IDEA', 'PLANNING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  }),
});

export const createActivitySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    location: z.string().max(200).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    cost: z.number().min(0).optional(),
    category: z.string().min(1).max(50),
  }),
});

export const updateActivitySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    location: z.string().max(200).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    cost: z.number().min(0).optional(),
    category: z.string().min(1).max(50).optional(),
  }),
});

export const voteSchema = z.object({
  body: z.object({
    option: z.enum(['yes', 'no', 'maybe']),
  }),
});

export const createMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(4000),
    messageType: z.enum(['TEXT', 'IMAGE', 'VIDEO']).optional(),
  }),
});

export const editMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(4000),
  }),
});

export const reactionSchema = z.object({
  body: z.object({
    emoji: z.string().min(1).max(10),
  }),
});

export const createExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1).max(200),
    amount: z.number().min(0.01),
    currency: z.string().length(3).default('USD'),
    paidById: z.string().min(1),
    splitType: z.enum(['equal', 'shares', 'percentage', 'custom']),
    splits: z.array(z.object({
      userId: z.string(),
      amount: z.number().min(0),
    })).optional(),
    category: z.string().max(50).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().optional(),
    phone: z.string().optional(),
    venmo: z.string().max(100).optional(),
    paypal: z.string().max(100).optional(),
    zelle: z.string().max(100).optional(),
  }),
});

export const inviteSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    channel: z.enum(['email', 'whatsapp', 'sms', 'messenger', 'telegram', 'google_chat', 'link']).optional(),
  }),
});

export const pushSubscriptionSchema = z.object({
  body: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
  }),
});

export const bookingSchema = z.object({
  body: z.object({
    activityId: z.string().optional(),
    confirmationNum: z.string().max(50).optional(),
    status: z.enum(['PROPOSED', 'CONFIRMED', 'CANCELLED', 'REFUNDED']).optional(),
    receiptUrl: z.string().url().optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const deadlineSchema = z.object({
  body: z.object({
    votingEndsAt: z.string().datetime(),
  }),
});
