import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    password: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    venmo: z.ZodOptional<z.ZodString>;
    paypal: z.ZodOptional<z.ZodString>;
    zelle: z.ZodOptional<z.ZodString>;
    cashapp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name: string;
    avatarUrl?: string | undefined;
    phone?: string | undefined;
    venmo?: string | undefined;
    paypal?: string | undefined;
    zelle?: string | undefined;
    cashapp?: string | undefined;
    password?: string | undefined;
}, {
    email: string;
    name: string;
    avatarUrl?: string | undefined;
    phone?: string | undefined;
    venmo?: string | undefined;
    paypal?: string | undefined;
    zelle?: string | undefined;
    cashapp?: string | undefined;
    password?: string | undefined;
}>;
export declare const updateUserSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatarUrl: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    city: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    state: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    country: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    latitude: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationSource: z.ZodNullable<z.ZodOptional<z.ZodEnum<["PROFILE", "BROWSER", "IP_INFERRED"]>>>;
    venmo: z.ZodOptional<z.ZodString>;
    paypal: z.ZodOptional<z.ZodString>;
    zelle: z.ZodOptional<z.ZodString>;
    cashapp: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    avatarUrl?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    locationSource?: "PROFILE" | "BROWSER" | "IP_INFERRED" | null | undefined;
    venmo?: string | undefined;
    paypal?: string | undefined;
    zelle?: string | undefined;
    cashapp?: string | undefined;
}, {
    name?: string | undefined;
    avatarUrl?: string | undefined;
    phone?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    locationSource?: "PROFILE" | "BROWSER" | "IP_INFERRED" | null | undefined;
    venmo?: string | undefined;
    paypal?: string | undefined;
    zelle?: string | undefined;
    cashapp?: string | undefined;
}>;
export declare const createTripSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    destination: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    destination?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    destination?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
}>;
export declare const updateTripSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    destination: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["IDEA", "PLANNING", "CONFIRMED", "HAPPENING", "COMPLETED", "CANCELLED"]>>;
    style: z.ZodOptional<z.ZodEnum<["OPEN", "MANAGED"]>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    name?: string | undefined;
    status?: "IDEA" | "PLANNING" | "CONFIRMED" | "HAPPENING" | "COMPLETED" | "CANCELLED" | undefined;
    destination?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    style?: "OPEN" | "MANAGED" | undefined;
}, {
    description?: string | undefined;
    name?: string | undefined;
    status?: "IDEA" | "PLANNING" | "CONFIRMED" | "HAPPENING" | "COMPLETED" | "CANCELLED" | undefined;
    destination?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    style?: "OPEN" | "MANAGED" | undefined;
}>;
export declare const createPublicEventSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    venueName: z.ZodOptional<z.ZodString>;
    addressLine: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodDefault<z.ZodString>;
    latitude: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    longitude: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    regionRadiusMiles: z.ZodDefault<z.ZodNumber>;
    startDate: z.ZodString;
    endDate: z.ZodOptional<z.ZodString>;
    coverImage: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    city: string;
    country: string;
    startDate: string;
    title: string;
    regionRadiusMiles: number;
    currency: string;
    description?: string | undefined;
    state?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
}, {
    city: string;
    startDate: string;
    title: string;
    description?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
}>, {
    city: string;
    country: string;
    startDate: string;
    title: string;
    regionRadiusMiles: number;
    currency: string;
    description?: string | undefined;
    state?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
}, {
    city: string;
    startDate: string;
    title: string;
    description?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
}>;
export declare const updatePublicEventSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    venueName: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    addressLine: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    country: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    latitude: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    longitude: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodNumber>>>;
    regionRadiusMiles: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    coverImage: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING_PAYMENT", "PUBLISHED", "ARCHIVED", "CANCELLED"]>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    status?: "CANCELLED" | "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "ARCHIVED" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    title?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
}, {
    description?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    status?: "CANCELLED" | "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "ARCHIVED" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    title?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
}>, {
    description?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    status?: "CANCELLED" | "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "ARCHIVED" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    title?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
}, {
    description?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
    status?: "CANCELLED" | "DRAFT" | "PENDING_PAYMENT" | "PUBLISHED" | "ARCHIVED" | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    coverImage?: string | undefined;
    title?: string | undefined;
    venueName?: string | undefined;
    addressLine?: string | undefined;
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
}>;
export declare const createPublicEventPromotionSchema: z.ZodObject<{
    amount: z.ZodDefault<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    durationDays: z.ZodDefault<z.ZodNumber>;
    regionCity: z.ZodOptional<z.ZodString>;
    regionState: z.ZodOptional<z.ZodString>;
    regionCountry: z.ZodDefault<z.ZodString>;
    regionRadiusMiles: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    regionRadiusMiles: number;
    currency: string;
    amount: number;
    durationDays: number;
    regionCountry: string;
    regionCity?: string | undefined;
    regionState?: string | undefined;
}, {
    regionRadiusMiles?: number | undefined;
    currency?: string | undefined;
    amount?: number | undefined;
    durationDays?: number | undefined;
    regionCity?: string | undefined;
    regionState?: string | undefined;
    regionCountry?: string | undefined;
}>;
export declare const browsePublicEventsSchema: z.ZodObject<{
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
}, {
    city?: string | undefined;
    state?: string | undefined;
    country?: string | undefined;
    limit?: number | undefined;
}>;
export declare const createActivitySchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    cost: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    category: z.ZodString;
    costType: z.ZodOptional<z.ZodEnum<["PER_PERSON", "FIXED"]>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    currency: string;
    category: string;
    description?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    cost?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
}, {
    title: string;
    category: string;
    description?: string | undefined;
    currency?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    cost?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
}>, {
    title: string;
    currency: string;
    category: string;
    description?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    cost?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
}, {
    title: string;
    category: string;
    description?: string | undefined;
    currency?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    cost?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
}>, {
    title: string;
    currency: string;
    category: string;
    description?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    cost?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
}, {
    title: string;
    category: string;
    description?: string | undefined;
    currency?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    cost?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
}>;
export declare const updateActivitySchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    location: z.ZodOptional<z.ZodString>;
    startTime: z.ZodOptional<z.ZodString>;
    endTime: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    category?: string | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    category?: string | undefined;
}>, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    category?: string | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    category?: string | undefined;
}>, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    category?: string | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    location?: string | undefined;
    startTime?: string | undefined;
    endTime?: string | undefined;
    category?: string | undefined;
}>;
export declare const createVoteSchema: z.ZodObject<{
    option: z.ZodEnum<["YES", "NO", "MAYBE"]>;
}, "strip", z.ZodTypeAny, {
    option: "YES" | "NO" | "MAYBE";
}, {
    option: "YES" | "NO" | "MAYBE";
}>;
export declare const createInviteSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodString;
    channels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    expiresAt: string;
    email?: string | undefined;
    phone?: string | undefined;
    channels?: string[] | undefined;
}, {
    expiresAt: string;
    email?: string | undefined;
    phone?: string | undefined;
    channels?: string[] | undefined;
}>;
export declare const createMessageSchema: z.ZodObject<{
    content: z.ZodString;
    messageType: z.ZodOptional<z.ZodEnum<["TEXT", "IMAGE", "VIDEO", "SYSTEM"]>>;
    mentions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    replyToId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    content: string;
    messageType?: "TEXT" | "IMAGE" | "VIDEO" | "SYSTEM" | undefined;
    mentions?: string[] | undefined;
    replyToId?: string | undefined;
}, {
    content: string;
    messageType?: "TEXT" | "IMAGE" | "VIDEO" | "SYSTEM" | undefined;
    mentions?: string[] | undefined;
    replyToId?: string | undefined;
}>;
export declare const updateMessageSchema: z.ZodObject<{
    content: z.ZodOptional<z.ZodString>;
    mentions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    reactions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    content?: string | undefined;
    mentions?: string[] | undefined;
    reactions?: Record<string, string[]> | undefined;
}, {
    content?: string | undefined;
    mentions?: string[] | undefined;
    reactions?: Record<string, string[]> | undefined;
}>;
export declare const createBillSplitSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodDefault<z.ZodString>;
    splitType: z.ZodDefault<z.ZodEnum<["EQUAL", "SHARES", "PERCENTAGE", "MANUAL"]>>;
    costType: z.ZodOptional<z.ZodEnum<["PER_PERSON", "FIXED"]>>;
    paidBy: z.ZodString;
    activityId: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    members: z.ZodOptional<z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        dollarAmount: z.ZodOptional<z.ZodNumber>;
        shares: z.ZodOptional<z.ZodNumber>;
        percentage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }, {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    currency: string;
    splitType: "EQUAL" | "SHARES" | "PERCENTAGE" | "MANUAL";
    paidBy: string;
    description?: string | undefined;
    amount?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
    activityId?: string | undefined;
    dueDate?: string | undefined;
    members?: {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }[] | undefined;
}, {
    title: string;
    paidBy: string;
    description?: string | undefined;
    currency?: string | undefined;
    amount?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
    splitType?: "EQUAL" | "SHARES" | "PERCENTAGE" | "MANUAL" | undefined;
    activityId?: string | undefined;
    dueDate?: string | undefined;
    members?: {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }[] | undefined;
}>;
export declare const updateBillSplitSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    amount: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    splitType: z.ZodOptional<z.ZodEnum<["EQUAL", "SHARES", "PERCENTAGE", "MANUAL"]>>;
    costType: z.ZodOptional<z.ZodEnum<["PER_PERSON", "FIXED"]>>;
    status: z.ZodOptional<z.ZodEnum<["PENDING", "PARTIAL", "PAID", "CONFIRMED", "CANCELLED"]>>;
    dueDate: z.ZodOptional<z.ZodString>;
    paidBy: z.ZodOptional<z.ZodString>;
    members: z.ZodOptional<z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        dollarAmount: z.ZodOptional<z.ZodNumber>;
        shares: z.ZodOptional<z.ZodNumber>;
        percentage: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }, {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    status?: "CONFIRMED" | "CANCELLED" | "PENDING" | "PARTIAL" | "PAID" | undefined;
    title?: string | undefined;
    currency?: string | undefined;
    amount?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
    splitType?: "EQUAL" | "SHARES" | "PERCENTAGE" | "MANUAL" | undefined;
    paidBy?: string | undefined;
    dueDate?: string | undefined;
    members?: {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }[] | undefined;
}, {
    description?: string | undefined;
    status?: "CONFIRMED" | "CANCELLED" | "PENDING" | "PARTIAL" | "PAID" | undefined;
    title?: string | undefined;
    currency?: string | undefined;
    amount?: number | undefined;
    costType?: "PER_PERSON" | "FIXED" | undefined;
    splitType?: "EQUAL" | "SHARES" | "PERCENTAGE" | "MANUAL" | undefined;
    paidBy?: string | undefined;
    dueDate?: string | undefined;
    members?: {
        userId: string;
        dollarAmount?: number | undefined;
        shares?: number | undefined;
        percentage?: number | undefined;
    }[] | undefined;
}>;
export declare const createBillSplitMemberSchema: z.ZodObject<{
    userId: z.ZodString;
    dollarAmount: z.ZodNumber;
    type: z.ZodEnum<["EQUAL", "SHARES", "PERCENTAGE", "MANUAL"]>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    type: "EQUAL" | "SHARES" | "PERCENTAGE" | "MANUAL";
    dollarAmount: number;
}, {
    userId: string;
    type: "EQUAL" | "SHARES" | "PERCENTAGE" | "MANUAL";
    dollarAmount: number;
}>;
export declare const createFriendRequestSchema: z.ZodObject<{
    receiverId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    receiverId: string;
}, {
    receiverId: string;
}>;
export declare const updateNotificationSchema: z.ZodObject<{
    read: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    read?: boolean | undefined;
}, {
    read?: boolean | undefined;
}>;
export declare const createMediaItemSchema: z.ZodObject<{
    type: z.ZodEnum<["image", "video"]>;
    url: z.ZodString;
    thumbnailUrl: z.ZodOptional<z.ZodString>;
    activityId: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    url: string;
    type: "image" | "video";
    activityId?: string | undefined;
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
}, {
    url: string;
    type: "image" | "video";
    activityId?: string | undefined;
    thumbnailUrl?: string | undefined;
    caption?: string | undefined;
}>;
export declare const updateSettingsSchema: z.ZodObject<{
    friendRequestSource: z.ZodOptional<z.ZodEnum<["ANYONE", "TRIP_MEMBERS"]>>;
    emailTripInvites: z.ZodOptional<z.ZodBoolean>;
    emailPaymentRequests: z.ZodOptional<z.ZodBoolean>;
    emailVotingReminders: z.ZodOptional<z.ZodBoolean>;
    emailTripReminders: z.ZodOptional<z.ZodBoolean>;
    emailMessages: z.ZodOptional<z.ZodBoolean>;
    pushTripInvites: z.ZodOptional<z.ZodBoolean>;
    pushPaymentRequests: z.ZodOptional<z.ZodBoolean>;
    pushVotingReminders: z.ZodOptional<z.ZodBoolean>;
    pushTripReminders: z.ZodOptional<z.ZodBoolean>;
    pushMessages: z.ZodOptional<z.ZodBoolean>;
    inAppAll: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    friendRequestSource?: "ANYONE" | "TRIP_MEMBERS" | undefined;
    emailTripInvites?: boolean | undefined;
    emailPaymentRequests?: boolean | undefined;
    emailVotingReminders?: boolean | undefined;
    emailTripReminders?: boolean | undefined;
    emailMessages?: boolean | undefined;
    pushTripInvites?: boolean | undefined;
    pushPaymentRequests?: boolean | undefined;
    pushVotingReminders?: boolean | undefined;
    pushTripReminders?: boolean | undefined;
    pushMessages?: boolean | undefined;
    inAppAll?: boolean | undefined;
}, {
    friendRequestSource?: "ANYONE" | "TRIP_MEMBERS" | undefined;
    emailTripInvites?: boolean | undefined;
    emailPaymentRequests?: boolean | undefined;
    emailVotingReminders?: boolean | undefined;
    emailTripReminders?: boolean | undefined;
    emailMessages?: boolean | undefined;
    pushTripInvites?: boolean | undefined;
    pushPaymentRequests?: boolean | undefined;
    pushVotingReminders?: boolean | undefined;
    pushTripReminders?: boolean | undefined;
    pushMessages?: boolean | undefined;
    inAppAll?: boolean | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    limit: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: string | undefined;
    page?: string | undefined;
}>;
//# sourceMappingURL=validations.d.ts.map