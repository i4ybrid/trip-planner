export declare class MediaService {
    createMediaItem(data: {
        tripId: string;
        uploaderId: string;
        type: 'image' | 'video';
        url: string;
        thumbnailUrl?: string;
        activityId?: string;
        caption?: string;
    }): Promise<{
        activity: {
            id: string;
            title: string;
        } | null;
        uploader: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        url: string;
        id: string;
        createdAt: Date;
        type: string;
        activityId: string | null;
        thumbnailUrl: string | null;
        caption: string | null;
        tripId: string;
        uploaderId: string;
    }>;
    getTripMedia(tripId: string, limit?: number): Promise<({
        activity: {
            id: string;
            title: string;
        } | null;
        uploader: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        url: string;
        id: string;
        createdAt: Date;
        type: string;
        activityId: string | null;
        thumbnailUrl: string | null;
        caption: string | null;
        tripId: string;
        uploaderId: string;
    })[]>;
    getMediaItem(id: string): Promise<({
        activity: {
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
        } | null;
        uploader: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        url: string;
        id: string;
        createdAt: Date;
        type: string;
        activityId: string | null;
        thumbnailUrl: string | null;
        caption: string | null;
        tripId: string;
        uploaderId: string;
    }) | null>;
    deleteMediaItem(id: string): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        type: string;
        activityId: string | null;
        thumbnailUrl: string | null;
        caption: string | null;
        tripId: string;
        uploaderId: string;
    }>;
    updateMediaItem(id: string, data: {
        caption?: string;
    }): Promise<{
        url: string;
        id: string;
        createdAt: Date;
        type: string;
        activityId: string | null;
        thumbnailUrl: string | null;
        caption: string | null;
        tripId: string;
        uploaderId: string;
    }>;
}
export declare const mediaService: MediaService;
//# sourceMappingURL=media.service.d.ts.map