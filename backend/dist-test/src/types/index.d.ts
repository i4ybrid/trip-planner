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
    style?: 'OPEN' | 'MANAGED';
}
export interface PublicEventCreateInput {
    title: string;
    description?: string;
    venueName?: string;
    addressLine?: string;
    city: string;
    state?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    regionRadiusMiles?: number;
    startDate: Date;
    endDate?: Date;
    coverImage?: string;
    currency?: string;
}
export interface PublicEventUpdateInput extends Partial<PublicEventCreateInput> {
    status?: 'DRAFT' | 'PENDING_PAYMENT' | 'PUBLISHED' | 'ARCHIVED' | 'CANCELLED';
}
export interface PublicEventPromotionInput {
    amount: number;
    currency?: string;
    durationDays?: number;
    regionCity?: string;
    regionState?: string;
    regionCountry?: string;
    regionRadiusMiles?: number;
}
export interface PublicEventBrowseInput {
    city?: string;
    state?: string;
    country?: string;
    limit?: number;
}
export interface PublicEventLocationSuggestion {
    city: string;
    state?: string | null;
    country: string;
    latitude?: number | null;
    longitude?: number | null;
}
export interface EventLocationInput {
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
}
export interface MemberRoleUpdateInput {
    role?: 'OWNER' | 'EDITOR' | 'VIEWER';
    status?: 'INVITED' | 'DECLINED' | 'MAYBE' | 'CONFIRMED' | 'REMOVED' | 'PENDING_JOIN';
}
export interface MemberInviteInput {
    userId: string;
}
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
    costType?: 'PER_PERSON' | 'FIXED';
    proposedBy: string;
}
export interface ActivityUpdateInput {
    title?: string;
    description?: string;
    location?: string;
    startTime?: Date;
    endTime?: Date;
    category?: string;
}
export interface VoteCreateInput {
    activityId: string;
    userId: string;
    option: 'YES' | 'NO' | 'MAYBE';
}
export interface InviteCreateInput {
    tripId: string;
    email?: string;
    phone?: string;
    expiresAt: Date;
    sentById: string;
    channels?: string[];
}
export interface MessageCreateInput {
    tripId?: string;
    conversationId?: string;
    senderId: string;
    content: string;
    messageType?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
    mentions?: string[];
    replyToId?: string;
}
export type CostType = 'PER_PERSON' | 'FIXED';
export interface BillSplitCreateInput {
    tripId: string;
    title: string;
    description?: string;
    amount: number;
    currency?: string;
    splitType: 'EQUAL' | 'SHARES' | 'PERCENTAGE' | 'MANUAL';
    costType?: CostType;
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
export interface FriendRequestCreateInput {
    senderId: string;
    receiverId: string;
}
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
export interface MediaItemCreateInput {
    tripId: string;
    uploaderId: string;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    activityId?: string;
    caption?: string;
}
export interface TimelineEventCreateInput {
    tripId: string;
    eventType: string;
    description: string;
    createdBy?: string;
}
//# sourceMappingURL=index.d.ts.map