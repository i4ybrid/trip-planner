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
          const trip = { 
            id: `trip-${Date.now()}`, 
            ...data, 
            status: data.status || 'IDEA',
            createdAt: new Date(), 
            updatedAt: new Date(), 
          };
          this.trips.set(trip.id, trip);
          return Promise.resolve(trip);
        }),
        update: vi.fn(({ where, data }: any) => {
          const trip = this.trips.get(where.id);
          if (!trip) return Promise.reject(new Error('Trip not found'));
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
        findMany: vi.fn(({ where: _where }: any) => {
          let result = Array.from(this.trips.values());
          return Promise.resolve(result);
        }),
      },
      tripMember: {
        findUnique: vi.fn(({ where }: any) => {
          const key = `${where.tripId_userId.tripId}-${where.tripId_userId.userId}`;
          return Promise.resolve(this.members.get(key));
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
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.members.values());
          if (where?.tripId) result = result.filter((m) => m.tripId === where.tripId);
          return Promise.resolve(result);
        }),
      },
      activity: {
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.activities.get(where.id))),
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
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.activities.values());
          if (where?.tripId) result = result.filter((a) => a.tripId === where.tripId);
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
        findUnique: vi.fn(({ where }: any) => Promise.resolve(this.messages.get(where.id))),
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
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.messages.values());
          if (where?.tripId) result = result.filter((m) => m.tripId === where.tripId);
          if (where?.conversationId) result = result.filter((m) => m.conversationId === where.conversationId);
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
        findMany: vi.fn(({ where }: any) => {
          let result = Array.from(this.notifications.values());
          if (where?.userId) result = result.filter((n) => n.userId === where.userId);
          return Promise.resolve(result);
        }),
        count: vi.fn(({ where }: any) => {
          let result = Array.from(this.notifications.values());
          if (where?.userId) result = result.filter((n) => n.userId === where.userId);
          if (where?.read === false) result = result.filter((n) => !n.read);
          return Promise.resolve(result.length);
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
          if (!conv) return Promise.reject(new Error('DmConversation not found'));
          const updated = { ...conv, ...data };
          this.dmConversations.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        findMany: vi.fn(({ where: _where }: any) => {
          let result = Array.from(this.dmConversations.values());
          return Promise.resolve(result);
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
