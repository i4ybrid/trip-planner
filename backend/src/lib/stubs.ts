import { vi } from 'vitest';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  venmo?: string;
  paypal?: string;
  zelle?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: Date;
  endDate?: Date;
  coverImage?: string;
  status: 'IDEA' | 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  tripMasterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: 'MASTER' | 'ORGANIZER' | 'MEMBER' | 'VIEWER';
  status: 'INVITED' | 'DECLINED' | 'MAYBE' | 'CONFIRMED' | 'REMOVED';
  paymentStatus?: string;
  paymentAmount?: number;
  joinedAt: Date;
  trip?: Trip;
  user?: User;
}

export interface Activity {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  cost?: number;
  currency: string;
  category: string;
  proposedBy: string;
  votes?: Vote[];
}

export interface Vote {
  id: string;
  activityId: string;
  userId: string;
  option: 'yes' | 'no' | 'maybe';
}

export interface Invite {
  id: string;
  tripId: string;
  token: string;
  email?: string;
  phone?: string;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  expiresAt: Date;
  sentById: string;
}

export interface TripMessage {
  id: string;
  tripId: string;
  userId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  tripId?: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

export class PrismaStub {
  private users: Map<string, User> = new Map();
  private trips: Map<string, Trip> = new Map();
  private tripMembers: Map<string, TripMember> = new Map();
  private activities: Map<string, Activity> = new Map();
  private invites: Map<string, Invite> = new Map();
  private messages: Map<string, TripMessage> = new Map();
  private notifications: Map<string, Notification> = new Map();

  user = {
    findUnique: vi.fn((args: { where: { id: string } }) => {
      return Promise.resolve(this.users.get(args.where.id) || null);
    }),
    findFirst: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([...this.users.values()])),
    create: vi.fn((args: { data: Omit<User, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const user = { 
        id: crypto.randomUUID(), 
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(user.id, user);
      return Promise.resolve(user);
    }),
    update: vi.fn((args: { where: { id: string }, data: Partial<User> }) => {
      const user = this.users.get(args.where.id);
      if (!user) return Promise.reject(new Error('User not found'));
      const updated = { ...user, ...args.data, updatedAt: new Date() };
      this.users.set(updated.id, updated);
      return Promise.resolve(updated);
    }),
    delete: vi.fn((args: { where: { id: string } }) => {
      this.users.delete(args.where.id);
      return Promise.resolve(true);
    }),
  };

  trip = {
    findUnique: vi.fn((args: { where: { id: string } }) => {
      return Promise.resolve(this.trips.get(args.where.id) || null);
    }),
    findMany: vi.fn(() => {
      return Promise.resolve([...this.trips.values()]);
    }),
    create: vi.fn((args: { data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'> }) => {
      const trip = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.trips.set(trip.id, trip);
      return Promise.resolve(trip);
    }),
    update: vi.fn((args: { where: { id: string }, data: Partial<Trip> }) => {
      const trip = this.trips.get(args.where.id);
      if (!trip) return Promise.reject(new Error('Trip not found'));
      const updated = { ...trip, ...args.data, updatedAt: new Date() };
      this.trips.set(updated.id, updated);
      return Promise.resolve(updated);
    }),
    delete: vi.fn((args: { where: { id: string } }) => {
      this.trips.delete(args.where.id);
      return Promise.resolve(true);
    }),
  };

  tripMember = {
    findUnique: vi.fn(),
    findMany: vi.fn((args?: { where?: { userId?: string; tripId?: string } }) => {
      const members = [...this.tripMembers.values()];
      if (args?.where?.userId) {
        return Promise.resolve(members.filter(m => m.userId === args.where!.userId));
      }
      if (args?.where?.tripId) {
        return Promise.resolve(members.filter(m => m.tripId === args.where!.tripId));
      }
      return Promise.resolve(members);
    }),
    create: vi.fn((args: { data: Omit<TripMember, 'id' | 'joinedAt'> }) => {
      const member = {
        id: crypto.randomUUID(),
        ...args.data,
        joinedAt: new Date(),
      };
      this.tripMembers.set(member.id, member);
      return Promise.resolve(member);
    }),
    update: vi.fn(),
    delete: vi.fn(),
  };

  activity = {
    findUnique: vi.fn(),
    findMany: vi.fn((args?: { where?: { tripId: string } }) => {
      const activities = [...this.activities.values()];
      if (args?.where?.tripId) {
        return Promise.resolve(activities.filter(a => a.tripId === args.where!.tripId));
      }
      return Promise.resolve(activities);
    }),
    create: vi.fn((args: { data: Omit<Activity, 'id'> }) => {
      const activity = { id: crypto.randomUUID(), ...args.data };
      this.activities.set(activity.id, activity);
      return Promise.resolve(activity);
    }),
    update: vi.fn(),
    delete: vi.fn(),
  };

  vote = {
    findMany: vi.fn(() => Promise.resolve([])),
    create: vi.fn(),
    delete: vi.fn(),
  };

  invite = {
    findUnique: vi.fn((args: { where: { token: string } }) => {
      const invite = [...this.invites.values()].find(i => i.token === args.where.token);
      return Promise.resolve(invite || null);
    }),
    findMany: vi.fn(() => Promise.resolve([...this.invites.values()])),
    create: vi.fn((args: { data: Omit<Invite, 'id' | 'createdAt'> }) => {
      const invite = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date(),
      };
      this.invites.set(invite.id, invite);
      return Promise.resolve(invite);
    }),
    update: vi.fn(),
    delete: vi.fn(),
  };

  tripMessage = {
    findMany: vi.fn(() => Promise.resolve([...this.messages.values()])),
    create: vi.fn((args: { data: Omit<TripMessage, 'id' | 'createdAt'> }) => {
      const message = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date(),
      };
      this.messages.set(message.id, message);
      return Promise.resolve(message);
    }),
    delete: vi.fn(),
  };

