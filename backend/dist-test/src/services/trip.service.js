"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.tripService = exports.TripService = void 0;
const prisma_1 = require("@/lib/prisma");
const notification_service_1 = require("@/services/notification.service");
const client_1 = require("@prisma/client");
const timeline_service_1 = require("@/services/timeline.service");
// Valid status transitions
const VALID_TRANSITIONS = {
    IDEA: ['PLANNING', 'CANCELLED'],
    PLANNING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['HAPPENING', 'CANCELLED'],
    HAPPENING: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
};
class TripService {
    prisma = (0, prisma_1.getPrisma)();
    async createTrip(userId, data) {
        const createdTrip = await this.prisma.trip.create({
            data: {
                ...data,
                tripMasterId: userId,
                members: {
                    create: {
                        userId,
                        role: 'OWNER',
                        status: 'CONFIRMED',
                    },
                },
            },
            include: {
                tripMaster: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
        // Generate idea-phase milestones at trip creation if startDate exists
        if (createdTrip.startDate) {
            const { milestoneService } = await Promise.resolve().then(() => __importStar(require('./milestone.service')));
            await milestoneService.generateIdeaMilestones(createdTrip.id, createdTrip.startDate);
        }
        return createdTrip;
    }
    async getTripById(tripId) {
        return this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                tripMaster: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
                activities: {
                    orderBy: { createdAt: 'desc' },
                },
                _count: {
                    select: {
                        activities: true,
                        members: true,
                        messages: true,
                        mediaItems: true,
                    },
                },
            },
        });
    }
    async getUserTrips(userId) {
        return this.prisma.trip.findMany({
            where: {
                members: {
                    some: {
                        userId,
                        status: {
                            not: 'DECLINED',
                        },
                    },
                },
            },
            include: {
                tripMaster: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true,
                    },
                },
                members: {
                    where: { userId },
                    select: {
                        role: true,
                        status: true,
                    },
                },
                _count: {
                    select: {
                        activities: true,
                        members: true,
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async updateTrip(tripId, data) {
        // Get current trip to check if startDate is changing
        const currentTrip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: {
                startDate: true,
                autoMilestonesGenerated: true,
            },
        });
        const result = await this.prisma.trip.update({
            where: { id: tripId },
            data,
            include: {
                tripMaster: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });
        // If startDate changed and milestones were auto-generated, recalculate
        if (data.startDate &&
            currentTrip?.autoMilestonesGenerated &&
            currentTrip?.startDate &&
            new Date(data.startDate).getTime() !== new Date(currentTrip.startDate).getTime()) {
            const { milestoneService } = await Promise.resolve().then(() => __importStar(require('./milestone.service')));
            await milestoneService.recalculateMilestones(tripId, new Date(data.startDate));
        }
        return result;
    }
    async updateTripBudget(tripId, budget) {
        return this.prisma.trip.update({
            where: { id: tripId },
            data: { budget },
            select: {
                id: true,
                budget: true,
                updatedAt: true,
            },
        });
    }
    async deleteTrip(tripId) {
        return this.prisma.trip.delete({
            where: { id: tripId },
        });
    }
    async changeTripStatus(tripId, newStatus) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: {
                status: true,
                startDate: true,
                endDate: true,
                createdAt: true,
            },
        });
        if (!trip) {
            throw new Error('Trip not found');
        }
        const validTransitions = VALID_TRANSITIONS[trip.status];
        if (!validTransitions.includes(newStatus)) {
            throw new Error(`Invalid status transition from ${trip.status} to ${newStatus}`);
        }
        // Create timeline event for status change
        await this.prisma.timelineEvent.create({
            data: {
                tripId,
                eventType: 'status_changed',
                description: `Trip status changed from ${trip.status} to ${newStatus}`,
            },
        });
        const { milestoneService } = await Promise.resolve().then(() => __importStar(require('./milestone.service')));
        // Generate milestones based on new status
        if ((newStatus === 'PLANNING' || newStatus === 'CONFIRMED') && trip.startDate) {
            await milestoneService.generateFinalPaymentMilestone(tripId, trip.startDate);
        }
        if (newStatus === 'HAPPENING' && trip.endDate) {
            await milestoneService.generateSettlementMilestones(tripId, trip.endDate);
        }
        return this.prisma.trip.update({
            where: { id: tripId },
            data: { status: newStatus },
        });
    }
    async getTripTimeline(tripId, limit = 50) {
        return this.prisma.timelineEvent.findMany({
            where: { tripId },
            orderBy: { effectiveDate: 'asc' },
            take: limit,
        });
    }
    async getTripMembers(tripId) {
        return this.prisma.tripMember.findMany({
            where: { tripId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        venmo: true,
                        paypal: true,
                        zelle: true,
                        cashapp: true,
                    },
                },
            },
        });
    }
    async addTripMemberByInvite(tripId, userId, role = 'EDITOR') {
        return this.prisma.tripMember.create({
            data: {
                tripId,
                userId,
                role: role,
                status: 'CONFIRMED',
            },
        });
    }
    async updateTripMember(tripId, userId, data) {
        const oldMember = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId, userId } },
            include: { user: { select: { name: true } } },
        });
        const updated = await this.prisma.tripMember.update({
            where: {
                tripId_userId: {
                    tripId,
                    userId,
                },
            },
            data: {
                role: data.role,
                status: data.status,
            },
        });
        // Emit timeline event and notify member if their role changed
        if (data.role && oldMember && data.role !== oldMember.role) {
            const trip = await this.prisma.trip.findUnique({
                where: { id: tripId },
                select: { name: true },
            });
            try {
                await timeline_service_1.timelineService.emitTimelineEvent({
                    tripId,
                    eventType: 'role_changed',
                    actorId: userId,
                    metadata: { memberId: userId, oldRole: oldMember.role, newRole: data.role },
                    description: `${oldMember.user.name}'s role changed from ${oldMember.role} to ${data.role}`,
                });
                await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
            }
            catch (e) {
                console.error('Timeline event failed:', e);
            }
            await notification_service_1.notificationService.createNotification({
                userId,
                category: client_1.NotificationCategory.MEMBER,
                title: 'Role Changed',
                body: `Your role in "${trip?.name}" changed to ${data.role}`,
                referenceId: tripId,
                referenceType: client_1.NotificationReferenceType.TRIP,
                link: `/trip/${tripId}`,
            });
        }
        return updated;
    }
    async removeTripMember(tripId, userId) {
        const member = await this.prisma.tripMember.update({
            where: {
                tripId_userId: {
                    tripId,
                    userId,
                },
            },
            data: {
                status: 'REMOVED',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        try {
            await this.prisma.timelineEvent.create({
                data: {
                    tripId,
                    eventType: 'member_removed',
                    description: `${member.user.name} was removed from the trip`,
                },
            });
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        // Notify the removed user
        try {
            await notification_service_1.notificationService.createNotification({
                userId: member.userId,
                category: client_1.NotificationCategory.MEMBER,
                title: 'Removed from Trip',
                body: `You were removed from the trip`,
                referenceId: tripId,
                referenceType: client_1.NotificationReferenceType.TRIP,
                link: '/dashboard',
            });
        }
        catch (e) {
            console.error('Notification failed:', e);
        }
        return member;
    }
    async checkMemberPermission(tripId, userId, requiredRoles = []) {
        const member = await this.prisma.tripMember.findUnique({
            where: {
                tripId_userId: {
                    tripId,
                    userId,
                },
            },
        });
        if (!member) {
            return { hasPermission: false, role: null };
        }
        if (member.status !== 'CONFIRMED') {
            return { hasPermission: false, role: member.role };
        }
        if (requiredRoles.length > 0 && !requiredRoles.includes(member.role)) {
            return { hasPermission: false, role: member.role };
        }
        return { hasPermission: true, role: member.role };
    }
    async canInvite(tripId, userId) {
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { style: true },
        });
        if (!trip) {
            return { canInvite: false, reason: 'Trip not found' };
        }
        const member = await this.prisma.tripMember.findUnique({
            where: {
                tripId_userId: {
                    tripId,
                    userId,
                },
            },
        });
        if (!member || member.status !== 'CONFIRMED') {
            return { canInvite: false, reason: 'You are not a member of this trip' };
        }
        if (member.role === 'OWNER') {
            return { canInvite: true };
        }
        if (trip.style === 'OPEN' && (member.role === 'EDITOR')) {
            return { canInvite: true };
        }
        if (trip.style === 'MANAGED') {
            return { canInvite: false, reason: 'Only organizers can invite members to this trip' };
        }
        return { canInvite: false, reason: 'You do not have permission to invite members' };
    }
    async canManageMember(requesterId, targetId, tripId) {
        const requester = await this.prisma.tripMember.findUnique({
            where: {
                tripId_userId: {
                    tripId,
                    userId: requesterId,
                },
            },
        });
        const target = await this.prisma.tripMember.findUnique({
            where: {
                tripId_userId: {
                    tripId,
                    userId: targetId,
                },
            },
        });
        if (!requester || requester.status !== 'CONFIRMED') {
            return { canManage: false, reason: 'You are not a member of this trip' };
        }
        if (!target || target.status === 'REMOVED') {
            return { canManage: false, reason: 'Target member not found' };
        }
        if (requester.role === 'OWNER') {
            return { canManage: true };
        }
        if (requester.role === 'EDITOR') {
            if (target.role === 'OWNER' || target.role === 'EDITOR') {
                return { canManage: false, reason: 'Organizers cannot manage other organizers or the master' };
            }
            return { canManage: true };
        }
        return { canManage: false, reason: 'You do not have permission to manage members' };
    }
    async canPromoteToOrganizer(requesterId, tripId) {
        const requester = await this.prisma.tripMember.findUnique({
            where: {
                tripId_userId: {
                    tripId,
                    userId: requesterId,
                },
            },
        });
        if (!requester || requester.status !== 'CONFIRMED') {
            return { canPromote: false, reason: 'You are not a member of this trip' };
        }
        if (requester.role !== 'OWNER') {
            return { canPromote: false, reason: 'Only the trip master can promote members to organizers' };
        }
        return { canPromote: true };
    }
    async addTripMember(tripId, userId, invitedById, role = 'EDITOR') {
        const existingMember = await this.prisma.tripMember.findUnique({
            where: {
                tripId_userId: {
                    tripId,
                    userId,
                },
            },
        });
        if (existingMember && existingMember.status !== 'REMOVED') {
            throw new Error('User is already a member of this trip');
        }
        // Check trip style to determine initial status
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { style: true },
        });
        // OPEN trips auto-confirm members, MANAGED trips require approval
        const memberStatus = trip?.style === 'OPEN' ? 'CONFIRMED' : 'INVITED';
        let member;
        try {
            member = await this.prisma.tripMember.upsert({
                where: {
                    tripId_userId: {
                        tripId,
                        userId,
                    },
                },
                update: {
                    role: role,
                    status: memberStatus,
                    invitedById: invitedById ?? null,
                },
                create: {
                    tripId,
                    userId,
                    role: role,
                    status: memberStatus,
                    invitedById: invitedById ?? null,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true,
                        },
                    },
                },
            });
        }
        catch (error) {
            // Re-throw Prisma errors as user-friendly messages
            if (error.code === 'P2002') {
                throw new Error('User is already a member of this trip');
            }
            throw error;
        }
        try {
            await this.prisma.timelineEvent.create({
                data: {
                    tripId,
                    eventType: 'member_joined',
                    description: memberStatus === 'CONFIRMED'
                        ? `${member.user.name} joined the trip`
                        : `${member.user.name} requested to join the trip`,
                    createdBy: userId,
                    effectiveDate: new Date(),
                },
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        // Notify the added member
        if (memberStatus === 'CONFIRMED') {
            const trip = await this.prisma.trip.findUnique({
                where: { id: tripId },
                select: { name: true },
            });
            try {
                await notification_service_1.notificationService.createNotification({
                    userId,
                    category: client_1.NotificationCategory.MEMBER,
                    title: 'Added to Trip',
                    body: `You were added to "${trip?.name}"`,
                    referenceId: tripId,
                    referenceType: client_1.NotificationReferenceType.TRIP,
                    link: `/trip/${tripId}`,
                });
            }
            catch (e) {
                console.error('Notification creation failed:', e);
            }
        }
        return member;
    }
    // ─── JOIN REQUEST FLOW ─────────────────────────────────────────────────────
    /**
     * Request to join a trip (OPEN-style managed join requests)
     */
    async requestJoin(tripId, userId) {
        const existing = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId, userId } },
        });
        if (existing && existing.status !== 'REMOVED') {
            throw new Error('You are already a member or have a pending request');
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { name: true, style: true },
        });
        if (!trip)
            throw new Error('Trip not found');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { name: true },
        });
        const member = await this.prisma.tripMember.upsert({
            where: { tripId_userId: { tripId, userId } },
            update: { status: 'PENDING_JOIN', role: 'EDITOR' },
            create: { tripId, userId, role: 'EDITOR', status: 'PENDING_JOIN' },
        });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId,
                eventType: 'JOIN_REQUEST_SENT',
                actorId: userId,
                description: `${user?.name || 'Someone'} requested to join the trip`,
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        // Notify OWNERs and EDITORs
        const managers = await this.prisma.tripMember.findMany({
            where: { tripId, role: { in: ['OWNER', 'EDITOR'] }, status: 'CONFIRMED' },
            select: { userId: true },
        });
        for (const manager of managers) {
            try {
                await notification_service_1.notificationService.createNotification({
                    userId: manager.userId,
                    category: client_1.NotificationCategory.MEMBER,
                    title: 'Join Request',
                    body: `${user?.name || 'Someone'} wants to join "${trip.name}"`,
                    referenceId: tripId,
                    referenceType: client_1.NotificationReferenceType.TRIP,
                    link: `/trip/${tripId}/members`,
                });
            }
            catch (e) {
                console.error('Notification failed:', e);
            }
        }
        return member;
    }
    /**
     * Approve a join request → sets member status to CONFIRMED
     */
    async approveJoinRequest(tripId, userId) {
        const member = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId, userId } },
        });
        if (!member || member.status !== 'PENDING_JOIN') {
            throw new Error('No pending join request found for this user');
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { name: true },
        });
        const updated = await this.prisma.tripMember.update({
            where: { tripId_userId: { tripId, userId } },
            data: { status: 'CONFIRMED' },
        });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId,
                eventType: 'JOIN_REQUEST_APPROVED',
                actorId: userId,
                targetId: userId,
                description: 'A join request was approved',
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        // Notify the requester
        try {
            await notification_service_1.notificationService.createNotification({
                userId,
                category: client_1.NotificationCategory.MEMBER,
                title: 'Join Request Approved',
                body: `Your request to join "${trip?.name}" was approved!`,
                referenceId: tripId,
                referenceType: client_1.NotificationReferenceType.TRIP,
                link: `/trip/${tripId}`,
            });
        }
        catch (e) {
            console.error('Notification failed:', e);
        }
        return updated;
    }
    /**
     * Deny a join request → removes the PENDING_JOIN member
     */
    async denyJoinRequest(tripId, userId) {
        const member = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId, userId } },
        });
        if (!member || member.status !== 'PENDING_JOIN') {
            throw new Error('No pending join request found for this user');
        }
        const trip = await this.prisma.trip.findUnique({
            where: { id: tripId },
            select: { name: true },
        });
        await this.prisma.tripMember.update({
            where: { tripId_userId: { tripId, userId } },
            data: { status: 'REMOVED' },
        });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId,
                eventType: 'JOIN_REQUEST_DENIED',
                actorId: userId,
                targetId: userId,
                description: 'A join request was denied',
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        // Notify the requester
        try {
            await notification_service_1.notificationService.createNotification({
                userId,
                category: client_1.NotificationCategory.MEMBER,
                title: 'Join Request Denied',
                body: `Your request to join "${trip?.name}" was denied`,
                referenceId: tripId,
                referenceType: client_1.NotificationReferenceType.TRIP,
                link: '/dashboard',
            });
        }
        catch (e) {
            console.error('Notification failed:', e);
        }
        return { success: true };
    }
    /**
     * Change a member's role
     */
    async changeRole(tripId, userId, newRole) {
        const member = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId, userId } },
            include: { user: { select: { name: true } } },
        });
        if (!member) {
            throw new Error('Member not found');
        }
        const oldRole = member.role;
        if (oldRole === newRole) {
            return member;
        }
        const updated = await this.prisma.tripMember.update({
            where: { tripId_userId: { tripId, userId } },
            data: { role: newRole },
        });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId,
                eventType: 'role_changed',
                actorId: userId,
                metadata: { memberId: userId, oldRole, newRole },
                description: `${member.user.name}'s role changed from ${oldRole} to ${newRole}`,
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        return updated;
    }
    /**
     * Withdraw a pending join request
     */
    async withdrawJoinRequest(tripId, userId) {
        const member = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId, userId } },
            include: { user: { select: { name: true } } },
        });
        if (!member || member.status !== 'PENDING_JOIN') {
            throw new Error('No pending join request found');
        }
        await this.prisma.tripMember.update({
            where: { tripId_userId: { tripId, userId } },
            data: { status: 'REMOVED' },
        });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId,
                eventType: 'member_left',
                actorId: userId,
                description: `${member.user.name} left the trip`,
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
    }
}
exports.TripService = TripService;
exports.tripService = new TripService();
//# sourceMappingURL=trip.service.js.map