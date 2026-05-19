export declare class InviteService {
    private prisma;
    createInvite(data: {
        tripId: string;
        email?: string;
        phone?: string;
        expiresAt: Date;
        sentById: string;
        channels?: string[];
    }): Promise<{
        inviteUrl: string;
        trip: {
            id: string;
            name: string;
        };
        sentBy: {
            id: string;
            name: string;
        };
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    }>;
    sendInviteNotification(invite: any): Promise<void>;
    getInviteByToken(token: string): Promise<({
        trip: {
            description: string | null;
            id: string;
            name: string;
            coverImage: string | null;
        };
        sentBy: {
            id: string;
            name: string;
        };
    } & {
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    }) | null>;
    acceptInvite(token: string, userId: string): Promise<{
        memberStatus: string;
        description: string | null;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.TripStatus;
        destination: string | null;
        startDate: Date | null;
        endDate: Date | null;
        coverImage: string | null;
        style: import("@prisma/client").$Enums.TripStyle;
        tripMasterId: string;
        budget: import("@prisma/client/runtime/library").Decimal | null;
        heroImageId: string | null;
        autoMilestonesGenerated: boolean;
    }>;
    declineInvite(token: string): Promise<{
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    }>;
    revokeInvite(inviteId: string): Promise<{
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    }>;
    getTripInvites(tripId: string): Promise<({
        channels: {
            id: string;
            inviteId: string;
            channel: string;
            externalId: string | null;
        }[];
        sentBy: {
            id: string;
            name: string;
        };
    } & {
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    })[]>;
    expireInvites(tripId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    getPendingInvitesByEmail(email: string): Promise<({
        trip: {
            description: string | null;
            id: string;
            name: string;
            coverImage: string | null;
            style: import("@prisma/client").$Enums.TripStyle;
        };
        sentBy: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    })[]>;
    getPendingInvitesByUserId(userId: string): Promise<({
        trip: {
            description: string | null;
            id: string;
            name: string;
            coverImage: string | null;
            style: import("@prisma/client").$Enums.TripStyle;
        };
        sentBy: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        token: string | null;
        id: string;
        email: string | null;
        phone: string | null;
        createdAt: Date;
        expiresAt: Date;
        code: string | null;
        status: import("@prisma/client").$Enums.InviteStatus;
        tripId: string;
        sentById: string;
    })[]>;
}
export declare const inviteService: InviteService;
//# sourceMappingURL=invite.service.d.ts.map