  notification = {
    findMany: vi.fn(() => Promise.resolve([...this.notifications.values()])),
    create: vi.fn(),
    update: vi.fn(),
  };

  $transaction: any = vi.fn((callback: any) => callback(this));

  mockReset() {
    this.users.clear();
    this.trips.clear();
    this.tripMembers.clear();
    this.activities.clear();
    this.invites.clear();
    this.messages.clear();
    this.notifications.clear();
    vi.clearAllMocks();
  }
}

export class SocketStub {
  private rooms: Map<string, Set<string>> = new Map();

  to = vi.fn().mockReturnThis();
  in = vi.fn().mockReturnThis();
  emit = vi.fn();
  emitAsync = vi.fn().mockResolvedValue(undefined);
  disconnect = vi.fn();
  on = vi.fn();
  off = vi.fn();

  mockReset() {
    vi.clearAllMocks();
    this.rooms.clear();
  }
}

export class SendGridStub {
  emails: Array<{ to: string; subject: string; html?: string; text?: string }> = [];

  send = vi.fn(async (msg: { to: string; subject: string; html?: string; text?: string }) => {
    this.emails.push(msg);
    return [{ statusCode: 202, messageId: 'test-message-id' }];
  });

  mockReset() {
    this.emails = [];
    vi.clearAllMocks();
  }
}

export class S3Stub {
  uploads: Array<{ key: string; body: Buffer }> = [];
  signedUrls: string[] = [];

  upload = vi.fn(async (params: { Key: string; Body: Buffer }) => {
    this.uploads.push({ key: params.Key, body: params.Body });
    return {
      Location: `https://test-bucket.s3.amazonaws.com/${params.Key}`,
      Key: params.Key,
    };
  });

  getSignedUrl = vi.fn(() => {
    const url = `https://test-bucket.s3.amazonaws.com/signed/${crypto.randomUUID()}`;
    this.signedUrls.push(url);
    return url;
  });

  mockReset() {
    this.uploads = [];
    this.signedUrls = [];
    vi.clearAllMocks();
  }
}

export function createStubs() {
  return {
    prisma: new PrismaStub(),
    socket: new SocketStub(),
    sendGrid: new SendGridStub(),
    s3: new S3Stub(),
  };
}

export type Stubs = ReturnType<typeof createStubs>;
