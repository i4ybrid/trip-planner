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
}

export class PrismaStub {
  private users: Map<string, User> = new Map();
  private trips: Map<string, Trip> = new Map();
  private activities: Map<string, Activity> = new Map();

  user = {
    findUnique: vi.fn((args: { where: { id: string } }) => {
      return Promise.resolve(this.users.get(args.where.id) || null);
    }),
    findFirst: vi.fn(),
    create: vi.fn((args: { data: User }) => {
      const user = { id: crypto.randomUUID(), ...args.data };
      this.users.set(user.id, user);
      return Promise.resolve(user);
    }),
    update: vi.fn((args: { where: { id: string }, data: Partial<User> }) => {
      const user = this.users.get(args.where.id);
      if (!user) return Promise.reject(new Error('User not found'));
      const updated = { ...user, ...args.data };
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

  activity = {
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
  };

  tripMember = {
    create: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    update: vi.fn(),
    delete: vi.fn(),
  };

  invite = {
    create: vi.fn((args: { data: { token: string } }) => {
      return Promise.resolve({
        id: crypto.randomUUID(),
        ...args.data,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });
    }),
    findUnique: vi.fn(),
  };

  notification = {
    create: vi.fn(),
    findMany: vi.fn(() => Promise.resolve([])),
    update: vi.fn(),
  };

  $transaction: any = vi.fn((callback) => callback(this));

  mockReset() {
    this.users.clear();
    this.trips.clear();
    this.activities.clear();
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
