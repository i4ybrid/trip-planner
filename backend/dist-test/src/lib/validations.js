"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.updateSettingsSchema = exports.createMediaItemSchema = exports.updateNotificationSchema = exports.createFriendRequestSchema = exports.createBillSplitMemberSchema = exports.updateBillSplitSchema = exports.createBillSplitSchema = exports.updateMessageSchema = exports.createMessageSchema = exports.createInviteSchema = exports.createVoteSchema = exports.updateActivitySchema = exports.createActivitySchema = exports.browsePublicEventsSchema = exports.createPublicEventPromotionSchema = exports.updatePublicEventSchema = exports.createPublicEventSchema = exports.updateTripSchema = exports.createTripSchema = exports.updateUserSchema = exports.createUserSchema = void 0;
const zod_1 = require("zod");
// User schemas
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    name: zod_1.z.string().min(1),
    password: zod_1.z.string().min(8).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    phone: zod_1.z.string().optional(),
    venmo: zod_1.z.string().optional(),
    paypal: zod_1.z.string().optional(),
    zelle: zod_1.z.string().optional(),
    cashapp: zod_1.z.string().optional(),
});
exports.updateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    phone: zod_1.z.string().optional(),
    city: zod_1.z.string().trim().min(1).optional().or(zod_1.z.literal('')),
    state: zod_1.z.string().trim().min(1).optional().or(zod_1.z.literal('')),
    country: zod_1.z.string().trim().min(2).max(2).optional().or(zod_1.z.literal('')),
    latitude: zod_1.z.number().min(-90).max(90).optional().nullable(),
    longitude: zod_1.z.number().min(-180).max(180).optional().nullable(),
    locationSource: zod_1.z.enum(['PROFILE', 'BROWSER', 'IP_INFERRED']).optional().nullable(),
    venmo: zod_1.z.string().optional(),
    paypal: zod_1.z.string().optional(),
    zelle: zod_1.z.string().optional(),
    cashapp: zod_1.z.string().optional(),
});
// Trip schemas
exports.createTripSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    destination: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().url().optional(),
});
exports.updateTripSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    destination: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().url().optional(),
    status: zod_1.z.enum(['IDEA', 'PLANNING', 'CONFIRMED', 'HAPPENING', 'COMPLETED', 'CANCELLED']).optional(),
    style: zod_1.z.enum(['OPEN', 'MANAGED']).optional(),
});
// Public event schemas
const publicEventBaseSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    venueName: zod_1.z.string().optional(),
    addressLine: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().min(2).max(2).default('US'),
    latitude: zod_1.z.number().min(-90).max(90).optional().nullable(),
    longitude: zod_1.z.number().min(-180).max(180).optional().nullable(),
    regionRadiusMiles: zod_1.z.number().int().min(5).max(500).default(50),
    startDate: zod_1.z.string().min(1),
    endDate: zod_1.z.string().optional(),
    coverImage: zod_1.z.string().url().optional(),
    currency: zod_1.z.string().default('USD'),
});
exports.createPublicEventSchema = publicEventBaseSchema.refine((data) => !data.endDate || new Date(data.endDate) >= new Date(data.startDate), { message: 'End date must be on or after start date', path: ['endDate'] });
exports.updatePublicEventSchema = publicEventBaseSchema
    .partial()
    .extend({
    status: zod_1.z.enum(['DRAFT', 'PENDING_PAYMENT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED']).optional(),
})
    .refine((data) => !data.endDate || !data.startDate || new Date(data.endDate) >= new Date(data.startDate), { message: 'End date must be on or after start date', path: ['endDate'] });
exports.createPublicEventPromotionSchema = zod_1.z.object({
    amount: zod_1.z.number().positive().default(49),
    currency: zod_1.z.string().default('USD'),
    durationDays: zod_1.z.number().int().min(1).max(90).default(30),
    regionCity: zod_1.z.string().optional(),
    regionState: zod_1.z.string().optional(),
    regionCountry: zod_1.z.string().min(2).max(2).default('US'),
    regionRadiusMiles: zod_1.z.number().int().min(5).max(500).default(50),
});
exports.browsePublicEventsSchema = zod_1.z.object({
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(25).optional().default(8),
});
// Activity schemas
exports.createActivitySchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    startTime: zod_1.z.string().datetime().optional(),
    endTime: zod_1.z.string().datetime().optional(),
    cost: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().default('USD'),
    category: zod_1.z.string(),
    costType: zod_1.z.enum(['PER_PERSON', 'FIXED']).optional(),
})
    .refine((data) => !data.endTime || !data.startTime || new Date(data.endTime) >= new Date(data.startTime), { message: 'End time must be on or after start time', path: ['endTime'] })
    .refine((data) => data.category !== 'accommodation' || (data.endTime != null && data.endTime !== ''), { message: 'End time is required for accommodation activities', path: ['endTime'] });
