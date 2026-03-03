import {
  Trip,
  TripMember,
  Activity,
  Vote,
  Invite,
  Booking,
  TripMessage,
  DirectMessage,
  MediaItem,
  Notification,
  User,
  CreateTripInput,
  UpdateTripInput,
  CreateActivityInput,
  CreateInviteInput,
  SendMessageInput,
  TripEvent,
  Settlement,
  Album,
  CreateAlbumInput,
  ApiResponse,
} from '@/types';
import { ApiService } from './api';

const generateId = () => crypto.randomUUID();

const SEED_USERS: User[] = [
  { id: 'user-1', email: 'test@example.com', name: 'Test User', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-2', email: 'sarah@example.com', name: 'Sarah Chen', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-3', email: 'mike@example.com', name: 'Mike Johnson', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-4', email: 'emma@example.com', name: 'Emma Wilson', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', userId: 'user-1', tripId: 'trip-1', type: 'reminder', title: 'Trip coming up!', body: 'Hawaii Beach Vacation starts in 2 weeks', actionUrl: '/trip/trip-1', read: false, createdAt: '2026-02-15T10:00:00Z' },
  { id: 'notif-2', userId: 'user-1', tripId: 'trip-1', type: 'vote', title: 'Vote needed', body: 'Vote on Surfing Lessons activity for Hawaii trip', actionUrl: '/trip/trip-1', read: false, createdAt: '2026-02-14T15:00:00Z' },
  { id: 'notif-3', userId: 'user-1', tripId: 'trip-1', type: 'payment', title: 'Payment needed', body: 'You owe $120 for Luau Dinner - please pay Sarah', actionUrl: '/trip/trip-1', read: false, createdAt: '2026-02-13T09:00:00Z' },
  { id: 'notif-4', userId: 'user-1', tripId: 'trip-1', type: 'milestone', title: 'Activity booked!', body: 'Hotel: Grand Wailea has been confirmed!', actionUrl: '/trip/trip-1', read: true, createdAt: '2026-02-01T15:00:00Z' },
  { id: 'notif-5', userId: 'user-1', tripId: 'trip-2', type: 'reminder', title: 'Trip this weekend!', body: 'NYC Birthday Weekend is this weekend - have fun!', actionUrl: '/trip/trip-2', read: true, createdAt: '2026-04-15T10:00:00Z' },
  { id: 'notif-6', userId: 'user-1', tripId: 'trip-5', type: 'message', title: 'Tagged in chat', body: 'Sarah mentioned you in the Nashville trip chat', actionUrl: '/trip/trip-5', read: false, createdAt: '2026-02-18T20:00:00Z' },
  { id: 'notif-7', userId: 'user-1', tripId: 'trip-1', type: 'invite', title: 'New member joined', body: 'Emma Wilson joined Hawaii Beach Vacation', actionUrl: '/trip/trip-1', read: true, createdAt: '2026-01-18T09:00:00Z' },
  { id: 'notif-8', userId: 'user-1', tripId: 'trip-5', type: 'reminder', title: 'Trip happening now!', body: 'Your Nashville trip is happening right now!', actionUrl: '/trip/trip-5', read: false, createdAt: '2026-02-18T08:00:00Z' },
];

const SEED_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    name: 'Hawaii Beach Vacation',
    description: 'Week-long adventure in paradise!',
    destination: 'Maui, Hawaii',
    startDate: '2026-06-15T00:00:00Z',
    endDate: '2026-06-22T00:00:00Z',
    status: 'PLANNING',
    tripMasterId: 'user-1',
    coverImage: 'https://images.unsplash.com/photo-1505852679233-d9fd70aff56d?w=800',
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'trip-2',
    name: 'NYC Birthday Weekend',
    description: 'Celebrating Sarah\'s birthday in the city!',
    destination: 'New York City, NY',
    startDate: '2026-04-18T00:00:00Z',
    endDate: '2026-04-20T00:00:00Z',
    status: 'CONFIRMED',
    tripMasterId: 'user-2',
    coverImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800',
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-02-10T00:00:00Z',
  },
  {
    id: 'trip-3',
    name: 'European Adventure',
    description: 'Exploring the best of Europe - Paris, Rome, Barcelona!',
    destination: 'Europe',
    startDate: '2026-09-01T00:00:00Z',
    endDate: '2026-09-14T00:00:00Z',
    status: 'IDEA',
    tripMasterId: 'user-1',
    coverImage: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'trip-4',
    name: 'Ski Trip 2025',
    description: 'Epic ski weekend in the mountains!',
    destination: 'Aspen, Colorado',
    startDate: '2025-12-20T00:00:00Z',
    endDate: '2025-12-23T00:00:00Z',
    status: 'COMPLETED',
    tripMasterId: 'user-3',
    coverImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2025-12-24T00:00:00Z',
  },
  {
    id: 'trip-5',
    name: 'Happening',
    description: 'Trip in progress - adding photos and videos!',
    destination: 'Nashville, Tennessee',
    startDate: '2026-02-18T00:00:00Z',
    endDate: '2026-02-22T00:00:00Z',
    status: 'HAPPENING',
    tripMasterId: 'user-2',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-02-18T08:00:00Z',
  },
];

