import { ActivityCreateInput, ActivityUpdateInput } from '@/types';
export declare class ActivityService {
    private prisma;
    createActivity(data: ActivityCreateInput): Promise<{
        proposer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    }>;
    getActivityById(activityId: string): Promise<({
        votes: ({
            user: {
                id: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            option: import("@prisma/client").$Enums.VoteOption;
            activityId: string;
        })[];
        mediaItems: {
            url: string;
            id: string;
            createdAt: Date;
            type: string;
            activityId: string | null;
            thumbnailUrl: string | null;
            caption: string | null;
            tripId: string;
            uploaderId: string;
        }[];
        proposer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    }) | null>;
    getTripActivities(tripId: string): Promise<({
        votes: ({
            user: {
                id: string;
                name: string;
            };
        } & {
            id: string;
            userId: string;
            option: import("@prisma/client").$Enums.VoteOption;
            activityId: string;
        })[];
        _count: {
            votes: number;
            mediaItems: number;
        };
        proposer: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    })[]>;
    updateActivity(activityId: string, data: ActivityUpdateInput): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    }>;
    deleteActivity(activityId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    }>;
    confirmActivity(activityId: string, userId: string, tripId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    }>;
    rejectActivity(activityId: string, userId: string): Promise<{
        description: string | null;
        id: string;
        createdAt: Date;
        status: import("@prisma/client").$Enums.ActivityStatus;
        title: string;
        currency: string;
        location: string | null;
        startTime: Date | null;
        endTime: Date | null;
        cost: import("@prisma/client/runtime/library").Decimal | null;
        category: string;
        costType: import("@prisma/client").$Enums.CostType;
        tripId: string;
        proposedBy: string;
        confirmedAt: Date | null;
        rejectedAt: Date | null;
        confirmedBy: string | null;
        rejectedBy: string | null;
    }>;
    getVoteCounts(activityId: string): Promise<{
        yes: number;
        no: number;
        maybe: number;
        total: number;
    }>;
}
export declare const activityService: ActivityService;
//# sourceMappingURL=activity.service.d.ts.map