exports.updateActivitySchema = zod_1.z
    .object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    startTime: zod_1.z.string().datetime().optional(),
    endTime: zod_1.z.string().datetime().optional(),
    category: zod_1.z.string().optional(),
})
    .refine((data) => !data.endTime || !data.startTime || new Date(data.endTime) >= new Date(data.startTime), { message: 'End time must be on or after start time', path: ['endTime'] })
    .refine((data) => data.category !== 'accommodation' || (data.endTime != null && data.endTime !== ''), { message: 'End time is required for accommodation activities', path: ['endTime'] });
// Vote schemas
exports.createVoteSchema = zod_1.z.object({
    option: zod_1.z.enum(['YES', 'NO', 'MAYBE']),
});
// Invite schemas
exports.createInviteSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().datetime(),
    channels: zod_1.z.array(zod_1.z.string()).optional(),
});
// Message schemas
exports.createMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1),
    messageType: zod_1.z.enum(['TEXT', 'IMAGE', 'VIDEO', 'SYSTEM']).optional(),
    mentions: zod_1.z.array(zod_1.z.string()).optional(),
    replyToId: zod_1.z.string().optional(),
});
exports.updateMessageSchema = zod_1.z.object({
    content: zod_1.z.string().min(1).optional(),
    mentions: zod_1.z.array(zod_1.z.string()).optional(),
    reactions: zod_1.z.record(zod_1.z.array(zod_1.z.string())).optional(),
});
// BillSplit schemas
exports.createBillSplitSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().default('USD'),
    splitType: zod_1.z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']).default('EQUAL'),
    costType: zod_1.z.enum(['PER_PERSON', 'FIXED']).optional(),
    paidBy: zod_1.z.string(),
    activityId: zod_1.z.string().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    members: zod_1.z.array(zod_1.z.object({
        userId: zod_1.z.string(),
        dollarAmount: zod_1.z.number().positive().optional(),
        shares: zod_1.z.number().positive().optional(),
        percentage: zod_1.z.number().min(0).max(100).optional(),
    })).optional(),
});
exports.updateBillSplitSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive().optional(),
    currency: zod_1.z.string().optional(),
    splitType: zod_1.z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']).optional(),
    costType: zod_1.z.enum(['PER_PERSON', 'FIXED']).optional(),
    status: zod_1.z.enum(['PENDING', 'PARTIAL', 'PAID', 'CONFIRMED', 'CANCELLED']).optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    paidBy: zod_1.z.string().optional(),
    members: zod_1.z.array(zod_1.z.object({
        userId: zod_1.z.string(),
        dollarAmount: zod_1.z.number().positive().optional(),
        shares: zod_1.z.number().positive().optional(),
        percentage: zod_1.z.number().min(0).max(100).optional(),
    })).optional(),
});
exports.createBillSplitMemberSchema = zod_1.z.object({
    userId: zod_1.z.string(),
    dollarAmount: zod_1.z.number().positive(),
    type: zod_1.z.enum(['EQUAL', 'SHARES', 'PERCENTAGE', 'MANUAL']),
});
// Friend schemas
exports.createFriendRequestSchema = zod_1.z.object({
    receiverId: zod_1.z.string(),
});
// Notification schemas
exports.updateNotificationSchema = zod_1.z.object({
    read: zod_1.z.boolean().optional(),
});
// Media schemas
exports.createMediaItemSchema = zod_1.z.object({
    type: zod_1.z.enum(['image', 'video']),
    url: zod_1.z.string().url(),
    thumbnailUrl: zod_1.z.string().url().optional(),
    activityId: zod_1.z.string().optional(),
    caption: zod_1.z.string().optional(),
});
// Settings schemas
exports.updateSettingsSchema = zod_1.z.object({
    friendRequestSource: zod_1.z.enum(['ANYONE', 'TRIP_MEMBERS']).optional(),
    emailTripInvites: zod_1.z.boolean().optional(),
    emailPaymentRequests: zod_1.z.boolean().optional(),
    emailVotingReminders: zod_1.z.boolean().optional(),
    emailTripReminders: zod_1.z.boolean().optional(),
    emailMessages: zod_1.z.boolean().optional(),
    pushTripInvites: zod_1.z.boolean().optional(),
    pushPaymentRequests: zod_1.z.boolean().optional(),
    pushVotingReminders: zod_1.z.boolean().optional(),
    pushTripReminders: zod_1.z.boolean().optional(),
    pushMessages: zod_1.z.boolean().optional(),
    inAppAll: zod_1.z.boolean().optional(),
});
// Pagination schema
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.string().transform(Number).default('1'),
    limit: zod_1.z.string().transform(Number).default('20'),
});
//# sourceMappingURL=validations.js.map