const SEED_MEMBERS: TripMember[] = [
  { id: 'm1', tripId: 'trip-1', userId: 'user-1', role: 'MASTER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2026-01-15T00:00:00Z' },
  { id: 'm2', tripId: 'trip-1', userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED', paymentStatus: 'pending', joinedAt: '2026-01-16T00:00:00Z' },
  { id: 'm3', tripId: 'trip-1', userId: 'user-3', role: 'MEMBER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2026-01-17T00:00:00Z' },
  { id: 'm4', tripId: 'trip-1', userId: 'user-4', role: 'MEMBER', status: 'MAYBE', joinedAt: '2026-01-18T00:00:00Z' },
  { id: 'm5', tripId: 'trip-2', userId: 'user-2', role: 'MASTER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2026-01-20T00:00:00Z' },
  { id: 'm6', tripId: 'trip-2', userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2026-01-21T00:00:00Z' },
  { id: 'm7', tripId: 'trip-3', userId: 'user-1', role: 'MASTER', status: 'CONFIRMED', joinedAt: '2026-02-01T00:00:00Z' },
  { id: 'm8', tripId: 'trip-4', userId: 'user-3', role: 'MASTER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2025-10-01T00:00:00Z' },
  { id: 'm9', tripId: 'trip-4', userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2025-10-02T00:00:00Z' },
  { id: 'm10', tripId: 'trip-4', userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2025-10-03T00:00:00Z' },
  { id: 'm11', tripId: 'trip-5', userId: 'user-2', role: 'MASTER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2026-01-25T10:00:00Z' },
  { id: 'm12', tripId: 'trip-5', userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED', paymentStatus: 'paid', joinedAt: '2026-01-25T11:00:00Z' },
  { id: 'm13', tripId: 'trip-5', userId: 'user-4', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2026-01-26T09:00:00Z' },
];

const SEED_ACTIVITIES: Activity[] = [
  { id: 'act-1', tripId: 'trip-1', title: 'Surfing Lessons', description: '2-hour beginner surf lesson at Waikiki Beach', location: 'Waikiki Beach', cost: 75, currency: 'USD', category: 'activity', proposedBy: 'user-1', createdAt: '2026-01-20T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-2', tripId: 'trip-1', title: 'Road to Hana', description: 'Full day guided tour along the famous Road to Hana', location: 'Maui', cost: 150, currency: 'USD', category: 'attraction', proposedBy: 'user-2', createdAt: '2026-01-22T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-3', tripId: 'trip-1', title: 'Luau Dinner', description: 'Traditional Hawaiian luau with dinner and show', location: 'Grand Wailea', cost: 120, currency: 'USD', category: 'restaurant', proposedBy: 'user-3', createdAt: '2026-01-25T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-4', tripId: 'trip-1', title: 'Hotel: Grand Wailea', description: 'Luxury resort booking', location: 'Maui', cost: 450, currency: 'USD', category: 'hotel', proposedBy: 'user-1', createdAt: '2026-01-18T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-5', tripId: 'trip-2', title: 'Broadway Show', description: 'Hamilton on Broadway!', location: 'Broadway, NYC', cost: 200, currency: 'USD', category: 'activity', proposedBy: 'user-2', createdAt: '2026-01-25T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-6', tripId: 'trip-2', title: 'Hotel: Manhattan Club', description: 'Manhattan boutique hotel', location: 'Manhattan', cost: 300, currency: 'USD', category: 'hotel', proposedBy: 'user-1', createdAt: '2026-01-22T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-7', tripId: 'trip-3', title: 'Eiffel Tower Visit', description: 'Skip-the-line tickets', location: 'Paris', cost: 50, currency: 'EUR', category: 'attraction', proposedBy: 'user-1', createdAt: '2026-02-01T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
  { id: 'act-8', tripId: 'trip-3', title: 'Colosseum Tour', description: 'Guided tour of the Colosseum', location: 'Rome', cost: 60, currency: 'EUR', category: 'attraction', proposedBy: 'user-1', createdAt: '2026-02-01T00:00:00Z', status: 'OPEN', votingEndsAt: undefined },
];

const SEED_VOTES: Vote[] = [
  { id: 'v1', activityId: 'act-1', userId: 'user-1', option: 'yes' },
  { id: 'v2', activityId: 'act-1', userId: 'user-2', option: 'yes' },
  { id: 'v3', activityId: 'act-1', userId: 'user-3', option: 'maybe' },
  { id: 'v4', activityId: 'act-2', userId: 'user-1', option: 'yes' },
  { id: 'v5', activityId: 'act-2', userId: 'user-2', option: 'yes' },
  { id: 'v6', activityId: 'act-3', userId: 'user-1', option: 'yes' },
  { id: 'v7', activityId: 'act-3', userId: 'user-2', option: 'no' },
  { id: 'v8', activityId: 'act-4', userId: 'user-1', option: 'yes' },
  { id: 'v9', activityId: 'act-4', userId: 'user-2', option: 'yes' },
  { id: 'v10', activityId: 'act-4', userId: 'user-3', option: 'yes' },
  { id: 'v11', activityId: 'act-5', userId: 'user-1', option: 'yes' },
];

const SEED_MESSAGES: TripMessage[] = [
  { id: 'msg-1', tripId: 'trip-1', userId: 'user-1', content: 'Hey everyone, looking forward to Hawaii!', messageType: 'TEXT', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'msg-2', tripId: 'trip-1', userId: 'user-2', content: 'Same here! I just added some surfing lessons.', messageType: 'TEXT', createdAt: '2026-01-15T11:00:00Z' },
];

const SEED_EVENTS: TripEvent[] = [
  { id: 'e1', tripId: 'trip-1', userId: 'user-1', type: 'TRIP_CREATED', description: 'created the trip', createdAt: '2026-01-15T00:00:00Z' },
  { id: 'e2', tripId: 'trip-1', userId: 'user-2', type: 'MEMBER_JOINED', description: 'joined the trip', createdAt: '2026-01-16T00:00:00Z' },
];

const SEED_SETTLEMENTS: Settlement[] = [
  { id: 's1', tripId: 'trip-1', fromUserId: 'user-2', toUserId: 'user-1', amount: 150, currency: 'USD', description: 'Hotel share', status: 'pending', createdAt: '2026-02-01T00:00:00Z' },
];

const SEED_MEDIA: MediaItem[] = [
  { id: 'med-1', tripId: 'trip-5', uploaderId: 'user-2', type: 'image', url: 'https://images.unsplash.com/photo-1541194577141-f7a3b724ef8e?w=800', caption: 'Nashville view!', createdAt: '2026-02-18T10:00:00Z' },
];

class MockTrip {
  trips: Map<string, Trip> = new Map();
  members: Map<string, TripMember[]> = new Map();
  activities: Map<string, Activity[]> = new Map();
  votes: Map<string, Vote[]> = new Map();
  invites: Map<string, Invite[]> = new Map();
  bookings: Map<string, Booking[]> = new Map();
  messages: Map<string, TripMessage[]> = new Map();
  directMessages: Map<string, DirectMessage[]> = new Map();
  media: Map<string, MediaItem[]> = new Map();
  events: Map<string, TripEvent[]> = new Map();
  settlements: Map<string, Settlement[]> = new Map();
  albums: Map<string, Album> = new Map();
  users: Map<string, User> = new Map();

  constructor(seed: boolean = true) {
    if (seed) {
      this.seed();
    }
  }

  private seed() {
    SEED_TRIPS.forEach(trip => this.trips.set(trip.id, trip));
    SEED_MEMBERS.forEach(member => {
      const existing = this.members.get(member.tripId) || [];
      existing.push(member);
      this.members.set(member.tripId, existing);
    });
    SEED_ACTIVITIES.forEach(activity => {
      const existing = this.activities.get(activity.tripId) || [];
      existing.push(activity);
      this.activities.set(activity.tripId, existing);
    });
    SEED_VOTES.forEach(vote => {
      const existing = this.votes.get(vote.activityId) || [];
      existing.push(vote);
      this.votes.set(vote.activityId, existing);
    });
    SEED_MESSAGES.forEach(message => {
      const existing = this.messages.get(message.tripId) || [];
      existing.push(message);
      this.messages.set(message.tripId, existing);
    });
    SEED_EVENTS.forEach(event => {
      const existing = this.events.get(event.tripId) || [];
      existing.push(event);
      this.events.set(event.tripId, existing);
    });
    SEED_SETTLEMENTS.forEach(settlement => {
      const existing = this.settlements.get(settlement.tripId) || [];
      existing.push(settlement);
      this.settlements.set(settlement.tripId, existing);
    });
    SEED_MEDIA.forEach(media => {
      const existing = this.media.get(media.tripId) || [];
      existing.push(media);
      this.media.set(media.tripId, existing);
    });
    SEED_NOTIFICATIONS.forEach(n => this.notifications.push(n));
    SEED_USERS.forEach(user => this.users.set(user.id, user));
  }

  private notifications: Notification[] = [];

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getTripMembersWithUsers(tripId: string): (TripMember & { user: User })[] {
    const members = this.members.get(tripId) || [];
    return members.map(m => ({
      ...m,
      user: this.users.get(m.userId)!
    })).filter(m => m.user);
  }

  getActivitiesWithVotes(tripId: string): Activity[] {
    const activities = this.activities.get(tripId) || [];
    return activities.map(a => ({
      ...a,
      votes: this.votes.get(a.id) || []
    }));
  }

  getEventsInternal(tripId: string): TripEvent[] {
    const events = this.events.get(tripId) || [];
    return events.map(e => ({
      ...e,
      user: e.userId ? this.users.get(e.userId) : undefined
    })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getSettlementsInternal(tripId: string): Settlement[] {
    const settlements = this.settlements.get(tripId) || [];
    return settlements.map(s => ({
      ...s,
      fromUser: this.users.get(s.fromUserId),
      toUser: this.users.get(s.toUserId)
    }));
  }

  calculateBalances(tripId: string): { userId: string; balance: number; user?: User }[] {
    const settlements = this.settlements.get(tripId) || [];
    const balances: Record<string, number> = {};
    
    settlements.forEach(s => {
      if (s.status === 'received' || s.status === 'sent') {
        balances[s.fromUserId] = (balances[s.fromUserId] || 0) - s.amount;
        balances[s.toUserId] = (balances[s.toUserId] || 0) + s.amount;
      }
    });

    return Object.entries(balances).map(([userId, balance]) => ({
      userId,
      balance,
      user: this.users.get(userId)
    }));
  }

  async getTrips(userIdInput?: string): Promise<ApiResponse<(TripMember & { trip: Trip })[]>> {
    const userId = userIdInput || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1');

    if (!this.getUserById(userId)) {
      return { data: [] };
    }

    const tripMembers: (TripMember & { trip: Trip })[] = [];
    for (const [tripId, members] of this.members.entries()) {
      const trip = this.trips.get(tripId);
      if (trip) {
        const userMembers = members.filter(m => m.userId === userId);
        for (const member of userMembers) {
          tripMembers.push({
            ...member,
            trip,
          });
        }
      }
    }
    return { data: tripMembers };
  }

  async getTrip(id: string): Promise<ApiResponse<Trip>> {
    const trip = this.trips.get(id);
    if (!trip) {
      return { error: 'Trip not found' };
    }
    return { data: trip };
  }

  async createTrip(userId: string, input: CreateTripInput): Promise<ApiResponse<Trip>> {
    const trip: Trip = {
      id: generateId(),
      name: input.name,
      description: input.description,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'IDEA',
      tripMasterId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.trips.set(trip.id, trip);
    
    const member: TripMember = {
      id: generateId(),
      tripId: trip.id,
      userId,
      role: 'MASTER',
      status: 'CONFIRMED',
      joinedAt: new Date().toISOString(),
    };
    this.members.set(trip.id, [member]);
    
    return { data: trip };
  }

  async updateTrip(id: string, input: UpdateTripInput): Promise<ApiResponse<Trip>> {
    const trip = this.trips.get(id);
    if (!trip) {
      return { error: 'Trip not found' };
    }
    const updated = { ...trip, ...input, updatedAt: new Date().toISOString() };
    this.trips.set(id, updated);
    return { data: updated };
  }

  async deleteTrip(id: string): Promise<ApiResponse<void>> {
    this.trips.delete(id);
    this.members.delete(id);
    this.activities.delete(id);
    this.invites.delete(id);
    this.bookings.delete(id);
    this.messages.delete(id);
    this.media.delete(id);
    return { data: undefined };
  }

  async changeTripStatus(id: string, status: string): Promise<ApiResponse<Trip>> {
    const trip = this.trips.get(id);
    if (!trip) {
      return { error: 'Trip not found' };
    }
    const updated = { ...trip, status: status as Trip['status'], updatedAt: new Date().toISOString() };
    this.trips.set(id, updated);
    return { data: updated };
  }

  async getTripMembers(tripId: string): Promise<ApiResponse<TripMember[]>> {
    return { data: this.members.get(tripId) || [] };
  }

  async addTripMember(tripId: string, userId: string): Promise<ApiResponse<TripMember>> {
    const members = this.members.get(tripId) || [];
    const member: TripMember = {
      id: generateId(),
      tripId,
      userId,
      role: 'MEMBER',
      status: 'INVITED',
      joinedAt: new Date().toISOString(),
    };
    members.push(member);
    this.members.set(tripId, members);
    return { data: member };
  }

  async getActivities(tripId: string): Promise<ApiResponse<Activity[]>> {
    return { data: this.getActivitiesWithVotes(tripId) };
  }

  async createActivity(tripId: string, userIdOrInput: string | CreateActivityInput, input?: CreateActivityInput): Promise<ApiResponse<Activity>> {
    let userId: string;
    let activityInput: CreateActivityInput;

    if (typeof userIdOrInput === 'string') {
      userId = userIdOrInput;
      activityInput = input!;
    } else {
      userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
      activityInput = userIdOrInput;
    }

    const activity: Activity = {
      id: generateId(),
      tripId,
      title: activityInput.title,
      description: activityInput.description,
      location: activityInput.location,
      startTime: activityInput.startTime,
      endTime: activityInput.endTime,
      cost: activityInput.cost,
      currency: 'USD',
      category: activityInput.category,
      proposedBy: userId,
      votes: [],
      status: 'OPEN',
      votingEndsAt: undefined,
      createdAt: new Date().toISOString(),
    };
    const activities = this.activities.get(tripId) || [];
    activities.push(activity);
    this.activities.set(tripId, activities);
    return { data: activity };
  }

  async castVote(activityId: string, userIdOrOption: string, option?: string): Promise<ApiResponse<Vote>> {
    let userId: string;
    let voteOption: string;

    if (option) {
      userId = userIdOrOption;
      voteOption = option;
    } else {
      userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
      voteOption = userIdOrOption;
    }

    const existingVotes = this.votes.get(activityId) || [];
    const existingIndex = existingVotes.findIndex(v => v.userId === userId);

    const vote: Vote = {
      id: generateId(),
      activityId,
      userId,
      option: voteOption as Vote['option'],
    };

    if (existingIndex >= 0) {
      existingVotes[existingIndex] = vote;
    } else {
      existingVotes.push(vote);
    }
    this.votes.set(activityId, existingVotes);
    return { data: vote };
  }

  async getInvites(tripId: string): Promise<ApiResponse<Invite[]>> {
    return { data: this.invites.get(tripId) || [] };
  }

  async createInvite(tripId: string, input: CreateInviteInput): Promise<ApiResponse<Invite>> {
    const invite: Invite = {
      id: generateId(),
      tripId,
      token: generateId(),
      email: input.email,
      phone: input.phone,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sentById: 'current-user',
    };
    const invites = this.invites.get(tripId) || [];
    invites.push(invite);
    this.invites.set(tripId, invites);
    return { data: invite };
  }

  async getBookings(tripId: string): Promise<ApiResponse<Booking[]>> {
    return { data: this.bookings.get(tripId) || [] };
  }

  async getMessages(tripId: string): Promise<ApiResponse<TripMessage[]>> {
    const messages = this.messages.get(tripId) || [];
    return { data: messages };
  }

  async sendMessage(tripId: string, userId: string, input: SendMessageInput): Promise<ApiResponse<TripMessage>> {
    const message: TripMessage = {
      id: generateId(),
      tripId,
      userId,
      content: input.content,
      messageType: input.messageType || 'TEXT',
      createdAt: new Date().toISOString(),
    };
    const messages = this.messages.get(tripId) || [];
    messages.push(message);
    this.messages.set(tripId, messages);
    return { data: message };
  }

  async getMedia(tripId: string): Promise<ApiResponse<MediaItem[]>> {
    return { data: this.media.get(tripId) || [] };
  }

  async getEvents(tripId: string): Promise<ApiResponse<TripEvent[]>> {
    return { data: this.getEventsInternal(tripId) };
  }

  async getSettlements(tripId: string): Promise<ApiResponse<Settlement[]>> {
    return { data: this.getSettlementsInternal(tripId) };
  }

  async getBalances(tripId: string): Promise<ApiResponse<{ userId: string; balance: number; user?: User }[]>> {
    return { data: this.calculateBalances(tripId) };
  }

  // Direct Messages
  private getConversationKey(u1: string, u2: string) {
    return [u1, u2].sort().join(':');
  }

  async getDirectMessages(u1: string, u2: string): Promise<ApiResponse<DirectMessage[]>> {
    const key = this.getConversationKey(u1, u2);
    const messages = this.directMessages.get(key) || [];
    return { data: messages.map(m => ({
      ...m,
      sender: this.users.get(m.senderId),
      receiver: this.users.get(m.receiverId)
    })) };
  }

  async sendDirectMessage(senderId: string, receiverId: string, input: SendMessageInput): Promise<ApiResponse<DirectMessage>> {
    const message: DirectMessage = {
      id: generateId(),
      senderId,
      receiverId,
      content: input.content,
      messageType: input.messageType || 'TEXT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const key = this.getConversationKey(senderId, receiverId);
    const messages = this.directMessages.get(key) || [];
    messages.push(message);
    this.directMessages.set(key, messages);
    return { data: message };
  }

  async getAlbums(tripId: string): Promise<ApiResponse<Album[]>> {
    return { data: Array.from(this.albums.values()).filter(t => t.tripId === tripId) };
  }

  async createAlbum(tripId: string, userId: string, input: CreateAlbumInput): Promise<ApiResponse<Album>> {
    const trip = this.trips.get(tripId);
    if (!trip) {
      return { error: 'Trip not found' };
    }
    const album: Album = {
      id: generateId(),
      tripId,
      name: input.name,
      description: input.description,
      mediaItems: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.albums.set(album.id, album);
    return { data: album };
  }

  async addMediaToAlbum(tripId: string, userId: string, type: 'image' | 'video', url: string, caption?: string): Promise<ApiResponse<MediaItem>> {
    const media: MediaItem = {
      id: generateId(),
      tripId,
      albumId: undefined,
      uploaderId: userId,
      type,
      url,
      caption,
      createdAt: new Date().toISOString(),
    };
    const existing = this.media.get(tripId) || [];
    existing.push(media);
    this.media.set(tripId, existing);
    return { data: media };
  }

  reset() {
    this.trips.clear();
    this.members.clear();
    this.activities.clear();
    this.votes.clear();
    this.invites.clear();
    this.bookings.clear();
    this.messages.clear();
    this.directMessages.clear();
    this.media.clear();
    this.events.clear();
    this.settlements.clear();
    this.seed();
  }
}

export const mockTrip = new MockTrip(true);

export { MockTrip };

export class MockApiService extends ApiService {
  getTrips(userId?: string): Promise<ApiResponse<(TripMember & { trip: Trip })[]>> {
    return mockTrip.getTrips(userId);
  }

  getTrip(id: string): Promise<ApiResponse<Trip>> {
    return mockTrip.getTrip(id);
  }

  createTrip(input: CreateTripInput): Promise<ApiResponse<Trip>> {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
    return mockTrip.createTrip(userId, input);
  }

  updateTrip(id: string, input: UpdateTripInput): Promise<ApiResponse<Trip>> {
    return mockTrip.updateTrip(id, input);
  }

  deleteTrip(id: string): Promise<ApiResponse<void>> {
    return mockTrip.deleteTrip(id);
  }

  changeTripStatus(id: string, status: string): Promise<ApiResponse<Trip>> {
    return mockTrip.changeTripStatus(id, status);
  }

  getTripMembers(tripId: string): Promise<ApiResponse<TripMember[]>> {
    return mockTrip.getTripMembers(tripId);
  }

  addTripMember(tripId: string, userId: string): Promise<ApiResponse<TripMember>> {
    return mockTrip.addTripMember(tripId, userId);
  }

  getActivities(tripId: string): Promise<ApiResponse<Activity[]>> {
    return mockTrip.getActivities(tripId);
  }

  createActivity(tripId: string, userIdOrInput: string | CreateActivityInput, input?: CreateActivityInput): Promise<ApiResponse<Activity>> {
    return mockTrip.createActivity(tripId, userIdOrInput, input);
  }

  castVote(activityId: string, userIdOrOption: string, option?: string): Promise<ApiResponse<Vote>> {
    return mockTrip.castVote(activityId, userIdOrOption, option);
  }

  getInvites(tripId: string): Promise<ApiResponse<Invite[]>> {
    return mockTrip.getInvites(tripId);
  }

  createInvite(tripId: string, input: CreateInviteInput): Promise<ApiResponse<Invite>> {
    return mockTrip.createInvite(tripId, input);
  }

  getBookings(tripId: string): Promise<ApiResponse<Booking[]>> {
    return mockTrip.getBookings(tripId);
  }

  getMessages(tripId: string): Promise<ApiResponse<TripMessage[]>> {
    return mockTrip.getMessages(tripId);
  }

  sendMessage(tripId: string, input: SendMessageInput): Promise<ApiResponse<TripMessage>> {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
    return mockTrip.sendMessage(tripId, userId, input);
  }

  getDirectMessages(userId: string): Promise<ApiResponse<DirectMessage[]>> {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
    return mockTrip.getDirectMessages(currentUserId, userId);
  }

  sendDirectMessage(userId: string, input: SendMessageInput): Promise<ApiResponse<DirectMessage>> {
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
    return mockTrip.sendDirectMessage(currentUserId, userId, input);
  }

  getMedia(tripId: string): Promise<ApiResponse<MediaItem[]>> {
    return mockTrip.getMedia(tripId);
  }

  getAlbums(tripId: string): Promise<ApiResponse<Album[]>> {
    return mockTrip.getAlbums(tripId);
  }

  createAlbum(input: CreateAlbumInput): Promise<ApiResponse<Album>> {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || 'user-1' : 'user-1';
    // Requires a tripId which is not in CreateAlbumInput
    return Promise.resolve({ error: 'Trip context required for album creation' });
  }

  getNotifications(): Promise<ApiResponse<Notification[]>> {
    return Promise.resolve({ data: [] });
  }

  markNotificationRead(id: string): Promise<ApiResponse<void>> {
    return Promise.resolve({ data: undefined });
  }

  markAllNotificationsRead(): Promise<ApiResponse<void>> {
    return Promise.resolve({ data: undefined });
  }

  getCurrentUser(): Promise<ApiResponse<User>> {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    
    if (!userId) {
      return Promise.resolve({ error: 'Not authenticated' });
    }

    let user = mockTrip.getUserById(userId);

    if (!user) {
      user = {
        id: userId,
        email: userId,
        name: userId.split('@')[0],
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTrip.users.set(userId, user);

      if (userId === 'test@user.com') {
        const members = mockTrip.members.get('trip-1') || [];
        if (!members.some(m => m.userId === userId)) {
          members.push({
            id: `m-${userId}-1`,
            tripId: 'trip-1',
            userId,
            role: 'MEMBER',
            status: 'CONFIRMED',
            joinedAt: new Date().toISOString(),
          });
          mockTrip.members.set('trip-1', members);
        }
      }
    }

    return Promise.resolve({ data: user });
  }

  updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const userId = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!userId) {
      return Promise.resolve({ error: 'Not authenticated' });
    }
    const user = mockTrip.getUserById(userId);
    if (!user) {
      return Promise.resolve({ error: 'User not found' });
    }
    const updated = { ...user, ...data, updatedAt: new Date().toISOString() };
    mockTrip.users.set(userId, updated);
    return Promise.resolve({ data: updated });
  }
}

export const mockApi = new MockApiService();
