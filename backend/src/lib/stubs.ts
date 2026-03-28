import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';

/**
 * PrismaStub - In-memory mock of PrismaClient for unit testing
 */
export class PrismaStub {
  private users: Map<string, any> = new Map();
  private trips: Map<string, any> = new Map();
  private activities: Map<string, any> = new Map();
  private votes: Map<string, any> = new Map();
  private members: Map<string, any> = new Map();
  private messages: Map<string, any> = new Map();
  private billSplits: Map<string, any> = new Map();
  private billSplitMembers: Map<string, any> = new Map();
  private invites: Map<string, any> = new Map();
  private notifications: Map<string, any> = new Map();
  private friends: Map<string, any> = new Map();
  private friendRequests: Map<string, any> = new Map();
  private mediaItems: Map<string, any> = new Map();
  private timelineEvents: Map<string, any> = new Map();
  private dmConversations: Map<string, any> = new Map();
  private settings: Map<string, any> = new Map();
  private milestones: Map<string, any> = new Map();
  private milestoneCompletions: Map<string, any> = new Map();
  private milestoneActions: Map<string, any> = new Map();
  private messageReadReceipts: Map<string, any> = new Map();
  private notificationPreferences: Map<string, any> = new Map();

  /** Apply Prisma include/select to an activity record */
  private _applyActivityInclude(activity: any, include: any): any {
    const result = { ...activity };
    if (include?.proposer) {
      const user = this.users.get(activity.proposedBy);
      if (include.proposer.select) {
        result.proposer = {};
        if (include.proposer.select.id) result.proposer.id = user?.id;
        if (include.proposer.select.name) result.proposer.name = user?.name;
        if (include.proposer.select.avatarUrl) result.proposer.avatarUrl = user?.avatarUrl;
      } else {
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
            if (include.votes.include.user.select.id) withUser.user.id = voter?.id;
            if (include.votes.include.user.select.name) withUser.user.name = voter?.name;
            if (include.votes.include.user.select.avatarUrl) withUser.user.avatarUrl = voter?.avatarUrl;
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
  private _applyMessageInclude(message: any, include: any): any {
    const result = { ...message };
    if (include?.sender) {
      const user = this.users.get(message.senderId);
      if (include.sender.select) {
        result.sender = {};
        if (include.sender.select.id) result.sender.id = user?.id;
        if (include.sender.select.name) result.sender.name = user?.name;
        if (include.sender.select.avatarUrl) result.sender.avatarUrl = user?.avatarUrl;
      } else {
        result.sender = user;
      }
    }
    if (include?.replyTo) {
      const replyTo = message.replyToId ? this.messages.get(message.replyToId) : null;
      if (include.replyTo.select) {
        result.replyTo = {};
        if (include.replyTo.select.id) result.replyTo.id = replyTo?.id;
        if (include.replyTo.select.content) result.replyTo.content = replyTo?.content;
      } else {
        result.replyTo = replyTo;
      }
    }
    return result;
  }

  getImplementation(): PrismaClient {
    return {
      user: {
        findUnique: vi.fn(({ where }: any) => {
          if (where.id) return Promise.resolve(this.users.get(where.id));
          if (where.email) {
            for (const user of this.users.values()) {
              if (user.email === where.email) return Promise.resolve(user);
            }
          }
          return Promise.resolve(null);
        }),
        create: vi.fn(({ data }: any) => {
          const user = { id: `user-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
          this.users.set(user.id, user);
          return Promise.resolve(user);
        }),
        update: vi.fn(({ where, data }: any) => {
          const user = this.users.get(where.id);
          if (!user) return Promise.reject(new Error('User not found'));
          const updated = { ...user, ...data, updatedAt: new Date() };
          this.users.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const user = this.users.get(where.id);
          if (!user) return Promise.reject(new Error('User not found'));
          this.users.delete(where.id);
          return Promise.resolve(user);
        }),
        findMany: vi.fn(({ where, include: _include }: any) => {
          let result = Array.from(this.users.values());
          if (where?.id) result = result.filter((u) => u.id === where.id);
          return Promise.resolve(result);
        }),
      },
      trip: {
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.trips.get(where.id))),
        create: vi.fn(({ data }: any) => {
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
                role: m.role || 'MEMBER',
                status: m.status || 'INVITED',
                joinedAt: new Date(), 
              };
              const key = `${trip.id}-${m.userId}`;
              this.members.set(key, member);
            }
          }
          return Promise.resolve(trip);
        }),
        upsert: vi.fn(({ where, create, update }: any) => {
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
        update: vi.fn(({ where, data }: any) => {
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
        delete: vi.fn(({ where }: any) => {
          const trip = this.trips.get(where.id);
          if (!trip) return Promise.reject(new Error('Trip not found'));
          this.trips.delete(where.id);
          return Promise.resolve(trip);
        }),
        findMany: vi.fn(({ where: _where, include: _include }: any) => {
          let result = Array.from(this.trips.values());
          return Promise.resolve(result);
        }),
      },
      tripMember: {
        findUnique: vi.fn(({ where }: any) => {
          if (where.tripId_userId) {
            const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
            return Promise.resolve(this.members.get(key));
          }
          return Promise.resolve(null);
        }),
        findFirst: vi.fn(({ where }: any) => {
          for (const member of this.members.values()) {
            if (where?.tripId && member.tripId !== where.tripId) continue;
            if (where?.userId && member.userId !== where.userId) continue;
            if (where?.role && member.role !== where.role) continue;
            if (where?.status && member.status !== where.status) continue;
            return Promise.resolve(member);
          }
          return Promise.resolve(null);
        }),
        create: vi.fn(({ data }: any) => {
          const member = { 
            id: `member-${Date.now()}`, 
            ...data, 
            role: data.role || 'MEMBER',
            status: data.status || 'INVITED',
            joinedAt: new Date(), 
          };
          const key = `${data.tripId}-${data.userId}`;
          this.members.set(key, member);
          return Promise.resolve(member);
        }),
        update: vi.fn(({ where, data }: any) => {
          const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
          const member = this.members.get(key);
          if (!member) return Promise.reject(new Error('Member not found'));
          const updated = { ...member, ...data };
          this.members.set(key, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
          const member = this.members.get(key);
          if (!member) return Promise.reject(new Error('Member not found'));
          this.members.delete(key);
          return Promise.resolve(member);
        }),
        findMany: vi.fn(({ where, include }: any) => {
          let result = Array.from(this.members.values());
          if (where?.tripId) result = result.filter((m) => m.tripId === where.tripId);
          if (where?.status) result = result.filter((m) => m.status === where.status);
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
        findUnique: vi.fn(({ where, include }: any) => {
          const activity = this.activities.get(where.id);
          if (!activity) return Promise.resolve(null);
          return Promise.resolve(this._applyActivityInclude(activity, include));
        }),
        create: vi.fn(({ data }: any) => {
          const activity = { 
            id: `activity-${Date.now()}`, 
            ...data, 
            currency: data.currency || 'USD',
            createdAt: new Date(), 
          };
          this.activities.set(activity.id, activity);
          return Promise.resolve(activity);
        }),
        update: vi.fn(({ where, data }: any) => {
          const activity = this.activities.get(where.id);
          if (!activity) return Promise.reject(new Error('Activity not found'));
          const updated = { ...activity, ...data };
          this.activities.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const activity = this.activities.get(where.id);
          if (!activity) return Promise.reject(new Error('Activity not found'));
          this.activities.delete(where.id);
          return Promise.resolve(activity);
        }),
        findMany: vi.fn(({ where, include, orderBy, take }: any) => {
          let result = Array.from(this.activities.values());
          if (where?.tripId) result = result.filter((a) => a.tripId === where.tripId);
          if (include) {
            result = result.map((a) => this._applyActivityInclude(a, include));
          }
          // Apply orderBy
          if (orderBy?.createdAt === 'desc') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else if (orderBy?.createdAt === 'asc') {
            result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
          if (take !== undefined) result = result.slice(0, take);
          return Promise.resolve(result);
        }),
      },
      vote: {
        findUnique: vi.fn(({ where }: any) => {
          const key = `${where.voteId_userId.activityId}-${where.voteId_userId.userId}`;
          return Promise.resolve(this.votes.get(key));
        }),
        create: vi.fn(({ data }: any) => {
          const vote = { id: `vote-${Date.now()}`, ...data };
          const key = `${data.activityId}-${data.userId}`;
          this.votes.set(key, vote);
          return Promise.resolve(vote);
        }),
        update: vi.fn(({ where, data }: any) => {
          const key = `${where.voteId_userId.activityId}-${where.voteId_userId.userId}`;
          const vote = this.votes.get(key);
          if (!vote) return Promise.reject(new Error('Vote not found'));
          const updated = { ...vote, ...data };
          this.votes.set(key, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const key = `${where.voteId_userId.activityId}-${where.voteId_userId.userId}`;
          const vote = this.votes.get(key);
          if (!vote) return Promise.reject(new Error('Vote not found'));
          this.votes.delete(key);
          return Promise.resolve(vote);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.votes.values());
          if (where?.activityId) result = result.filter((v) => v.activityId === where.activityId);
          return Promise.resolve(result);
        }),
      },
      message: {
        findUnique: vi.fn(({ where, include }: any) => {
          const message = this.messages.get(where.id);
          if (!message) return Promise.resolve(null);
          if (include) return Promise.resolve(this._applyMessageInclude(message, include));
          return Promise.resolve(message);
        }),
        create: vi.fn(({ data }: any) => {
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
        update: vi.fn(({ where, data }: any) => {
          const message = this.messages.get(where.id);
          if (!message) return Promise.reject(new Error('Message not found'));
          const updated = { ...message, ...data, editedAt: data.content ? new Date() : message.editedAt };
          this.messages.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const message = this.messages.get(where.id);
          if (!message) return Promise.reject(new Error('Message not found'));
          this.messages.delete(where.id);
          return Promise.resolve(message);
        }),
        findMany: vi.fn(({ where, include, orderBy, take }: any) => {
          let result = Array.from(this.messages.values());
          if (where?.tripId) result = result.filter((m) => m.tripId === where.tripId);
          if (where?.conversationId) result = result.filter((m) => m.conversationId === where.conversationId);
          if (where?.senderId) result = result.filter((m) => m.senderId === where.senderId);
          if (include) {
            result = result.map((m) => this._applyMessageInclude(m, include));
          }
          // Apply orderBy
          if (orderBy?.createdAt === 'desc') {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          } else if (orderBy?.createdAt === 'asc') {
            result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
          // Apply take (limit) and skip
          if (take !== undefined) result = result.slice(0, take);
          if (where?.skip !== undefined) result = result.slice(where.skip);
          return Promise.resolve(result);
        }),
      },
      billSplit: {
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.billSplits.get(where.id))),
        create: vi.fn(({ data }: any) => {
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
        update: vi.fn(({ where, data }: any) => {
          const billSplit = this.billSplits.get(where.id);
          if (!billSplit) return Promise.reject(new Error('BillSplit not found'));
          const updated = { ...billSplit, ...data, updatedAt: new Date() };
          this.billSplits.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const billSplit = this.billSplits.get(where.id);
          if (!billSplit) return Promise.reject(new Error('BillSplit not found'));
          this.billSplits.delete(where.id);
          return Promise.resolve(billSplit);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.billSplits.values());
          if (where?.tripId) result = result.filter((b) => b.tripId === where.tripId);
          return Promise.resolve(result);
        }),
      },
      billSplitMember: {
        findUnique: vi.fn(({ where }: any) => {
          const key = `${where.billSplitId_userId.billSplitId}-${where.billSplitId_userId.userId}`;
          return Promise.resolve(this.billSplitMembers.get(key));
        }),
        create: vi.fn(({ data }: any) => {
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
        update: vi.fn(({ where, data }: any) => {
          const key = `${where.billSplitId_userId.billSplitId}-${where.billSplitId_userId.userId}`;
          const member = this.billSplitMembers.get(key);
          if (!member) return Promise.reject(new Error('BillSplitMember not found'));
          const updated = { ...member, ...data };
          this.billSplitMembers.set(key, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const key = `${where.billSplitId_userId.billSplitId}-${where.billSplitId_userId.userId}`;
          const member = this.billSplitMembers.get(key);
          if (!member) return Promise.reject(new Error('BillSplitMember not found'));
          this.billSplitMembers.delete(key);
          return Promise.resolve(member);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.billSplitMembers.values());
          if (where?.billSplitId) result = result.filter((m) => m.billSplitId === where.billSplitId);
          return Promise.resolve(result);
        }),
      },
      invite: {
        findUnique: vi.fn(({ where }: any) => {
          if (where.token) {
            for (const invite of this.invites.values()) {
              if (invite.token === where.token) return Promise.resolve(invite);
            }
          }
          if (where.id) return Promise.resolve(this.invites.get(where.id));
          return Promise.resolve(null);
        }),
        create: vi.fn(({ data }: any) => {
          const invite = { 
            id: `invite-${Date.now()}`, 
            ...data, 
            status: data.status || 'PENDING',
            createdAt: new Date(), 
          };
          this.invites.set(invite.id, invite);
          return Promise.resolve(invite);
        }),
        update: vi.fn(({ where, data }: any) => {
          const invite = this.invites.get(where.id);
          if (!invite) return Promise.reject(new Error('Invite not found'));
          const updated = { ...invite, ...data };
          this.invites.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.invites.values());
          if (where?.tripId) result = result.filter((i) => i.tripId === where.tripId);
          return Promise.resolve(result);
        }),
      },
      notification: {
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.notifications.get(where.id))),
        create: vi.fn(({ data }: any) => {
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
        update: vi.fn(({ where, data }: any) => {
          const notification = this.notifications.get(where.id);
          if (!notification) return Promise.reject(new Error('Notification not found'));
          const updated = { ...notification, ...data };
          this.notifications.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const notification = this.notifications.get(where.id);
          if (!notification) return Promise.reject(new Error('Notification not found'));
          this.notifications.delete(where.id);
          return Promise.resolve(notification);
        }),
        findMany: vi.fn(({ where, include, orderBy, take }: any) => {
          let result = Array.from(this.notifications.values());
          if (where?.userId) result = result.filter((n) => n.userId === where.userId);
          // Handle includes: inject trip relation (supports include.trip or include.trip.select)
          if (include?.trip) {
            result = result.map((n) => {
              const trip = n.tripId ? this.trips.get(n.tripId) : undefined;
              if (include.trip.select) {
                // Prisma uses select to pick specific fields
                const selected: any = {};
                if (include.trip.select.id) selected.id = trip?.id;
                if (include.trip.select.name) selected.name = trip?.name;
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
          } else if (orderBy?.createdAt === 'asc') {
            result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
          // Apply take (limit)
          if (take !== undefined) {
            result = result.slice(0, take);
          }
          return Promise.resolve(result);
        }),
        count: vi.fn(({ where }: any) => {
          let result = Array.from(this.notifications.values());
          if (where?.userId) result = result.filter((n) => n.userId === where.userId);
          if (where?.read === false) result = result.filter((n) => !n.read);
          return Promise.resolve(result.length);
        }),
        updateMany: vi.fn(({ where, data }: any) => {
          let result: any[] = [];
          let count = 0;
          this.notifications.forEach((notification, id) => {
            let matches = true;
            if (where?.userId && notification.userId !== where.userId) matches = false;
            if (where?.read === false && notification.read !== false) matches = false;
            if (where?.read === true && notification.read !== true) matches = false;
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
        findUnique: vi.fn(({ where }: any) => {
          const key = `${where.userId}-${where.friendId}`;
          return Promise.resolve(this.friends.get(key));
        }),
        findFirst: vi.fn(({ where }: any) => {
          for (const friend of this.friends.values()) {
            if (where.userId && friend.userId !== where.userId) continue;
            if (where.friendId && friend.friendId !== where.friendId) continue;
            return Promise.resolve(friend);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.friends.values());
          if (where?.userId) result = result.filter((f) => f.userId === where.userId);
          return Promise.resolve(result);
        }),
        create: vi.fn(({ data }: any) => {
          const friend = { id: `friend-${Date.now()}`, ...data, createdAt: new Date() };
          const key = `${data.userId}-${data.friendId}`;
          this.friends.set(key, friend);
          return Promise.resolve(friend);
        }),
        deleteMany: vi.fn(({ where }: any) => {
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
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.friendRequests.get(where.id))),
        findFirst: vi.fn(({ where }: any) => {
          for (const request of this.friendRequests.values()) {
            if (where.senderId && request.senderId !== where.senderId) continue;
            if (where.receiverId && request.receiverId !== where.receiverId) continue;
            if (where.status && request.status !== where.status) continue;
            return Promise.resolve(request);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.friendRequests.values());
          if (where?.senderId) result = result.filter((r) => r.senderId === where.senderId);
          if (where?.receiverId) result = result.filter((r) => r.receiverId === where.receiverId);
          if (where?.status) result = result.filter((r) => r.status === where.status);
          return Promise.resolve(result);
        }),
        create: vi.fn(({ data }: any) => {
          const request = { 
            id: `fr-${Date.now()}`, 
            ...data, 
            status: data.status || 'PENDING',
            createdAt: new Date(), 
          };
          this.friendRequests.set(request.id, request);
          return Promise.resolve(request);
        }),
        update: vi.fn(({ where, data }: any) => {
          const request = this.friendRequests.get(where.id);
          if (!request) return Promise.reject(new Error('FriendRequest not found'));
          const updated = { ...request, ...data, respondedAt: data.status ? new Date() : undefined };
          this.friendRequests.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const request = this.friendRequests.get(where.id);
          if (!request) return Promise.reject(new Error('FriendRequest not found'));
          this.friendRequests.delete(where.id);
          return Promise.resolve(request);
        }),
      },
      mediaItem: {
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.mediaItems.get(where.id))),
        create: vi.fn(({ data }: any) => {
          const media = { 
            id: `media-${Date.now()}`, 
            ...data, 
            createdAt: new Date(), 
          };
          this.mediaItems.set(media.id, media);
          return Promise.resolve(media);
        }),
        delete: vi.fn(({ where }: any) => {
          const media = this.mediaItems.get(where.id);
          if (!media) return Promise.reject(new Error('MediaItem not found'));
          this.mediaItems.delete(where.id);
          return Promise.resolve(media);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.mediaItems.values());
          if (where?.tripId) result = result.filter((m) => m.tripId === where.tripId);
          return Promise.resolve(result);
        }),
      },
      timelineEvent: {
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.timelineEvents.get(where.id))),
        create: vi.fn(({ data }: any) => {
          const event = { 
            id: `event-${Date.now()}`, 
            ...data, 
            createdAt: new Date(), 
          };
          this.timelineEvents.set(event.id, event);
          return Promise.resolve(event);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.timelineEvents.values());
          if (where?.tripId) result = result.filter((e) => e.tripId === where.tripId);
          return Promise.resolve(result);
        }),
      },
      dmConversation: {
        findUnique: vi.fn(({ where }: any) => {
          if (where.id) return Promise.resolve(this.dmConversations.get(where.id));
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
        create: vi.fn(({ data }: any) => {
          const conv = { 
            id: `dm-${Date.now()}`, 
            ...data, 
            lastMessageAt: new Date(), 
          };
          this.dmConversations.set(conv.id, conv);
          return Promise.resolve(conv);
        }),
        update: vi.fn(({ where, data }: any) => {
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
        findMany: vi.fn(({ where: _where }: any) => {
          let result = Array.from(this.dmConversations.values());
          return Promise.resolve(result);
        }),
      },
      messageReadReceipt: {
        findUnique: vi.fn(({ where }: any) => {
          const key = `${where.messageId_userId.messageId}-${where.messageId_userId.userId}`;
          return Promise.resolve(this.messageReadReceipts.get(key));
        }),
        upsert: vi.fn(({ where, create, update }: any) => {
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
        findUnique: vi.fn(({ where }: any) => {
          if (where.userId_category) {
            const key = `${where.userId_category.userId}-${where.userId_category.category}`;
            return Promise.resolve(this.notificationPreferences.get(key) || null);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.notificationPreferences.values());
          if (where?.userId) result = result.filter((p) => p.userId === where.userId);
          return Promise.resolve(result);
        }),
        create: vi.fn(({ data }: any) => {
          const pref = { id: `pref-${Date.now()}`, ...data };
          const key = `${data.userId}-${data.category}`;
          this.notificationPreferences.set(key, pref);
          return Promise.resolve(pref);
        }),
        createMany: vi.fn(({ data }: any) => {
          const created = data.map((d: any) => {
            const pref = { id: `pref-${Date.now()}-${Math.random()}`, ...d };
            const key = `${d.userId}-${d.category}`;
            this.notificationPreferences.set(key, pref);
            return pref;
          });
          return Promise.resolve({ count: created.length });
        }),
        upsert: vi.fn(({ where, create, update }: any) => {
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
        findUnique: vi.fn(({ where }: any) => {
          if (where.userId) return Promise.resolve(this.settings.get(where.userId));
          return Promise.resolve(null);
        }),
        upsert: vi.fn(({ where, create, update }: any) => {
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
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.milestones.get(where.id))),
        findFirst: vi.fn(({ where }: any) => {
          for (const milestone of this.milestones.values()) {
            if (where?.tripId && milestone.tripId !== where.tripId) continue;
            if (where?.type && milestone.type !== where.type) continue;
            return Promise.resolve(milestone);
          }
          return Promise.resolve(null);
        }),
        create: vi.fn(({ data }: any) => {
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
        createMany: vi.fn(({ data }: any) => {
          const created = data.map((d: any) => ({
            id: `milestone-${Date.now()}-${Math.random()}`,
            ...d,
            isLocked: d.isLocked ?? false,
            isSkipped: d.isSkipped ?? false,
            isManualOverride: d.isManualOverride ?? false,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
          created.forEach((m: any) => this.milestones.set(m.id, m));
          return Promise.resolve({ count: created.length });
        }),
        update: vi.fn(({ where, data }: any) => {
          const milestone = this.milestones.get(where.id);
          if (!milestone) return Promise.reject(new Error('Milestone not found'));
          const updated = { ...milestone, ...data, updatedAt: new Date() };
          this.milestones.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        delete: vi.fn(({ where }: any) => {
          const milestone = this.milestones.get(where.id);
          if (!milestone) return Promise.reject(new Error('Milestone not found'));
          this.milestones.delete(where.id);
          return Promise.resolve(milestone);
        }),
        deleteMany: vi.fn(({ where }: any) => {
          let result: any[] = [];
          if (where?.tripId) {
            result = Array.from(this.milestones.values()).filter((m) => m.tripId === where.tripId);
            result.forEach((m) => this.milestones.delete(m.id));
          }
          return Promise.resolve({ count: result.length });
        }),
        findMany: vi.fn(({ where, include, orderBy }: any) => {
          let result = Array.from(this.milestones.values());
          if (where?.tripId) result = result.filter((m) => m.tripId === where.tripId);
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
                (enriched as any).completions = withUser;
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
        findUnique: vi.fn(({ where }: any) => {
          const key = `${where.milestoneId_userId.milestoneId}-${where.milestoneId_userId.userId}`;
          return Promise.resolve(this.milestoneCompletions.get(key));
        }),
        create: vi.fn(({ data }: any) => {
          const completion = {
            id: `mc-${Date.now()}`,
            ...data,
            completedAt: data.status === 'COMPLETED' ? new Date() : null,
          };
          const key = `${data.milestoneId}-${data.userId}`;
          this.milestoneCompletions.set(key, completion);
          return Promise.resolve(completion);
        }),
        upsert: vi.fn(({ where, create, update }: any) => {
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
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.milestoneCompletions.values());
          if (where?.milestoneId) result = result.filter((c) => c.milestoneId === where.milestoneId);
          return Promise.resolve(result);
        }),
        deleteMany: vi.fn(({ where }: any) => {
          let result: any[] = [];
          const toDelete: string[] = [];
          for (const [key, completion] of this.milestoneCompletions.entries()) {
            let matches = true;
            if (where?.milestoneId && completion.milestoneId !== where.milestoneId) matches = false;
            if (where?.userId?.in && !where.userId.in.includes(completion.userId)) matches = false;
            if (where?.userId && typeof where.userId === 'string' && completion.userId !== where.userId) matches = false;
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
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.milestoneActions.get(where.id))),
        create: vi.fn(({ data }: any) => {
          const action = {
            id: `ma-${Date.now()}`,
            ...data,
            createdAt: new Date(),
          };
          this.milestoneActions.set(action.id, action);
          return Promise.resolve(action);
        }),
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.milestoneActions.values());
          if (where?.tripId) result = result.filter((a) => a.tripId === where.tripId);
          return Promise.resolve(result);
        }),
      },
      $disconnect: vi.fn(() => Promise.resolve()),
      $connect: vi.fn(() => Promise.resolve()),
      $executeRaw: vi.fn(() => Promise.resolve(0)),
      $queryRaw: vi.fn(() => Promise.resolve([])),
    } as unknown as PrismaClient;
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
  }
}

/**
 * SocketStub - Mock of Socket.IO server
 */
export class SocketStub {
  private rooms: Map<string, Set<string>> = new Map();
  emit = vi.fn();
  to = vi.fn().mockReturnThis();
  in = vi.fn().mockReturnThis();

  getImplementation() {
    return {
      to: this.to,
      in: this.in,
      emit: this.emit,
    } as any;
  }

  mockReset() {
    this.rooms.clear();
    this.emit.mockClear();
  }
}

/**
 * Factory function to create all stubs
 */
export function createStubs() {
  return {
    prisma: new PrismaStub(),
    socket: new SocketStub(),
  };
}
