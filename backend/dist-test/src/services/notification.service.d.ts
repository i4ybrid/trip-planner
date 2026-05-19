import { NotificationCategory, NotificationReferenceType } from '@prisma/client';
export interface CreateNotificationData {
    userId: string;
    category: NotificationCategory;
    title: string;
    body: string;
    referenceId?: string;
    referenceType?: NotificationReferenceType;
    link?: string;
}
export declare class NotificationService {
    private prisma;
    shouldNotify(userId: string, category: NotificationCategory): Promise<boolean>;
    createNotification(data: CreateNotificationData): Promise<{
        link: string | null;
        body: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        category: import("@prisma/client").$Enums.NotificationCategory;
        referenceId: string | null;
        referenceType: import("@prisma/client").$Enums.NotificationReferenceType | null;
        isRead: boolean;
    } | null>;
    createTripNotification(tripId: string, category: NotificationCategory, title: string, body: string, excludeUserId?: string, referenceId?: string, referenceType?: NotificationReferenceType): Promise<number>;
    createFriendNotification(userId: string, _friendId: string, category: NotificationCategory, referenceId?: string): Promise<{
        link: string | null;
        body: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        category: import("@prisma/client").$Enums.NotificationCategory;
        referenceId: string | null;
        referenceType: import("@prisma/client").$Enums.NotificationReferenceType | null;
        isRead: boolean;
    } | null>;
    createChatMentionNotification(userId: string, messageId: string, tripId?: string, referenceType?: NotificationReferenceType): Promise<{
        link: string | null;
        body: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        category: import("@prisma/client").$Enums.NotificationCategory;
        referenceId: string | null;
        referenceType: import("@prisma/client").$Enums.NotificationReferenceType | null;
        isRead: boolean;
    } | null>;
    createTripChatNotification(tripId: string, excludeUserId: string, messageId: string): Promise<void>;
    private flushTripChatBatch;
    getNotifications(userId: string, options?: {
        cursor?: string;
        limit?: number;
        category?: NotificationCategory;
    }): Promise<{
        notifications: {
            link: string | null;
            body: string;
            id: string;
            createdAt: Date;
            userId: string;
            title: string;
            category: import("@prisma/client").$Enums.NotificationCategory;
            referenceId: string | null;
            referenceType: import("@prisma/client").$Enums.NotificationReferenceType | null;
            isRead: boolean;
        }[];
        nextCursor: string | null;
        unreadCount: number;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    getNotification(id: string, userId: string): Promise<{
        link: string | null;
        body: string;
        id: string;
        createdAt: Date;
        userId: string;
        title: string;
        category: import("@prisma/client").$Enums.NotificationCategory;
        referenceId: string | null;
        referenceType: import("@prisma/client").$Enums.NotificationReferenceType | null;
        isRead: boolean;
    } | null>;
    markAsRead(id: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAllAsRead(userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    markAsReadByReference(referenceType: NotificationReferenceType, referenceId: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    deleteNotification(id: string, userId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    deleteOldNotifications(userId: string, beforeDate: Date): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getPreferences(userId: string): Promise<{
        push: boolean;
        id: string;
        email: boolean;
        userId: string;
        category: import("@prisma/client").$Enums.NotificationCategory;
        inApp: boolean;
    }[]>;
    upsertPreference(userId: string, category: NotificationCategory, data: {
        inApp?: boolean;
        email?: boolean;
        push?: boolean;
    }): Promise<{
        push: boolean;
        id: string;
        email: boolean;
        userId: string;
        category: import("@prisma/client").$Enums.NotificationCategory;
        inApp: boolean;
    }>;
}
export declare const notificationService: NotificationService;
//# sourceMappingURL=notification.service.d.ts.map