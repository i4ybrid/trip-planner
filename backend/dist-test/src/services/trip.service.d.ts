import { TripCreateInput, TripUpdateInput } from '@/types';
import { TripStatus } from '@prisma/client';
import { MemberRole } from '@prisma/client';
export declare class TripService {
    private prisma;
    createTrip(userId: string, data: TripCreateInput): Promise<{
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
    getTripById(tripId: string): Promise<({
        activities: {
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
        }[];
        _count: {
            activities: number;
            messages: number;
            mediaItems: number;
            members: number;
        };
        members: ({
            user: {
                id: string;
                email: string;
                name: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            userId: string;
            status: import("@prisma/client").$Enums.MemberStatus;
            tripId: string;
            role: import("@prisma/client").$Enums.MemberRole;
            joinedAt: Date;
            invitedById: string | null;
        })[];
        tripMaster: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
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
    }) | null>;
    getUserTrips(userId: string): Promise<({
        _count: {
            activities: number;
            members: number;
        };
        members: {
            status: import("@prisma/client").$Enums.MemberStatus;
            role: import("@prisma/client").$Enums.MemberRole;
        }[];
        tripMaster: {
            id: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
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
    })[]>;
    updateTrip(tripId: string, data: TripUpdateInput): Promise<{
        tripMaster: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
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
    updateTripBudget(tripId: string, budget: number): Promise<{
        id: string;
        updatedAt: Date;
        budget: import("@prisma/client/runtime/library").Decimal | null;
    }>;
    deleteTrip(tripId: string): Promise<{
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
    changeTripStatus(tripId: string, newStatus: TripStatus): Promise<{
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
    getTripTimeline(tripId: string, limit?: number): Promise<{
        description: string | null;
        meta: string | null;
        id: string;
        createdAt: Date;
        title: string | null;
        activityId: string | null;
        tripId: string;
        kind: import("@prisma/client").$Enums.TimelineEventKind;
        eventType: string | null;
        actorId: string | null;
        targetId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        sourceType: string | null;
        sourceId: string | null;
        effectiveDate: Date;
        icon: string | null;
        createdBy: string | null;
    }[]>;
    getTripMembers(tripId: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
            venmo: string | null;
            paypal: string | null;
            zelle: string | null;
            cashapp: string | null;
        };
    } & {
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    })[]>;
    addTripMemberByInvite(tripId: string, userId: string, role?: string): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    }>;
    updateTripMember(tripId: string, userId: string, data: {
        role?: string;
        status?: string;
    }): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    }>;
    removeTripMember(tripId: string, userId: string): Promise<{
        user: {
            id: string;
            name: string;
        };
    } & {
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    }>;
    checkMemberPermission(tripId: string, userId: string, requiredRoles?: string[]): Promise<{
        hasPermission: boolean;
        role: null;
    } | {
        hasPermission: boolean;
        role: import("@prisma/client").$Enums.MemberRole;
    }>;
    canInvite(tripId: string, userId: string): Promise<{
        canInvite: boolean;
        reason?: string;
    }>;
    canManageMember(requesterId: string, targetId: string, tripId: string): Promise<{
        canManage: boolean;
        reason?: string;
    }>;
    canPromoteToOrganizer(requesterId: string, tripId: string): Promise<{
        canPromote: boolean;
        reason?: string;
    }>;
    addTripMember(tripId: string, userId: string, invitedById: string, role?: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    }>;
    /**
     * Request to join a trip (OPEN-style managed join requests)
     */
    requestJoin(tripId: string, userId: string): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    }>;
    /**
     * Approve a join request → sets member status to CONFIRMED
     */
    approveJoinRequest(tripId: string, userId: string): Promise<{
        id: string;
        userId: string;
        status: import("@prisma/client").$Enums.MemberStatus;
        tripId: string;
        role: import("@prisma/client").$Enums.MemberRole;
        joinedAt: Date;
        invitedById: string | null;
    }>;
    /**
     * Deny a join request → removes the PENDING_JOIN member
     */
    denyJoinRequest(tripId: string, userId: string): Promise<{
        success: boolean;
    }>;
    /**
     * Change a member's role
     */
    changeRole(tripId: string, userId: string, newRole: MemberRole): Promise<any>;
    /**
     * Withdraw a pending join request
     */
    withdrawJoinRequest(tripId: string, userId: string): Promise<void>;
}
export declare const tripService: TripService;
//# sourceMappingURL=trip.service.d.ts.map