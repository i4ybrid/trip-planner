"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inviteService = exports.InviteService = void 0;
const prisma_1 = require("@/lib/prisma");
const uuid_1 = require("uuid");
const notification_service_1 = require("@/services/notification.service");
const client_1 = require("@prisma/client");
const timeline_service_1 = require("@/services/timeline.service");
class InviteService {
    prisma = (0, prisma_1.getPrisma)();
    async createInvite(data) {
        const token = (0, uuid_1.v4)();
        const invite = await this.prisma.invite.create({
            data: {
                tripId: data.tripId,
                token,
                email: data.email,
                phone: data.phone,
                expiresAt: data.expiresAt,
                sentById: data.sentById,
                channels: {
                    create: data.channels?.map((channel) => ({ channel })) || [],
                },
            },
            include: {
                trip: { select: { id: true, name: true } },
                sentBy: { select: { id: true, name: true } },
            },
        });
        // Send in-app notification if invitee has an account
        await this.sendInviteNotification(invite);
        return {
            ...invite,
            inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`,
        };
    }
    // Send in-app notification to the invitee if they have an existing account
    async sendInviteNotification(invite) {
        let inviteeUserId = null;
        if (invite.email) {
            const user = await this.prisma.user.findUnique({
                where: { email: invite.email.toLowerCase() },
                select: { id: true },
            });
            inviteeUserId = user?.id ?? null;
        }
        else if (invite.phone) {
            const user = await this.prisma.user.findFirst({
                where: { phone: invite.phone },
                select: { id: true },
            });
            inviteeUserId = user?.id ?? null;
        }
        if (!inviteeUserId)
            return;
        // Don't notify the sender if they're somehow the invitee
        if (inviteeUserId === invite.sentById)
            return;
        await notification_service_1.notificationService.createNotification({
            userId: inviteeUserId,
            category: client_1.NotificationCategory.INVITE,
            title: 'Trip Invite',
            body: `You've been invited to join "${invite.trip.name}"`,
            referenceId: invite.token,
            referenceType: client_1.NotificationReferenceType.INVITE,
            link: `/invite/${invite.token}`,
        });
    }
    async getInviteByToken(token) {
        return this.prisma.invite.findUnique({
            where: { token },
            include: {
                trip: { select: { id: true, name: true, description: true, coverImage: true } },
                sentBy: { select: { id: true, name: true } },
            },
        });
    }
    async acceptInvite(token, userId) {
        const invite = await this.prisma.invite.findUnique({
            where: { token },
            include: { trip: true },
        });
        if (!invite) {
            throw new Error('Invite not found');
        }
        if (invite.status !== 'PENDING') {
            throw new Error(`Invite has already been ${invite.status.toLowerCase()}`);
        }
        if (invite.expiresAt < new Date()) {
            await this.revokeInvite(invite.id);
            throw new Error('Invite has expired');
        }
        const existingMember = await this.prisma.tripMember.findUnique({
            where: { tripId_userId: { tripId: invite.tripId, userId } },
        });
        if (existingMember && existingMember.status === 'CONFIRMED') {
            throw new Error('You are already a member of this trip');
        }
        const newMemberStatus = invite.trip.style === 'OPEN' ? 'CONFIRMED' : 'INVITED';
        // Create as VIEWER first, then upgrade to EDITOR
        await this.prisma.tripMember.upsert({
            where: { tripId_userId: { tripId: invite.tripId, userId } },
            update: { status: newMemberStatus, role: 'VIEWER' },
            create: { tripId: invite.tripId, userId, role: 'VIEWER', status: newMemberStatus },
        });
        // Promote VIEWER → EDITOR on acceptance
        await this.prisma.tripMember.update({
            where: { tripId_userId: { tripId: invite.tripId, userId } },
            data: { role: 'EDITOR' },
        });
        await this.prisma.invite.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED' },
        });
        // Fetch user name BEFORE emitting timeline event
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId: invite.tripId,
                eventType: 'member_joined',
                description: newMemberStatus === 'CONFIRMED' ? `${user?.name || 'Someone'} joined the trip` : `${user?.name || 'Someone'} requested to join the trip`,
                actorId: userId,
                effectiveDate: new Date(),
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(invite.tripId);
        }
        catch (e) {
            // Log but don't fail the request
            console.error('Timeline event failed:', e);
        }
        // Notify trip creator/sender about invite accepted
        if (newMemberStatus === 'CONFIRMED') {
            // User already fetched above
            try {
                await notification_service_1.notificationService.createNotification({
                    userId: invite.sentById,
                    category: client_1.NotificationCategory.INVITE,
                    title: 'Invite Accepted',
                    body: `${user?.name || 'Someone'} accepted your invite to "${invite.trip.name}"`,
                    referenceId: invite.tripId,
                    referenceType: client_1.NotificationReferenceType.TRIP,
                    link: `/trip/${invite.tripId}`,
                });
            }
            catch (e) {
                console.error('Notification creation failed:', e);
            }
        }
        return { ...invite.trip, memberStatus: newMemberStatus };
    }
    async declineInvite(token) {
        const invite = await this.prisma.invite.findUnique({
            where: { token },
            include: { trip: { select: { id: true, name: true } } },
        });
        if (!invite) {
            throw new Error('Invite not found');
        }
        const updated = await this.prisma.invite.update({
            where: { id: invite.id },
            data: { status: 'DECLINED' },
        });
        try {
            await timeline_service_1.timelineService.emitTimelineEvent({
                tripId: invite.tripId,
                eventType: 'INVITE_DECLINED',
                actorId: invite.sentById,
                description: 'An invite was declined',
            });
            await timeline_service_1.timelineService.upsertNeedsRefresh(invite.tripId);
        }
        catch (e) {
            console.error('Timeline event failed:', e);
        }
        // Notify trip creator/sender about invite declined
        try {
            await notification_service_1.notificationService.createNotification({
                userId: invite.sentById,
                category: client_1.NotificationCategory.INVITE,
                title: 'Invite Declined',
                body: `Someone declined the invite to "${invite.trip.name}"`,
                referenceId: invite.tripId,
                referenceType: client_1.NotificationReferenceType.TRIP,
                link: `/trip/${invite.tripId}`,
            });
        }
        catch (e) {
            console.error('Notification failed:', e);
        }
        return updated;
    }
    async revokeInvite(inviteId) {
        return this.prisma.invite.update({
            where: { id: inviteId },
            data: { status: 'REVOKED' },
        });
    }
    async getTripInvites(tripId) {
        return this.prisma.invite.findMany({
            where: { tripId },
            include: { channels: true, sentBy: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async expireInvites(tripId) {
        return this.prisma.invite.updateMany({
            where: { tripId, expiresAt: { lte: new Date() }, status: 'PENDING' },
            data: { status: 'EXPIRED' },
        });
    }
    async getPendingInvitesByEmail(email) {
        return this.prisma.invite.findMany({
            where: { email: email.toLowerCase(), status: 'PENDING', expiresAt: { gte: new Date() } },
            include: {
                trip: { select: { id: true, name: true, description: true, coverImage: true, style: true } },
                sentBy: { select: { id: true, name: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getPendingInvitesByUserId(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!user)
            return [];
        return this.getPendingInvitesByEmail(user.email);
    }
}
exports.InviteService = InviteService;
exports.inviteService = new InviteService();
//# sourceMappingURL=invite.service.js.map