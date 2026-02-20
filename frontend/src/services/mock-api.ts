import {
  Trip,
  TripMember,
  Activity,
  Vote,
  Invite,
  Booking,
  TripMessage,
  MediaItem,
  Notification,
  User,
  CreateTripInput,
  UpdateTripInput,
  CreateActivityInput,
  CreateInviteInput,
  SendMessageInput,
  ApiResponse,
} from '@/types';

const generateId = () => crypto.randomUUID();

class MockTrip {
  trips: Map<string, Trip> = new Map();
  members: Map<string, TripMember[]> = new Map();
  activities: Map<string, Activity[]> = new Map();
  invites: Map<string, Invite[]> = new Map();
  bookings: Map<string, Booking[]> = new Map();
  messages: Map<string, TripMessage[]> = new Map();
  media: Map<string, MediaItem[]> = new Map();

  async getTrips(): Promise<ApiResponse<Trip[]>> {
    return { data: Array.from(this.trips.values()) };
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
    return { data: this.activities.get(tripId) || [] };
  }

  async createActivity(tripId: string, userId: string, input: CreateActivityInput): Promise<ApiResponse<Activity>> {
    const activity: Activity = {
      id: generateId(),
      tripId,
      title: input.title,
      description: input.description,
      location: input.location,
      startTime: input.startTime,
      endTime: input.endTime,
      cost: input.cost,
      currency: 'USD',
      category: input.category,
      proposedBy: userId,
      createdAt: new Date().toISOString(),
    };
    const activities = this.activities.get(tripId) || [];
    activities.push(activity);
    this.activities.set(tripId, activities);
    return { data: activity };
  }

  async castVote(activityId: string, userId: string, option: string): Promise<ApiResponse<Vote>> {
    const vote: Vote = {
      id: generateId(),
      activityId,
      userId,
      option: option as Vote['option'],
    };
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
    return { data: this.messages.get(tripId) || [] };
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

  reset() {
    this.trips.clear();
    this.members.clear();
    this.activities.clear();
    this.invites.clear();
    this.bookings.clear();
    this.messages.clear();
    this.media.clear();
  }
}

export const mockTrip = new MockTrip();

export const mockApi = {
  getTrips: (): Promise<ApiResponse<Trip[]>> => mockTrip.getTrips(),
  getTrip: (id: string): Promise<ApiResponse<Trip>> => mockTrip.getTrip(id),
  createTrip: (userId: string, input: CreateTripInput): Promise<ApiResponse<Trip>> => mockTrip.createTrip(userId, input),
  updateTrip: (id: string, input: UpdateTripInput): Promise<ApiResponse<Trip>> => mockTrip.updateTrip(id, input),
  deleteTrip: (id: string): Promise<ApiResponse<void>> => mockTrip.deleteTrip(id),
  changeTripStatus: (id: string, status: string): Promise<ApiResponse<Trip>> => mockTrip.changeTripStatus(id, status),
  getTripMembers: (tripId: string): Promise<ApiResponse<TripMember[]>> => mockTrip.getTripMembers(tripId),
  addTripMember: (tripId: string, userId: string): Promise<ApiResponse<TripMember>> => mockTrip.addTripMember(tripId, userId),
  getActivities: (tripId: string): Promise<ApiResponse<Activity[]>> => mockTrip.getActivities(tripId),
  createActivity: (tripId: string, userId: string, input: CreateActivityInput): Promise<ApiResponse<Activity>> => mockTrip.createActivity(tripId, userId, input),
  castVote: (activityId: string, userId: string, option: string): Promise<ApiResponse<Vote>> => mockTrip.castVote(activityId, userId, option),
  getInvites: (tripId: string): Promise<ApiResponse<Invite[]>> => mockTrip.getInvites(tripId),
  createInvite: (tripId: string, input: CreateInviteInput): Promise<ApiResponse<Invite>> => mockTrip.createInvite(tripId, input),
  getBookings: (tripId: string): Promise<ApiResponse<Booking[]>> => mockTrip.getBookings(tripId),
  getMessages: (tripId: string): Promise<ApiResponse<TripMessage[]>> => mockTrip.getMessages(tripId),
  sendMessage: (tripId: string, userId: string, input: SendMessageInput): Promise<ApiResponse<TripMessage>> => mockTrip.sendMessage(tripId, userId, input),
  getMedia: (tripId: string): Promise<ApiResponse<MediaItem[]>> => mockTrip.getMedia(tripId),
  getNotifications: (): Promise<ApiResponse<Notification[]>> => Promise.resolve({ data: [] }),
  markNotificationRead: (id: string): Promise<ApiResponse<void>> => Promise.resolve({ data: undefined }),
  markAllNotificationsRead: (): Promise<ApiResponse<void>> => Promise.resolve({ data: undefined }),
  getCurrentUser: (): Promise<ApiResponse<User>> => Promise.resolve({ 
    data: { 
      id: 'user-1', 
      email: 'test@example.com', 
      name: 'Test User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } 
  }),
  updateProfile: (): Promise<ApiResponse<User>> => Promise.resolve({ data: {} as User }),
  getUser: (): Promise<ApiResponse<User>> => Promise.resolve({ data: {} as User }),
};
