"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketStub = exports.PrismaStub = void 0;
exports.createStubs = createStubs;
const vitest_1 = require("vitest");
/**
 * PrismaStub - In-memory mock of PrismaClient for unit testing
 */
class PrismaStub {
    users = new Map();
    trips = new Map();
    activities = new Map();
    votes = new Map();
    members = new Map();
    messages = new Map();
    billSplits = new Map();
    billSplitMembers = new Map();
    invites = new Map();
    notifications = new Map();
    friends = new Map();
    friendRequests = new Map();
    mediaItems = new Map();
    timelineEvents = new Map();
    dmConversations = new Map();
    settings = new Map();
    milestones = new Map();
    milestoneCompletions = new Map();
    milestoneActions = new Map();
    messageReadReceipts = new Map();
    notificationPreferences = new Map();
    tripTimelineUIStates = new Map();
    /** Apply Prisma include/select to an activity record */
    _applyActivityInclude(activity, include) {
        const result = { ...activity };
        if (include?.proposer) {
            const user = this.users.get(activity.proposedBy);
            if (include.proposer.select) {
                result.proposer = {};
                if (include.proposer.select.id)
                    result.proposer.id = user?.id;
                if (include.proposer.select.name)
                    result.proposer.name = user?.name;
                if (include.proposer.select.avatarUrl)
                    result.proposer.avatarUrl = user?.avatarUrl;
            }
            else {
                result.proposer = user;
            }
        }
        if (include?.votes) {
            const activityVotes = Array.from(this.votes.values()).filter((v) => v.activityId === activity.id);
            result.votes = activityVotes.map((v) => {
                const withUser = { ...v };
                if (include.votes.include?.user) {
                    const voter = this.users.get(v.userId);
                    if (include.votes.include.user.select) {
                        withUser.user = {};
                        if (include.votes.include.user.select.id)
                            withUser.user.id = voter?.id;
                        if (include.votes.include.user.select.name)
                            withUser.user.name = voter?.name;
                        if (include.votes.include.user.select.avatarUrl)
                            withUser.user.avatarUrl = voter?.avatarUrl;
                    }
                }
                return withUser;
            });
        }
        if (include?.mediaItems) {
            result.mediaItems = Array.from(this.mediaItems.values()).filter((m) => m.activityId === activity.id);
        }
        return result;
    }
    /** Apply Prisma include/select to a message record */
    _applyMessageInclude(message, include) {
        const result = { ...message };
        if (include?.sender) {
            const user = this.users.get(message.senderId);
            if (include.sender.select) {
                result.sender = {};
                if (include.sender.select.id)
                    result.sender.id = user?.id;
                if (include.sender.select.name)
                    result.sender.name = user?.name;
                if (include.sender.select.avatarUrl)
                    result.sender.avatarUrl = user?.avatarUrl;
            }
            else {
                result.sender = user;
            }
        }
        if (include?.replyTo) {
            const replyTo = message.replyToId ? this.messages.get(message.replyToId) : null;
            if (include.replyTo.select) {
                result.replyTo = {};
                if (include.replyTo.select.id)
                    result.replyTo.id = replyTo?.id;
                if (include.replyTo.select.content)
                    result.replyTo.content = replyTo?.content;
            }
            else {
                result.replyTo = replyTo;
            }
        }
        return result;
    }
    getImplementation() {
        return {
            user: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    if (where.id)
                        return Promise.resolve(this.users.get(where.id));
                    if (where.email) {
                        for (const user of this.users.values()) {
                            if (user.email === where.email)
                                return Promise.resolve(user);
                        }
                    }
                    return Promise.resolve(null);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const user = { id: `user-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
                    this.users.set(user.id, user);
                    return Promise.resolve(user);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const user = this.users.get(where.id);
                    if (!user)
                        return Promise.reject(new Error('User not found'));
                    const updated = { ...user, ...data, updatedAt: new Date() };
                    this.users.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const user = this.users.get(where.id);
                    if (!user)
                        return Promise.reject(new Error('User not found'));
                    this.users.delete(where.id);
                    return Promise.resolve(user);
                }),
                findMany: vitest_1.vi.fn(({ where, include: _include }) => {
                    let result = Array.from(this.users.values());
                    if (where?.id)
                        result = result.filter((u) => u.id === where.id);
                    return Promise.resolve(result);
                }),
            },
            trip: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.trips.get(where.id))),
                create: vitest_1.vi.fn(({ data }) => {
                    // Handle nested creates (e.g., members.create)
                    const { members, ...restData } = data;
                    const trip = {
                        id: `trip-${Date.now()}`,
                        ...restData,
                        status: data.status || 'IDEA',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.trips.set(trip.id, trip);
                    // Handle nested members.create
                    if (members?.create) {
                        const membersData = Array.isArray(members.create) ? members.create : [members.create];
                        for (const m of membersData) {
                            const member = {
                                id: `member-${Date.now()}`,
                                ...m,
                                tripId: trip.id,
                                role: m.role || 'EDITOR',
                                status: m.status || 'INVITED',
                                joinedAt: new Date(),
                            };
                            const key = `${trip.id}-${m.userId}`;
                            this.members.set(key, member);
                        }
                    }
                    return Promise.resolve(trip);
                }),
                upsert: vitest_1.vi.fn(({ where, create, update }) => {
                    const existing = this.trips.get(where.id);
                    if (existing) {
                        const updated = { ...existing, ...update, updatedAt: new Date() };
                        this.trips.set(where.id, updated);
                        return Promise.resolve(updated);
                    }
                    const trip = { ...create, createdAt: new Date(), updatedAt: new Date() };
                    this.trips.set(trip.id, trip);
                    return Promise.resolve(trip);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const trip = this.trips.get(where.id);
                    if (!trip) {
                        // Auto-upsert: create the trip if it doesn't exist (for test flexibility)
                        const newTrip = { id: where.id, ...data, status: data.status || 'IDEA', createdAt: new Date(), updatedAt: new Date() };
                        this.trips.set(where.id, newTrip);
                        return Promise.resolve(newTrip);
                    }
                    const updated = { ...trip, ...data, updatedAt: new Date() };
                    this.trips.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const trip = this.trips.get(where.id);
                    if (!trip)
                        return Promise.reject(new Error('Trip not found'));
                    this.trips.delete(where.id);
                    return Promise.resolve(trip);
                }),
                findMany: vitest_1.vi.fn(({ where: _where, include: _include }) => {
                    let result = Array.from(this.trips.values());
                    return Promise.resolve(result);
                }),
            },
            tripMember: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    if (where.tripId_userId) {
                        const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
                        return Promise.resolve(this.members.get(key));
                    }
                    return Promise.resolve(null);
                }),
                findFirst: vitest_1.vi.fn(({ where }) => {
                    for (const member of this.members.values()) {
                        if (where?.tripId && member.tripId !== where.tripId)
                            continue;
                        if (where?.userId && member.userId !== where.userId)
                            continue;
                        if (where?.role && member.role !== where.role)
                            continue;
                        if (where?.status && member.status !== where.status)
                            continue;
                        return Promise.resolve(member);
                    }
                    return Promise.resolve(null);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const member = {
                        id: `member-${Date.now()}`,
                        ...data,
                        role: data.role || 'EDITOR',
                        status: data.status || 'INVITED',
                        joinedAt: new Date(),
                    };
                    const key = `${data.tripId}-${data.userId}`;
                    this.members.set(key, member);
                    return Promise.resolve(member);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
                    const member = this.members.get(key);
                    if (!member)
                        return Promise.reject(new Error('Member not found'));
                    const updated = { ...member, ...data };
                    this.members.set(key, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
                    const member = this.members.get(key);
                    if (!member)
                        return Promise.reject(new Error('Member not found'));
                    this.members.delete(key);
                    return Promise.resolve(member);
                }),
                findMany: vitest_1.vi.fn(({ where, include }) => {
                    let result = Array.from(this.members.values());
                    if (where?.tripId)
                        result = result.filter((m) => m.tripId === where.tripId);
                    if (where?.status)
                        result = result.filter((m) => m.status === where.status);
                    // Handle includes: inject user relation
                    if (include?.user) {
                        result = result.map((m) => {
                            const user = m.userId ? this.users.get(m.userId) : undefined;
                            return {
                                ...m,
                                user: user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : undefined,
                            };
                        });
                    }
                    return Promise.resolve(result);
                }),
            },
            activity: {
                findUnique: vitest_1.vi.fn(({ where, include }) => {
                    const activity = this.activities.get(where.id);
                    if (!activity)
                        return Promise.resolve(null);
                    return Promise.resolve(this._applyActivityInclude(activity, include));
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const activity = {
                        id: `activity-${Date.now()}`,
                        ...data,
                        currency: data.currency || 'USD',
                        createdAt: new Date(),
                    };
                    this.activities.set(activity.id, activity);
                    return Promise.resolve(activity);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const activity = this.activities.get(where.id);
                    if (!activity)
                        return Promise.reject(new Error('Activity not found'));
                    const updated = { ...activity, ...data };
                    this.activities.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const activity = this.activities.get(where.id);
                    if (!activity)
                        return Promise.reject(new Error('Activity not found'));
                    this.activities.delete(where.id);
                    return Promise.resolve(activity);
                }),
                findMany: vitest_1.vi.fn(({ where, include, orderBy, take }) => {
                    let result = Array.from(this.activities.values());
                    if (where?.tripId)
                        result = result.filter((a) => a.tripId === where.tripId);
                    if (include) {
                        result = result.map((a) => this._applyActivityInclude(a, include));
                    }
                    // Apply orderBy
                    if (orderBy?.createdAt === 'desc') {
                        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    }
                    else if (orderBy?.createdAt === 'asc') {
                        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    }
                    if (take !== undefined)
                        result = result.slice(0, take);
                    return Promise.resolve(result);
                }),
            },
            vote: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.voteId_userId.activityId}-${where.voteId_userId.userId}`;
                    return Promise.resolve(this.votes.get(key));
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const vote = { id: `vote-${Date.now()}`, ...data };
                    const key = `${data.activityId}-${data.userId}`;
                    this.votes.set(key, vote);
                    return Promise.resolve(vote);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const key = `${where.voteId_userId.activityId}-${where.voteId_userId.userId}`;
                    const vote = this.votes.get(key);
                    if (!vote)
                        return Promise.reject(new Error('Vote not found'));
                    const updated = { ...vote, ...data };
                    this.votes.set(key, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.voteId_userId.activityId}-${where.voteId_userId.userId}`;
                    const vote = this.votes.get(key);
                    if (!vote)
                        return Promise.reject(new Error('Vote not found'));
                    this.votes.delete(key);
                    return Promise.resolve(vote);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.votes.values());
                    if (where?.activityId)
                        result = result.filter((v) => v.activityId === where.activityId);
                    return Promise.resolve(result);
                }),
            },
            message: {
                findUnique: vitest_1.vi.fn(({ where, include }) => {
                    const message = this.messages.get(where.id);
                    if (!message)
                        return Promise.resolve(null);
                    if (include)
                        return Promise.resolve(this._applyMessageInclude(message, include));
                    return Promise.resolve(message);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const message = {
                        id: `message-${Date.now()}`,
                        ...data,
                        messageType: data.messageType || 'TEXT',
                        mentions: data.mentions || [],
                        createdAt: new Date(),
                    };
                    this.messages.set(message.id, message);
                    return Promise.resolve(message);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const message = this.messages.get(where.id);
                    if (!message)
                        return Promise.reject(new Error('Message not found'));
                    const updated = { ...message, ...data, editedAt: data.content ? new Date() : message.editedAt };
                    this.messages.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const message = this.messages.get(where.id);
                    if (!message)
                        return Promise.reject(new Error('Message not found'));
                    this.messages.delete(where.id);
                    return Promise.resolve(message);
                }),
                findMany: vitest_1.vi.fn(({ where, include, orderBy, take }) => {
                    let result = Array.from(this.messages.values());
                    if (where?.tripId)
                        result = result.filter((m) => m.tripId === where.tripId);
                    if (where?.conversationId)
                        result = result.filter((m) => m.conversationId === where.conversationId);
                    if (where?.senderId)
                        result = result.filter((m) => m.senderId === where.senderId);
                    if (include) {
                        result = result.map((m) => this._applyMessageInclude(m, include));
                    }
                    // Apply orderBy
                    if (orderBy?.createdAt === 'desc') {
                        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    }
                    else if (orderBy?.createdAt === 'asc') {
                        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    }
                    // Apply take (limit) and skip
                    if (take !== undefined)
                        result = result.slice(0, take);
                    if (where?.skip !== undefined)
                        result = result.slice(where.skip);
                    return Promise.resolve(result);
                }),
            },
            billSplit: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.billSplits.get(where.id))),
                create: vitest_1.vi.fn(({ data }) => {
                    const billSplit = {
                        id: `bill-${Date.now()}`,
                        ...data,
                        currency: data.currency || 'USD',
                        splitType: data.splitType || 'EQUAL',
                        status: data.status || 'PENDING',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.billSplits.set(billSplit.id, billSplit);
                    return Promise.resolve(billSplit);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const billSplit = this.billSplits.get(where.id);
                    if (!billSplit)
                        return Promise.reject(new Error('BillSplit not found'));
                    const updated = { ...billSplit, ...data, updatedAt: new Date() };
                    this.billSplits.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const billSplit = this.billSplits.get(where.id);
                    if (!billSplit)
                        return Promise.reject(new Error('BillSplit not found'));
                    this.billSplits.delete(where.id);
                    return Promise.resolve(billSplit);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.billSplits.values());
                    if (where?.tripId)
                        result = result.filter((b) => b.tripId === where.tripId);
                    return Promise.resolve(result);
                }),
            },
            billSplitMember: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.billSplitId_userId.billSplitId}-${where.billSplitId_userId.userId}`;
                    return Promise.resolve(this.billSplitMembers.get(key));
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const member = {
                        id: `bsm-${Date.now()}`,
                        ...data,
                        status: data.status || 'PENDING',
                        type: data.type || 'EQUAL',
                    };
                    const key = `${data.billSplitId}-${data.userId}`;
                    this.billSplitMembers.set(key, member);
                    return Promise.resolve(member);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const key = `${where.billSplitId_userId.billSplitId}-${where.billSplitId_userId.userId}`;
                    const member = this.billSplitMembers.get(key);
                    if (!member)
                        return Promise.reject(new Error('BillSplitMember not found'));
                    const updated = { ...member, ...data };
                    this.billSplitMembers.set(key, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.billSplitId_userId.billSplitId}-${where.billSplitId_userId.userId}`;
                    const member = this.billSplitMembers.get(key);
                    if (!member)
                        return Promise.reject(new Error('BillSplitMember not found'));
                    this.billSplitMembers.delete(key);
                    return Promise.resolve(member);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.billSplitMembers.values());
                    if (where?.billSplitId)
                        result = result.filter((m) => m.billSplitId === where.billSplitId);
                    return Promise.resolve(result);
                }),
            },
            invite: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    if (where.token) {
                        for (const invite of this.invites.values()) {
                            if (invite.token === where.token)
                                return Promise.resolve(invite);
                        }
                    }
                    if (where.id)
                        return Promise.resolve(this.invites.get(where.id));
                    return Promise.resolve(null);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const invite = {
                        id: `invite-${Date.now()}`,
                        ...data,
                        status: data.status || 'PENDING',
                        createdAt: new Date(),
                    };
                    this.invites.set(invite.id, invite);
                    return Promise.resolve(invite);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const invite = this.invites.get(where.id);
                    if (!invite)
                        return Promise.reject(new Error('Invite not found'));
                    const updated = { ...invite, ...data };
                    this.invites.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.invites.values());
                    if (where?.tripId)
                        result = result.filter((i) => i.tripId === where.tripId);
                    return Promise.resolve(result);
                }),
            },
            notification: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.notifications.get(where.id))),
                create: vitest_1.vi.fn(({ data }) => {
                    const notification = {
                        id: `notif-${Date.now()}`,
                        ...data,
                        read: data.read ?? false,
                        priority: data.priority || 'normal',
                        createdAt: new Date(),
                    };
                    this.notifications.set(notification.id, notification);
                    return Promise.resolve(notification);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const notification = this.notifications.get(where.id);
                    if (!notification)
                        return Promise.reject(new Error('Notification not found'));
                    const updated = { ...notification, ...data };
                    this.notifications.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const notification = this.notifications.get(where.id);
                    if (!notification)
                        return Promise.reject(new Error('Notification not found'));
                    this.notifications.delete(where.id);
                    return Promise.resolve(notification);
                }),
                findMany: vitest_1.vi.fn(({ where, include, orderBy, take }) => {
                    let result = Array.from(this.notifications.values());
                    if (where?.userId)
                        result = result.filter((n) => n.userId === where.userId);
                    // Handle includes: inject trip relation (supports include.trip or include.trip.select)
                    if (include?.trip) {
                        result = result.map((n) => {
                            const trip = n.tripId ? this.trips.get(n.tripId) : undefined;
                            if (include.trip.select) {
                                // Prisma uses select to pick specific fields
                                const selected = {};
                                if (include.trip.select.id)
                                    selected.id = trip?.id;
                                if (include.trip.select.name)
                                    selected.name = trip?.name;
                                return { ...n, trip: selected };
                            }
                            return {
                                ...n,
                                trip: trip ? { id: trip.id, name: trip.name } : undefined,
                            };
                        });
                    }
                    // Apply orderBy
                    if (orderBy?.createdAt === 'desc') {
                        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    }
                    else if (orderBy?.createdAt === 'asc') {
                        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                    }
                    // Apply take (limit)
                    if (take !== undefined) {
                        result = result.slice(0, take);
                    }
                    return Promise.resolve(result);
                }),
                count: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.notifications.values());
                    if (where?.userId)
                        result = result.filter((n) => n.userId === where.userId);
                    if (where?.read === false)
                        result = result.filter((n) => !n.read);
                    return Promise.resolve(result.length);
                }),
                updateMany: vitest_1.vi.fn(({ where, data }) => {
                    let result = [];
                    let count = 0;
                    this.notifications.forEach((notification, id) => {
                        let matches = true;
                        if (where?.userId && notification.userId !== where.userId)
                            matches = false;
                        if (where?.read === false && notification.read !== false)
                            matches = false;
                        if (where?.read === true && notification.read !== true)
                            matches = false;
                        if (matches) {
                            const updated = { ...notification, ...data };
                            this.notifications.set(id, updated);
                            result.push(updated);
                            count++;
                        }
                    });
                    return Promise.resolve({ count });
                }),
            },
            friend: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.userId}-${where.friendId}`;
                    return Promise.resolve(this.friends.get(key));
                }),
                findFirst: vitest_1.vi.fn(({ where }) => {
                    for (const friend of this.friends.values()) {
                        if (where.userId && friend.userId !== where.userId)
                            continue;
                        if (where.friendId && friend.friendId !== where.friendId)
                            continue;
                        return Promise.resolve(friend);
                    }
                    return Promise.resolve(null);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.friends.values());
                    if (where?.userId)
                        result = result.filter((f) => f.userId === where.userId);
                    return Promise.resolve(result);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const friend = { id: `friend-${Date.now()}`, ...data, createdAt: new Date() };
                    const key = `${data.userId}-${data.friendId}`;
                    this.friends.set(key, friend);
                    return Promise.resolve(friend);
                }),
                deleteMany: vitest_1.vi.fn(({ where }) => {
                    for (const [key, friend] of this.friends.entries()) {
                        if (where.OR) {
                            for (const condition of where.OR) {
                                if (condition.userId && friend.userId === condition.userId &&
                                    condition.friendId && friend.friendId === condition.friendId) {
                                    this.friends.delete(key);
                                }
                            }
                        }
                    }
                    return Promise.resolve({ count: 0 });
                }),
            },
            friendRequest: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.friendRequests.get(where.id))),
                findFirst: vitest_1.vi.fn(({ where }) => {
                    for (const request of this.friendRequests.values()) {
                        if (where.senderId && request.senderId !== where.senderId)
                            continue;
                        if (where.receiverId && request.receiverId !== where.receiverId)
                            continue;
                        if (where.status && request.status !== where.status)
                            continue;
                        return Promise.resolve(request);
                    }
                    return Promise.resolve(null);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.friendRequests.values());
                    if (where?.senderId)
                        result = result.filter((r) => r.senderId === where.senderId);
                    if (where?.receiverId)
                        result = result.filter((r) => r.receiverId === where.receiverId);
                    if (where?.status)
                        result = result.filter((r) => r.status === where.status);
                    return Promise.resolve(result);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const request = {
                        id: `fr-${Date.now()}`,
                        ...data,
                        status: data.status || 'PENDING',
                        createdAt: new Date(),
                    };
                    this.friendRequests.set(request.id, request);
                    return Promise.resolve(request);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const request = this.friendRequests.get(where.id);
                    if (!request)
                        return Promise.reject(new Error('FriendRequest not found'));
                    const updated = { ...request, ...data, respondedAt: data.status ? new Date() : undefined };
                    this.friendRequests.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const request = this.friendRequests.get(where.id);
                    if (!request)
                        return Promise.reject(new Error('FriendRequest not found'));
                    this.friendRequests.delete(where.id);
                    return Promise.resolve(request);
                }),
            },
            mediaItem: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.mediaItems.get(where.id))),
                create: vitest_1.vi.fn(({ data }) => {
                    const media = {
                        id: `media-${Date.now()}`,
                        ...data,
                        createdAt: new Date(),
                    };
                    this.mediaItems.set(media.id, media);
                    return Promise.resolve(media);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const media = this.mediaItems.get(where.id);
                    if (!media)
                        return Promise.reject(new Error('MediaItem not found'));
                    this.mediaItems.delete(where.id);
                    return Promise.resolve(media);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.mediaItems.values());
                    if (where?.tripId)
                        result = result.filter((m) => m.tripId === where.tripId);
                    return Promise.resolve(result);
                }),
            },
            timelineEvent: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.timelineEvents.get(where.id))),
                create: vitest_1.vi.fn(({ data }) => {
                    const event = {
                        id: `event-${Date.now()}`,
                        ...data,
                        createdAt: new Date(),
                    };
                    this.timelineEvents.set(event.id, event);
                    return Promise.resolve(event);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.timelineEvents.values());
                    if (where?.tripId)
                        result = result.filter((e) => e.tripId === where.tripId);
                    return Promise.resolve(result);
                }),
                updateMany: vitest_1.vi.fn(({ where, data }) => {
                    let count = 0;
                    for (const event of this.timelineEvents.values()) {
                        let matches = true;
                        if (where?.sourceType && event.sourceType !== where.sourceType)
                            matches = false;
                        if (where?.sourceId && event.sourceId !== where.sourceId)
                            matches = false;
                        if (where?.activityId && event.activityId !== where.activityId)
                            matches = false;
                        if (where?.kind && event.kind !== where.kind)
                            matches = false;
                        if (matches) {
                            this.timelineEvents.set(event.id, { ...event, ...data });
                            count++;
                        }
                    }
                    return Promise.resolve({ count });
                }),
                deleteMany: vitest_1.vi.fn(({ where }) => {
                    let count = 0;
                    if (where?.sourceType && where?.sourceId) {
                        for (const [id, event] of this.timelineEvents.entries()) {
                            if (event.sourceType === where.sourceType && event.sourceId === where.sourceId) {
                                this.timelineEvents.delete(id);
                                count++;
                            }
                        }
                    }
                    else if (where?.activityId) {
                        for (const [id, event] of this.timelineEvents.entries()) {
                            if (event.activityId === where.activityId) {
                                this.timelineEvents.delete(id);
                                count++;
                            }
                        }
                    }
                    return Promise.resolve({ count });
                }),
            },
            tripTimelineUIState: {
                upsert: vitest_1.vi.fn(({ where, create, update }) => {
                    const existing = this.tripTimelineUIStates.get(where.tripId);
                    if (existing) {
                        const updated = { ...existing, ...update };
                        this.tripTimelineUIStates.set(where.tripId, updated);
                        return Promise.resolve(updated);
                    }
                    const state = { ...create };
                    this.tripTimelineUIStates.set(where.tripId, state);
                    return Promise.resolve(state);
                }),
                findUnique: vitest_1.vi.fn(({ where }) => {
                    return Promise.resolve(this.tripTimelineUIStates.get(where.tripId) || null);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const existing = this.tripTimelineUIStates.get(where.tripId);
                    if (!existing)
                        return Promise.reject(new Error('Not found'));
                    const updated = { ...existing, ...data };
                    this.tripTimelineUIStates.set(where.tripId, updated);
                    return Promise.resolve(updated);
                }),
            },
            dmConversation: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    if (where.id)
                        return Promise.resolve(this.dmConversations.get(where.id));
                    if (where.participant1_participant2) {
                        for (const conv of this.dmConversations.values()) {
                            if (conv.participant1 === where.participant1_participant2.participant1 &&
                                conv.participant2 === where.participant1_participant2.participant2) {
                                return Promise.resolve(conv);
                            }
                        }
                    }
                    return Promise.resolve(null);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const conv = {
                        id: `dm-${Date.now()}`,
                        ...data,
                        lastMessageAt: new Date(),
                    };
                    this.dmConversations.set(conv.id, conv);
                    return Promise.resolve(conv);
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const conv = this.dmConversations.get(where.id);
                    if (!conv) {
                        // Auto-upsert: create if not exists
                        const newConv = { id: where.id, ...data, lastMessageAt: new Date() };
                        this.dmConversations.set(where.id, newConv);
                        return Promise.resolve(newConv);
                    }
                    const updated = { ...conv, ...data };
                    this.dmConversations.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                findMany: vitest_1.vi.fn(({ where: _where }) => {
                    let result = Array.from(this.dmConversations.values());
                    return Promise.resolve(result);
                }),
            },
            messageReadReceipt: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.messageId_userId.messageId}-${where.messageId_userId.userId}`;
                    return Promise.resolve(this.messageReadReceipts.get(key));
                }),
                upsert: vitest_1.vi.fn(({ where, create, update }) => {
                    const key = `${where.messageId_userId.messageId}-${where.messageId_userId.userId}`;
                    const existing = this.messageReadReceipts.get(key);
                    if (existing) {
                        const updated = { ...existing, ...update };
                        this.messageReadReceipts.set(key, updated);
                        return Promise.resolve(updated);
                    }
                    const receipt = { ...create };
                    this.messageReadReceipts.set(key, receipt);
                    return Promise.resolve(receipt);
                }),
            },
            notificationPreference: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    if (where.userId_category) {
                        const key = `${where.userId_category.userId}-${where.userId_category.category}`;
                        return Promise.resolve(this.notificationPreferences.get(key) || null);
                    }
                    return Promise.resolve(null);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.notificationPreferences.values());
                    if (where?.userId)
                        result = result.filter((p) => p.userId === where.userId);
                    return Promise.resolve(result);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const pref = { id: `pref-${Date.now()}`, ...data };
                    const key = `${data.userId}-${data.category}`;
                    this.notificationPreferences.set(key, pref);
                    return Promise.resolve(pref);
                }),
                createMany: vitest_1.vi.fn(({ data }) => {
                    const created = data.map((d) => {
                        const pref = { id: `pref-${Date.now()}-${Math.random()}`, ...d };
                        const key = `${d.userId}-${d.category}`;
                        this.notificationPreferences.set(key, pref);
                        return pref;
                    });
                    return Promise.resolve({ count: created.length });
                }),
                upsert: vitest_1.vi.fn(({ where, create, update }) => {
                    const key = `${where.userId_category.userId}-${where.userId_category.category}`;
                    const existing = this.notificationPreferences.get(key);
                    if (existing) {
                        const updated = { ...existing, ...update };
                        this.notificationPreferences.set(key, updated);
                        return Promise.resolve(updated);
                    }
                    const pref = { id: `pref-${Date.now()}`, ...create };
                    this.notificationPreferences.set(key, pref);
                    return Promise.resolve(pref);
                }),
            },
            settings: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    if (where.userId)
                        return Promise.resolve(this.settings.get(where.userId));
                    return Promise.resolve(null);
                }),
                upsert: vitest_1.vi.fn(({ where, create, update }) => {
                    const existing = this.settings.get(where.userId);
                    if (existing) {
                        const updated = { ...existing, ...update };
                        this.settings.set(where.userId, updated);
                        return Promise.resolve(updated);
                    }
                    const settings = { ...create };
                    this.settings.set(where.userId, settings);
                    return Promise.resolve(settings);
                }),
            },
            milestone: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.milestones.get(where.id))),
                findFirst: vitest_1.vi.fn(({ where }) => {
                    for (const milestone of this.milestones.values()) {
                        if (where?.tripId && milestone.tripId !== where.tripId)
                            continue;
                        if (where?.type && milestone.type !== where.type)
                            continue;
                        return Promise.resolve(milestone);
                    }
                    return Promise.resolve(null);
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const milestone = {
                        id: `milestone-${Date.now()}`,
                        ...data,
                        isLocked: data.isLocked ?? false,
                        isSkipped: data.isSkipped ?? false,
                        isManualOverride: data.isManualOverride ?? false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    this.milestones.set(milestone.id, milestone);
                    return Promise.resolve(milestone);
                }),
                createMany: vitest_1.vi.fn(({ data }) => {
                    const created = data.map((d) => ({
                        id: `milestone-${Date.now()}-${Math.random()}`,
                        ...d,
                        isLocked: d.isLocked ?? false,
                        isSkipped: d.isSkipped ?? false,
                        isManualOverride: d.isManualOverride ?? false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }));
                    created.forEach((m) => this.milestones.set(m.id, m));
                    return Promise.resolve({ count: created.length });
                }),
                update: vitest_1.vi.fn(({ where, data }) => {
                    const milestone = this.milestones.get(where.id);
                    if (!milestone)
                        return Promise.reject(new Error('Milestone not found'));
                    const updated = { ...milestone, ...data, updatedAt: new Date() };
                    this.milestones.set(where.id, updated);
                    return Promise.resolve(updated);
                }),
                delete: vitest_1.vi.fn(({ where }) => {
                    const milestone = this.milestones.get(where.id);
                    if (!milestone)
                        return Promise.reject(new Error('Milestone not found'));
                    this.milestones.delete(where.id);
                    return Promise.resolve(milestone);
                }),
                deleteMany: vitest_1.vi.fn(({ where }) => {
                    let result = [];
                    if (where?.tripId) {
                        result = Array.from(this.milestones.values()).filter((m) => m.tripId === where.tripId);
                        result.forEach((m) => this.milestones.delete(m.id));
                    }
                    return Promise.resolve({ count: result.length });
                }),
                findMany: vitest_1.vi.fn(({ where, include, orderBy }) => {
                    let result = Array.from(this.milestones.values());
                    if (where?.tripId)
                        result = result.filter((m) => m.tripId === where.tripId);
                    // Handle includes: inject completions and/or user relation
                    if (include) {
                        result = result.map((milestone) => {
                            const enriched = { ...milestone };
                            if (include.completions) {
                                const allCompletions = Array.from(this.milestoneCompletions.values())
                                    .filter((c) => c.milestoneId === milestone.id);
                                const withUser = allCompletions.map((c) => {
                                    const user = c.userId ? this.users.get(c.userId) : undefined;
                                    return {
                                        ...c,
                                        user: user ? { id: user.id, name: user.name, avatarUrl: user.avatarUrl } : undefined,
                                    };
                                });
                                enriched.completions = withUser;
                            }
                            return enriched;
                        });
                    }
                    // Apply orderBy
                    if (orderBy?.priority === 'asc') {
                        result.sort((a, b) => (a.priority || 0) - (b.priority || 0));
                    }
                    if (orderBy?.dueDate === 'asc') {
                        result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
                    }
                    return Promise.resolve(result);
                }),
            },
            milestoneCompletion: {
                findUnique: vitest_1.vi.fn(({ where }) => {
                    const key = `${where.milestoneId_userId.milestoneId}-${where.milestoneId_userId.userId}`;
                    return Promise.resolve(this.milestoneCompletions.get(key));
                }),
                create: vitest_1.vi.fn(({ data }) => {
                    const completion = {
                        id: `mc-${Date.now()}`,
                        ...data,
                        completedAt: data.status === 'COMPLETED' ? new Date() : null,
                    };
                    const key = `${data.milestoneId}-${data.userId}`;
                    this.milestoneCompletions.set(key, completion);
                    return Promise.resolve(completion);
                }),
                upsert: vitest_1.vi.fn(({ where, create, update }) => {
                    const key = `${where.milestoneId_userId.milestoneId}-${where.milestoneId_userId.userId}`;
                    const existing = this.milestoneCompletions.get(key);
                    if (existing) {
                        const updated = { ...existing, ...update, completedAt: update.status === 'COMPLETED' ? new Date() : null };
                        this.milestoneCompletions.set(key, updated);
                        return Promise.resolve(updated);
                    }
                    const completion = { ...create, completedAt: create.status === 'COMPLETED' ? new Date() : null };
                    this.milestoneCompletions.set(key, completion);
                    return Promise.resolve(completion);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.milestoneCompletions.values());
                    if (where?.milestoneId)
                        result = result.filter((c) => c.milestoneId === where.milestoneId);
                    return Promise.resolve(result);
                }),
                deleteMany: vitest_1.vi.fn(({ where }) => {
                    let result = [];
                    const toDelete = [];
                    for (const [key, completion] of this.milestoneCompletions.entries()) {
                        let matches = true;
                        if (where?.milestoneId && completion.milestoneId !== where.milestoneId)
                            matches = false;
                        if (where?.userId?.in && !where.userId.in.includes(completion.userId))
                            matches = false;
                        if (where?.userId && typeof where.userId === 'string' && completion.userId !== where.userId)
                            matches = false;
                        if (matches) {
                            toDelete.push(key);
                            result.push(completion);
                        }
                    }
                    toDelete.forEach((key) => this.milestoneCompletions.delete(key));
                    return Promise.resolve({ count: result.length });
                }),
            },
            milestoneAction: {
                findUnique: vitest_1.vi.fn(({ where }) => Promise.resolve(this.milestoneActions.get(where.id))),
                create: vitest_1.vi.fn(({ data }) => {
                    const action = {
                        id: `ma-${Date.now()}`,
                        ...data,
                        createdAt: new Date(),
                    };
                    this.milestoneActions.set(action.id, action);
                    return Promise.resolve(action);
                }),
                findMany: vitest_1.vi.fn(({ where }) => {
                    let result = Array.from(this.milestoneActions.values());
                    if (where?.tripId)
                        result = result.filter((a) => a.tripId === where.tripId);
                    return Promise.resolve(result);
                }),
            },
            $disconnect: vitest_1.vi.fn(() => Promise.resolve()),
            $connect: vitest_1.vi.fn(() => Promise.resolve()),
            $executeRaw: vitest_1.vi.fn(() => Promise.resolve(0)),
            $queryRaw: vitest_1.vi.fn(() => Promise.resolve([])),
        };
    }
    mockReset() {
        this.users.clear();
        this.trips.clear();
        this.activities.clear();
        this.votes.clear();
        this.members.clear();
        this.messages.clear();
        this.billSplits.clear();
        this.billSplitMembers.clear();
        this.invites.clear();
        this.notifications.clear();
        this.friends.clear();
        this.friendRequests.clear();
        this.mediaItems.clear();
        this.timelineEvents.clear();
        this.dmConversations.clear();
        this.settings.clear();
        this.milestones.clear();
        this.milestoneCompletions.clear();
        this.milestoneActions.clear();
        this.messageReadReceipts.clear();
        this.notificationPreferences.clear();
        this.tripTimelineUIStates.clear();
    }
}
exports.PrismaStub = PrismaStub;
/**
 * SocketStub - Mock of Socket.IO server
 */
class SocketStub {
    rooms = new Map();
    emit = vitest_1.vi.fn();
    to = vitest_1.vi.fn().mockReturnThis();
    in = vitest_1.vi.fn().mockReturnThis();
    getImplementation() {
        return {
            to: this.to,
            in: this.in,
            emit: this.emit,
        };
    }
    mockReset() {
        this.rooms.clear();
        this.emit.mockClear();
    }
}
exports.SocketStub = SocketStub;
/**
 * Factory function to create all stubs
 */
function createStubs() {
    return {
        prisma: new PrismaStub(),
        socket: new SocketStub(),
    };
}
//# sourceMappingURL=stubs.js.map