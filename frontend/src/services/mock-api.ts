import {
  Trip,
  TripMember,
  Activity,
  Vote,
  Invite,
  Message,
  MediaItem,
  Notification,
  User,
  Settings,
  TimelineEvent,
  BillSplit,
  BillSplitMember,
  Friend,
  FriendRequest,
  DmConversation,
  CreateTripInput,
  UpdateTripInput,
  CreateActivityInput,
  CreateInviteInput,
  SendMessageInput,
  CreateBillSplitInput,
  CreateFriendRequestInput,
  ApiResponse,
} from '@/types';

const generateId = () => crypto.randomUUID();

const SEED_USERS: User[] = [
  { id: 'user-1', email: 'test@example.com', name: 'Test User', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-2', email: 'sarah@example.com', name: 'Sarah Chen', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-3', email: 'mike@example.com', name: 'Mike Johnson', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: 'user-4', email: 'emma@example.com', name: 'Emma Wilson', avatarUrl: undefined, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const SEED_SETTINGS: Settings = {
  userId: 'user-1',
  friendRequestSource: 'ANYONE',
  emailTripInvites: true,
  emailPaymentRequests: true,
  emailVotingReminders: true,
  emailTripReminders: true,
  emailMessages: true,
  emailFriendRequests: true,
  pushTripInvites: true,
  pushPaymentRequests: true,
  pushVotingReminders: true,
  pushTripReminders: true,
  pushMessages: true,
  inAppAll: true,
};

const SEED_FRIENDS: Friend[] = [
  { id: 'friend-1', userId: 'user-1', friendId: 'user-2', createdAt: '2026-01-10T00:00:00Z' },
  { id: 'friend-2', userId: 'user-1', friendId: 'user-3', createdAt: '2026-01-12T00:00:00Z' },
];

const SEED_FRIEND_REQUESTS: FriendRequest[] = [
  { id: 'fr-1', senderId: 'user-4', receiverId: 'user-1', status: 'PENDING', createdAt: '2026-02-15T00:00:00Z' },
];
const SEED_NOTIFICATIONS: Notification[] = [
  { id: 'notif-1', userId: 'user-1', category: 'MILESTONE', title: 'Trip coming up!', body: 'Hawaii Beach Vacation starts in 2 weeks', referenceId: 'trip-1', referenceType: 'TRIP', link: '/trip/trip-1', isRead: false, createdAt: '2026-02-15T10:00:00Z' },
  { id: 'notif-2', userId: 'user-1', category: 'MEMBER', title: 'Vote needed', body: 'Vote on Surfing Lessons activity for Hawaii trip', referenceId: 'trip-1', referenceType: 'TRIP', link: '/trip/trip-1', isRead: false, createdAt: '2026-02-14T15:00:00Z' },
  { id: 'notif-3', userId: 'user-1', category: 'SETTLEMENT', title: 'Payment needed', body: 'You owe $120 for Luau Dinner - please pay Sarah', referenceId: 'trip-1', referenceType: 'BILL_SPLIT', link: '/trip/trip-1/payments', isRead: false, createdAt: '2026-02-13T09:00:00Z' },
  { id: 'notif-4', userId: 'user-1', category: 'MEMBER', title: 'Activity confirmed!', body: 'Hotel: Grand Wailea has been confirmed!', referenceId: 'trip-1', referenceType: 'TRIP', link: '/trip/trip-1', isRead: true, createdAt: '2026-02-01T15:00:00Z' },
  { id: 'notif-5', userId: 'user-1', category: 'MILESTONE', title: 'Trip this weekend!', body: 'NYC Birthday Weekend is this weekend - have fun!', referenceId: 'trip-2', referenceType: 'TRIP', link: '/trip/trip-2', isRead: true, createdAt: '2026-04-15T10:00:00Z' },
  { id: 'notif-6', userId: 'user-1', category: 'CHAT', title: 'Tagged in chat', body: 'Sarah mentioned you in the Nashville trip chat', referenceId: 'trip-5', referenceType: 'MESSAGE', link: '/trip/trip-5/chat', isRead: false, createdAt: '2026-02-18T20:00:00Z' },
  { id: 'notif-7', userId: 'user-1', category: 'INVITE', title: 'New member joined', body: 'Emma Wilson joined Hawaii Beach Vacation', referenceId: 'trip-1', referenceType: 'TRIP', link: '/trip/trip-1', isRead: true, createdAt: '2026-01-18T09:00:00Z' },
  { id: 'notif-8', userId: 'user-1', category: 'MILESTONE', title: 'Trip happening now!', body: 'Your Nashville trip is happening right now!', referenceId: 'trip-5', referenceType: 'TRIP', link: '/trip/trip-5', isRead: false, createdAt: '2026-02-18T08:00:00Z' },
  { id: 'notif-9', userId: 'user-1', category: 'FRIEND', title: 'Friend request', body: 'Emma Wilson sent you a friend request', referenceId: 'fr-1', referenceType: 'FRIEND_REQUEST', link: '/friends', isRead: false, createdAt: '2026-02-15T00:00:00Z' },
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
    style: 'OPEN',
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
    style: 'OPEN',
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
    style: 'OPEN',
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
    style: 'OPEN',
    tripMasterId: 'user-3',
    coverImage: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800',
    createdAt: '2025-10-01T00:00:00Z',
    updatedAt: '2025-12-24T00:00:00Z',
  },
  {
    id: 'trip-5',
    name: 'Nashville Trip',
    description: 'Trip in progress - adding photos and videos!',
    destination: 'Nashville, Tennessee',
    startDate: '2026-02-18T00:00:00Z',
    endDate: '2026-02-22T00:00:00Z',
    status: 'HAPPENING',
    style: 'OPEN',
    tripMasterId: 'user-2',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-02-18T08:00:00Z',
  },
];

const SEED_MEMBERS: TripMember[] = [
  { id: 'm1', tripId: 'trip-1', userId: 'user-1', role: 'MASTER', status: 'CONFIRMED', joinedAt: '2026-01-15T00:00:00Z' },
  { id: 'm2', tripId: 'trip-1', userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2026-01-16T00:00:00Z' },
  { id: 'm3', tripId: 'trip-1', userId: 'user-3', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2026-01-17T00:00:00Z' },
  { id: 'm4', tripId: 'trip-1', userId: 'user-4', role: 'MEMBER', status: 'MAYBE', joinedAt: '2026-01-18T00:00:00Z' },
  { id: 'm5', tripId: 'trip-2', userId: 'user-2', role: 'MASTER', status: 'CONFIRMED', joinedAt: '2026-01-20T00:00:00Z' },
  { id: 'm6', tripId: 'trip-2', userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2026-01-21T00:00:00Z' },
  { id: 'm7', tripId: 'trip-3', userId: 'user-1', role: 'MASTER', status: 'CONFIRMED', joinedAt: '2026-02-01T00:00:00Z' },
  { id: 'm8', tripId: 'trip-4', userId: 'user-3', role: 'MASTER', status: 'CONFIRMED', joinedAt: '2025-10-01T00:00:00Z' },
  { id: 'm9', tripId: 'trip-4', userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2025-10-02T00:00:00Z' },
  { id: 'm10', tripId: 'trip-4', userId: 'user-2', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2025-10-03T00:00:00Z' },
  { id: 'm11', tripId: 'trip-5', userId: 'user-2', role: 'MASTER', status: 'CONFIRMED', joinedAt: '2026-01-25T10:00:00Z' },
  { id: 'm12', tripId: 'trip-5', userId: 'user-1', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2026-01-25T11:00:00Z' },
  { id: 'm13', tripId: 'trip-5', userId: 'user-4', role: 'MEMBER', status: 'CONFIRMED', joinedAt: '2026-01-26T09:00:00Z' },
];

const SEED_ACTIVITIES: Activity[] = [
  { id: 'act-1', tripId: 'trip-1', title: 'Surfing Lessons', description: '2-hour beginner surf lesson at Waikiki Beach', location: 'Waikiki Beach', cost: 75, currency: 'USD', category: 'activity', proposedBy: 'user-1', createdAt: '2026-01-20T00:00:00Z' },
  { id: 'act-2', tripId: 'trip-1', title: 'Road to Hana', description: 'Full day guided tour along the famous Road to Hana', location: 'Maui', cost: 150, currency: 'USD', category: 'excursion', proposedBy: 'user-2', createdAt: '2026-01-22T00:00:00Z' },
  { id: 'act-3', tripId: 'trip-1', title: 'Luau Dinner', description: 'Traditional Hawaiian luau with dinner and show', location: 'Grand Wailea', cost: 120, currency: 'USD', category: 'restaurant', proposedBy: 'user-3', createdAt: '2026-01-25T00:00:00Z' },
  { id: 'act-4', tripId: 'trip-1', title: 'Hotel: Grand Wailea', description: 'Luxury resort booking', location: 'Maui', cost: 450, currency: 'USD', category: 'accommodation', proposedBy: 'user-1', createdAt: '2026-01-18T00:00:00Z' },
  { id: 'act-5', tripId: 'trip-2', title: 'Broadway Show', description: 'Hamilton on Broadway!', location: 'Broadway, NYC', cost: 200, currency: 'USD', category: 'activity', proposedBy: 'user-2', createdAt: '2026-01-25T00:00:00Z' },
  { id: 'act-6', tripId: 'trip-2', title: 'Hotel: Manhattan Club', description: 'Manhattan boutique hotel', location: 'Manhattan', cost: 300, currency: 'USD', category: 'accommodation', proposedBy: 'user-1', createdAt: '2026-01-22T00:00:00Z' },
  { id: 'act-7', tripId: 'trip-3', title: 'Eiffel Tower Visit', description: 'Skip-the-line tickets', location: 'Paris', cost: 50, currency: 'EUR', category: 'activity', proposedBy: 'user-1', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'act-8', tripId: 'trip-3', title: 'Colosseum Tour', description: 'Guided tour of the Colosseum', location: 'Rome', cost: 60, currency: 'EUR', category: 'excursion', proposedBy: 'user-1', createdAt: '2026-02-01T00:00:00Z' },
];

const SEED_VOTES: Vote[] = [
  { id: 'v1', activityId: 'act-1', userId: 'user-1', option: 'YES' },
  { id: 'v2', activityId: 'act-1', userId: 'user-2', option: 'YES' },
  { id: 'v3', activityId: 'act-1', userId: 'user-3', option: 'MAYBE' },
  { id: 'v4', activityId: 'act-2', userId: 'user-1', option: 'YES' },
  { id: 'v5', activityId: 'act-2', userId: 'user-2', option: 'YES' },
  { id: 'v6', activityId: 'act-3', userId: 'user-1', option: 'YES' },
  { id: 'v7', activityId: 'act-3', userId: 'user-2', option: 'NO' },
  { id: 'v8', activityId: 'act-4', userId: 'user-1', option: 'YES' },
  { id: 'v9', activityId: 'act-4', userId: 'user-2', option: 'YES' },
  { id: 'v10', activityId: 'act-4', userId: 'user-3', option: 'YES' },
  { id: 'v11', activityId: 'act-5', userId: 'user-1', option: 'YES' },
  { id: 'v12', activityId: 'act-5', userId: 'user-2', option: 'YES' },
];

const SEED_MESSAGES: Message[] = [
  { id: 'msg-1', tripId: 'trip-1', senderId: 'user-1', content: 'Hey everyone! Excited about this trip! 🏝️', messageType: 'TEXT', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'msg-2', tripId: 'trip-1', senderId: 'user-2', content: 'Me too! I\'ve always wanted to go to Maui!', messageType: 'TEXT', createdAt: '2026-01-15T10:15:00Z' },
  { id: 'msg-3', tripId: 'trip-1', senderId: 'user-3', content: 'Has anyone looked at the surf lessons? I think that would be so fun!', messageType: 'TEXT', createdAt: '2026-01-20T14:30:00Z' },
  { id: 'msg-4', tripId: 'trip-1', senderId: 'user-1', content: 'I added it as an activity - please vote!', messageType: 'TEXT', createdAt: '2026-01-20T15:00:00Z' },
  { id: 'msg-5', tripId: 'trip-2', senderId: 'user-2', content: 'Birthday trip! Can\'t wait! 🎉', messageType: 'TEXT', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'msg-6', tripId: 'trip-2', senderId: 'user-1', content: 'Going to book us tickets to Hamilton!', messageType: 'TEXT', createdAt: '2026-01-25T11:00:00Z' },
];

const SEED_TIMELINE: TimelineEvent[] = [
  { id: 'evt-1', tripId: 'trip-1', eventType: 'trip_created', description: 'Hawaii Beach Vacation was created', createdAt: '2026-01-15T10:00:00Z', createdBy: 'user-1' },
  { id: 'evt-2', tripId: 'trip-1', eventType: 'member_joined', description: 'Sarah Chen joined the trip', createdAt: '2026-01-16T09:00:00Z', createdBy: 'user-2' },
  { id: 'evt-3', tripId: 'trip-1', eventType: 'member_joined', description: 'Mike Johnson joined the trip', createdAt: '2026-01-17T08:30:00Z', createdBy: 'user-3' },
  { id: 'evt-4', tripId: 'trip-1', eventType: 'activity_proposed', description: 'Surfing Lessons proposed', createdAt: '2026-01-20T14:00:00Z', createdBy: 'user-1' },
  { id: 'evt-5', tripId: 'trip-1', eventType: 'vote_cast', description: 'Voted YES on Surfing Lessons', createdAt: '2026-01-20T14:05:00Z', createdBy: 'user-1' },
  { id: 'evt-6', tripId: 'trip-1', eventType: 'activity_proposed', description: 'Hotel: Grand Wailea proposed', createdAt: '2026-01-18T11:00:00Z', createdBy: 'user-1' },
  { id: 'evt-7', tripId: 'trip-1', eventType: 'vote_cast', description: 'Voted YES on Hotel: Grand Wailea', createdAt: '2026-01-19T10:00:00Z', createdBy: 'user-2' },
  { id: 'evt-8', tripId: 'trip-1', eventType: 'status_changed', description: 'Trip moved to PLANNING', createdAt: '2026-01-19T12:00:00Z', createdBy: 'user-1' },
  { id: 'evt-9', tripId: 'trip-5', eventType: 'trip_created', description: 'Nashville Trip was created', createdAt: '2026-01-25T10:00:00Z', createdBy: 'user-2' },
  { id: 'evt-10', tripId: 'trip-5', eventType: 'status_changed', description: 'Trip started!', createdAt: '2026-02-18T08:00:00Z', createdBy: 'user-2' },
];

const SEED_BILL_SPLITS: BillSplit[] = [
  {
    id: 'bill-1',
    tripId: 'trip-1',
    activityId: 'act-4',
    title: 'Hotel: Grand Wailea',
    description: 'Luxury resort for 7 nights',
    amount: 1800,
    currency: 'USD',
    splitType: 'EQUAL',
    paidBy: 'user-1',
    createdBy: 'user-1',
    status: 'PENDING',
    dueDate: '2026-05-01T00:00:00Z',
    createdAt: '2026-01-18T00:00:00Z',
    updatedAt: '2026-01-18T00:00:00Z',
  },
  {
    id: 'bill-2',
    tripId: 'trip-1',
    title: 'Luau Dinner',
    description: 'Traditional Hawaiian luau',
    amount: 360,
    currency: 'USD',
    splitType: 'EQUAL',
    paidBy: 'user-3',
    createdBy: 'user-3',
    status: 'PAID',
    createdAt: '2026-01-25T00:00:00Z',
    updatedAt: '2026-01-25T00:00:00Z',
  },
];

const SEED_BILL_SPLIT_MEMBERS: BillSplitMember[] = [
  { id: 'bsm-1', billSplitId: 'bill-1', userId: 'user-1', dollarAmount: 450, type: 'EQUAL', status: 'PAID', paidAt: '2026-02-01T16:00:00Z', paymentMethod: 'VENMO' },
  { id: 'bsm-2', billSplitId: 'bill-1', userId: 'user-2', dollarAmount: 450, type: 'EQUAL', status: 'PENDING' },
  { id: 'bsm-3', billSplitId: 'bill-1', userId: 'user-3', dollarAmount: 450, type: 'EQUAL', status: 'PAID', paidAt: '2026-02-01T16:30:00Z', paymentMethod: 'VENMO' },
  { id: 'bsm-4', billSplitId: 'bill-1', userId: 'user-4', dollarAmount: 450, type: 'EQUAL', status: 'PENDING' },
  { id: 'bsm-5', billSplitId: 'bill-2', userId: 'user-1', dollarAmount: 90, type: 'EQUAL', status: 'PAID', paidAt: '2026-01-26T10:00:00Z', paymentMethod: 'CASH' },
  { id: 'bsm-6', billSplitId: 'bill-2', userId: 'user-2', dollarAmount: 90, type: 'EQUAL', status: 'PAID', paidAt: '2026-01-26T11:00:00Z', paymentMethod: 'CASH' },
  { id: 'bsm-7', billSplitId: 'bill-2', userId: 'user-3', dollarAmount: 90, type: 'EQUAL', status: 'PAID', paidAt: '2026-01-26T12:00:00Z', paymentMethod: 'CASH' },
  { id: 'bsm-8', billSplitId: 'bill-2', userId: 'user-4', dollarAmount: 90, type: 'EQUAL', status: 'PENDING' },
];

const SEED_DM_CONVERSATIONS: DmConversation[] = [
  { id: 'dm-1', participant1: 'user-1', participant2: 'user-2', lastMessageAt: '2026-02-18T20:00:00Z' },
  { id: 'dm-2', participant1: 'user-1', participant2: 'user-3', lastMessageAt: '2026-02-10T15:00:00Z' },
];

const SEED_DM_MESSAGES: Message[] = [
  { id: 'dm-msg-1', conversationId: 'dm-1', senderId: 'user-1', content: 'Hey! Can\'t wait for the trip!', messageType: 'TEXT', createdAt: '2026-02-18T19:00:00Z' },
  { id: 'dm-msg-2', conversationId: 'dm-1', senderId: 'user-2', content: 'Me neither! Already packed my bags!', messageType: 'TEXT', createdAt: '2026-02-18T20:00:00Z' },
];

const SEED_MEDIA: MediaItem[] = [
  { id: 'media-1', tripId: 'trip-5', uploaderId: 'user-2', type: 'image', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', caption: 'Nashville skyline at night', createdAt: '2026-02-18T14:00:00Z' },
  { id: 'media-2', tripId: 'trip-5', uploaderId: 'user-2', type: 'image', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', caption: 'Broadway neon lights', createdAt: '2026-02-18T14:05:00Z' },
  { id: 'media-3', tripId: 'trip-5', uploaderId: 'user-1', type: 'image', url: 'https://images.unsplash.com/photo-1544542900-1af4c07e98d8?w=800', caption: 'Guitar shop on Broadway', createdAt: '2026-02-18T16:00:00Z' },
];

class MockDatabase {
  trips: Map<string, Trip> = new Map();
  members: Map<string, TripMember[]> = new Map();
  activities: Map<string, Activity[]> = new Map();
  votes: Map<string, Vote[]> = new Map();
  invites: Map<string, Invite[]> = new Map();
  messages: Map<string, Message[]> = new Map();
  dmMessages: Map<string, Message[]> = new Map();
  media: Map<string, MediaItem[]> = new Map();
  timeline: Map<string, TimelineEvent[]> = new Map();
  billSplits: Map<string, BillSplit> = new Map();
  billSplitMembers: Map<string, BillSplitMember[]> = new Map();
  users: Map<string, User> = new Map();
  friends: Map<string, Friend[]> = new Map();
  friendRequests: FriendRequest[] = [];
  dmConversations: Map<string, DmConversation> = new Map();
  notifications: Notification[] = [];
  settings: Settings | null = null;
  currentUserId: string = 'user-1';

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
      const existing = this.messages.get(message.tripId!) || [];
      existing.push(message);
      this.messages.set(message.tripId!, existing);
    });
    SEED_TIMELINE.forEach(event => {
      const existing = this.timeline.get(event.tripId) || [];
      existing.push(event);
      this.timeline.set(event.tripId, existing);
    });
    SEED_BILL_SPLITS.forEach(bill => {
      this.billSplits.set(bill.id, bill);
      const members = SEED_BILL_SPLIT_MEMBERS.filter(m => m.billSplitId === bill.id);
      this.billSplitMembers.set(bill.id, members);
    });
    SEED_MEDIA.forEach(media => {
      const existing = this.media.get(media.tripId) || [];
      existing.push(media);
      this.media.set(media.tripId, existing);
    });
    SEED_DM_CONVERSATIONS.forEach(dm => this.dmConversations.set(dm.id, dm));
    SEED_DM_MESSAGES.forEach(msg => {
      const existing = this.dmMessages.get(msg.conversationId!) || [];
      existing.push(msg);
      this.dmMessages.set(msg.conversationId!, existing);
    });
    SEED_FRIENDS.forEach(friend => {
      const existing = this.friends.get(friend.userId) || [];
      existing.push(friend);
      this.friends.set(friend.userId, existing);
    });
    this.friendRequests = [...SEED_FRIEND_REQUESTS];
    SEED_NOTIFICATIONS.forEach(n => this.notifications.push(n));
    SEED_USERS.forEach(user => this.users.set(user.id, user));
    this.settings = SEED_SETTINGS;
  }

  reset() {
    this.trips.clear();
    this.members.clear();
    this.activities.clear();
    this.votes.clear();
    this.invites.clear();
    this.messages.clear();
    this.dmMessages.clear();
    this.media.clear();
    this.timeline.clear();
    this.billSplits.clear();
    this.billSplitMembers.clear();
    this.users.clear();
    this.friends.clear();
    this.friendRequests = [];
    this.dmConversations.clear();
    this.notifications = [];
    this.settings = null;
    this.seed();
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getCurrentUser(): User | undefined {
    return this.users.get(this.currentUserId);
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
}

export const mockDb = new MockDatabase(true);

export const mockTrip = {
  getTripMembersWithUsers: (tripId: string) => mockDb.getTripMembersWithUsers(tripId),
  reset: () => mockDb.reset(),
};

const CURRENT_USER_ID = 'user-1';

export const mockApi = {
  // Trips
  getTrips: (): Promise<ApiResponse<Trip[]>> => 
    Promise.resolve({ data: Array.from(mockDb.trips.values()) }),
  
  getTrip: (id: string): Promise<ApiResponse<Trip>> => {
    const trip = mockDb.trips.get(id);
    return trip ? Promise.resolve({ data: trip }) : Promise.resolve({ error: 'Trip not found' });
  },
  
  createTrip: (input: CreateTripInput): Promise<ApiResponse<Trip>> => {
    const trip: Trip = {
      id: generateId(),
      name: input.name,
      description: input.description,
      destination: input.destination,
      startDate: input.startDate,
      endDate: input.endDate,
      status: 'IDEA',
      style: input.style || 'OPEN',
      tripMasterId: CURRENT_USER_ID,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.trips.set(trip.id, trip);
    const member: TripMember = {
      id: generateId(),
      tripId: trip.id,
      userId: CURRENT_USER_ID,
      role: 'MASTER',
      status: 'CONFIRMED',
      joinedAt: new Date().toISOString(),
    };
    mockDb.members.set(trip.id, [member]);
    return Promise.resolve({ data: trip });
  },
  
  updateTrip: (id: string, input: UpdateTripInput): Promise<ApiResponse<Trip>> => {
    const trip = mockDb.trips.get(id);
    if (!trip) return Promise.resolve({ error: 'Trip not found' });
    const updated = { ...trip, ...input, updatedAt: new Date().toISOString() };
    mockDb.trips.set(id, updated);
    return Promise.resolve({ data: updated });
  },
  
  deleteTrip: (id: string): Promise<ApiResponse<void>> => {
    mockDb.trips.delete(id);
    mockDb.members.delete(id);
    mockDb.activities.delete(id);
    mockDb.invites.delete(id);
    mockDb.messages.delete(id);
    mockDb.media.delete(id);
    return Promise.resolve({ data: undefined });
  },
  
  changeTripStatus: (id: string, status: string): Promise<ApiResponse<Trip>> => {
    const trip = mockDb.trips.get(id);
    if (!trip) return Promise.resolve({ error: 'Trip not found' });
    const updated = { ...trip, status: status as Trip['status'], updatedAt: new Date().toISOString() };
    mockDb.trips.set(id, updated);
    return Promise.resolve({ data: updated });
  },

  // Trip Members
  getTripMembers: (tripId: string): Promise<ApiResponse<TripMember[]>> => 
    Promise.resolve({ data: mockDb.members.get(tripId) || [] }),
  
  addTripMember: (tripId: string, userId: string): Promise<ApiResponse<TripMember>> => {
    const members = mockDb.members.get(tripId) || [];
    const member: TripMember = {
      id: generateId(),
      tripId,
      userId,
      role: 'MEMBER',
      status: 'INVITED',
      joinedAt: new Date().toISOString(),
    };
    members.push(member);
    mockDb.members.set(tripId, members);
    return Promise.resolve({ data: member });
  },

  updateTripMember: (tripId: string, userId: string, data: { role?: string; status?: string }): Promise<ApiResponse<TripMember>> => {
    const members = mockDb.members.get(tripId) || [];
    const index = members.findIndex(m => m.userId === userId);
    if (index === -1) return Promise.resolve({ error: 'Member not found' });
    const updated = { ...members[index], ...data } as TripMember;
    members[index] = updated;
    mockDb.members.set(tripId, members);
    return Promise.resolve({ data: updated });
  },

  removeTripMember: (tripId: string, userId: string): Promise<ApiResponse<void>> => {
    const members = mockDb.members.get(tripId) || [];
    const filtered = members.filter(m => m.userId !== userId);
    mockDb.members.set(tripId, filtered);
    return Promise.resolve({ data: undefined });
  },

  // Activities
  getActivities: (tripId: string): Promise<ApiResponse<Activity[]>> => 
    Promise.resolve({ data: mockDb.getActivitiesWithVotes(tripId) }),
  
  createActivity: (tripId: string, input: CreateActivityInput): Promise<ApiResponse<Activity>> => {
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
      proposedBy: CURRENT_USER_ID,
      votes: [],
      createdAt: new Date().toISOString(),
    };
    const activities = mockDb.activities.get(tripId) || [];
    activities.push(activity);
    mockDb.activities.set(tripId, activities);
    return Promise.resolve({ data: activity });
  },

  updateActivity: (id: string, data: Partial<CreateActivityInput>): Promise<ApiResponse<Activity>> => {
    for (const entry of Array.from(mockDb.activities.entries())) {
      const [tripId, activities] = entry;
      const index = activities.findIndex(a => a.id === id);
      if (index !== -1) {
        const updated = { ...activities[index], ...data } as Activity;
        activities[index] = updated;
        mockDb.activities.set(tripId, activities);
        return Promise.resolve({ data: updated });
      }
    }
    return Promise.resolve({ error: 'Activity not found' });
  },

  deleteActivity: (id: string): Promise<ApiResponse<void>> => {
    for (const entry of Array.from(mockDb.activities.entries())) {
      const [tripId, activities] = entry;
      const filtered = activities.filter(a => a.id !== id);
      if (filtered.length !== activities.length) {
        mockDb.activities.set(tripId, filtered);
        mockDb.votes.delete(id);
        return Promise.resolve({ data: undefined });
      }
    }
    return Promise.resolve({ error: 'Activity not found' });
  },

  // Votes
  getVotes: (activityId: string): Promise<ApiResponse<Vote[]>> =>
    Promise.resolve({ data: mockDb.votes.get(activityId) || [] }),

  castVote: (activityId: string, option: string): Promise<ApiResponse<Vote>> => {
    const existingVotes = mockDb.votes.get(activityId) || [];
    const existingIndex = existingVotes.findIndex(v => v.userId === CURRENT_USER_ID);
    const vote: Vote = { id: generateId(), activityId, userId: CURRENT_USER_ID, option: option as Vote['option'] };
    if (existingIndex >= 0) {
      existingVotes[existingIndex] = vote;
    } else {
      existingVotes.push(vote);
    }
    mockDb.votes.set(activityId, existingVotes);
    return Promise.resolve({ data: vote });
  },

  removeVote: (activityId: string): Promise<ApiResponse<void>> => {
    const existingVotes = mockDb.votes.get(activityId) || [];
    const filtered = existingVotes.filter(v => v.userId !== CURRENT_USER_ID);
    mockDb.votes.set(activityId, filtered);
    return Promise.resolve({ data: undefined });
  },

  // Invites
  getInvites: (tripId: string): Promise<ApiResponse<Invite[]>> =>
    Promise.resolve({ data: mockDb.invites.get(tripId) || [] }),

  createInvite: (tripId: string, data: CreateInviteInput): Promise<ApiResponse<Invite>> => {
    const invite: Invite = {
      id: generateId(),
      tripId,
      token: generateId(),
      email: data.email,
      phone: data.phone,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      sentById: CURRENT_USER_ID,
    };
    const invites = mockDb.invites.get(tripId) || [];
    invites.push(invite);
    mockDb.invites.set(tripId, invites);
    return Promise.resolve({ data: invite });
  },

  acceptInvite: (token: string): Promise<ApiResponse<{ tripId: string }>> => {
    return Promise.resolve({ data: { tripId: 'trip-1' } });
  },

  declineInvite: (token: string): Promise<ApiResponse<void>> => {
    return Promise.resolve({ data: undefined });
  },

  // Messages
  getTripMessages: (tripId: string): Promise<ApiResponse<Message[]>> => 
    Promise.resolve({ data: mockDb.messages.get(tripId) || [] }),
  
  sendTripMessage: (tripId: string, input: SendMessageInput): Promise<ApiResponse<Message>> => {
    const message: Message = {
      id: generateId(),
      tripId,
      senderId: CURRENT_USER_ID,
      content: input.content,
      messageType: input.messageType || 'TEXT',
      mentions: input.mentions,
      createdAt: new Date().toISOString(),
    };
    const messages = mockDb.messages.get(tripId) || [];
    messages.push(message);
    mockDb.messages.set(tripId, messages);
    return Promise.resolve({ data: message });
  },

  editMessage: (messageId: string, data: { mentions?: string[] }): Promise<ApiResponse<Message>> => {
    for (const entry of Array.from(mockDb.messages.entries())) {
      const [tripId, messages] = entry;
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        const updated = { ...messages[index], ...data, editedAt: new Date().toISOString() } as Message;
        messages[index] = updated;
        mockDb.messages.set(tripId, messages);
        return Promise.resolve({ data: updated });
      }
    }
    return Promise.resolve({ error: 'Message not found' });
  },

  deleteMessage: (messageId: string): Promise<ApiResponse<void>> => {
    for (const entry of Array.from(mockDb.messages.entries())) {
      const [tripId, messages] = entry;
      const filtered = messages.filter(m => m.id !== messageId);
      if (filtered.length !== messages.length) {
        mockDb.messages.set(tripId, filtered);
        return Promise.resolve({ data: undefined });
      }
    }
    return Promise.resolve({ error: 'Message not found' });
  },

  addReaction: (messageId: string, emoji: string): Promise<ApiResponse<void>> => {
    return Promise.resolve({ data: undefined });
  },

  // Media
  getMedia: (tripId: string): Promise<ApiResponse<MediaItem[]>> =>
    Promise.resolve({ data: mockDb.media.get(tripId) || [] }),

  uploadMedia: (tripId: string, file: File): Promise<ApiResponse<MediaItem>> => {
    const media: MediaItem = {
      id: generateId(),
      tripId,
      uploaderId: CURRENT_USER_ID,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file),
      createdAt: new Date().toISOString(),
    };
    const items = mockDb.media.get(tripId) || [];
    items.push(media);
    mockDb.media.set(tripId, items);
    return Promise.resolve({ data: media });
  },

  // Friends
  getFriends: (): Promise<ApiResponse<Friend[]>> => {
    const userFriends = mockDb.friends.get(CURRENT_USER_ID) || [];
    return Promise.resolve({ data: userFriends });
  },

  addFriend: (userId: string): Promise<ApiResponse<Friend>> => {
    const friend: Friend = {
      id: generateId(),
      userId: CURRENT_USER_ID,
      friendId: userId,
      createdAt: new Date().toISOString(),
    };
    const existing = mockDb.friends.get(CURRENT_USER_ID) || [];
    existing.push(friend);
    mockDb.friends.set(CURRENT_USER_ID, existing);
    return Promise.resolve({ data: friend });
  },

  removeFriend: (friendId: string): Promise<ApiResponse<void>> => {
    const existing = mockDb.friends.get(CURRENT_USER_ID) || [];
    const filtered = existing.filter(f => f.id !== friendId);
    mockDb.friends.set(CURRENT_USER_ID, filtered);
    return Promise.resolve({ data: undefined });
  },

  getFriendRequests: (): Promise<ApiResponse<{ sent: FriendRequest[]; received: FriendRequest[] }>> => {
    const received = mockDb.friendRequests.filter(fr => fr.receiverId === CURRENT_USER_ID);
    const sent = mockDb.friendRequests.filter(fr => fr.senderId === CURRENT_USER_ID);
    return Promise.resolve({ data: { sent, received } });
  },

  sendFriendRequest: (data: CreateFriendRequestInput): Promise<ApiResponse<FriendRequest>> => {
    const request: FriendRequest = {
      id: generateId(),
      senderId: CURRENT_USER_ID,
      receiverId: data.receiverId,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    mockDb.friendRequests.push(request);
    return Promise.resolve({ data: request });
  },

  respondToFriendRequest: (requestId: string, action: 'ACCEPTED' | 'DECLINED'): Promise<ApiResponse<FriendRequest>> => {
    const request = mockDb.friendRequests.find(fr => fr.id === requestId);
    if (!request) return Promise.resolve({ error: 'Request not found' });
    request.status = action;
    return Promise.resolve({ data: request });
  },

  // DMs
  getDmConversations: (): Promise<ApiResponse<DmConversation[]>> =>
    Promise.resolve({ data: Array.from(mockDb.dmConversations.values()) }),

  createDmConversation: (participantId: string): Promise<ApiResponse<DmConversation>> => {
    const conversation: DmConversation = {
      id: generateId(),
      participant1: CURRENT_USER_ID,
      participant2: participantId,
      lastMessageAt: new Date().toISOString(),
    };
    mockDb.dmConversations.set(conversation.id, conversation);
    return Promise.resolve({ data: conversation });
  },

  getDmMessages: (conversationId: string): Promise<ApiResponse<Message[]>> =>
    Promise.resolve({ data: mockDb.dmMessages.get(conversationId) || [] }),

  sendDmMessage: (conversationId: string, input: SendMessageInput): Promise<ApiResponse<Message>> => {
    const message: Message = {
      id: generateId(),
      conversationId,
      senderId: CURRENT_USER_ID,
      content: input.content,
      messageType: input.messageType || 'TEXT',
      mentions: input.mentions,
      createdAt: new Date().toISOString(),
    };
    const messages = mockDb.dmMessages.get(conversationId) || [];
    messages.push(message);
    mockDb.dmMessages.set(conversationId, messages);
    return Promise.resolve({ data: message });
  },

  // Bill Splits
  getBillSplits: (tripId: string): Promise<ApiResponse<BillSplit[]>> => {
    const bills = Array.from(mockDb.billSplits.values()).filter(b => b.tripId === tripId);
    return Promise.resolve({ data: bills });
  },

  createBillSplit: (tripId: string, input: CreateBillSplitInput): Promise<ApiResponse<BillSplit>> => {
    const bill: BillSplit = {
      id: generateId(),
      tripId,
      activityId: input.activityId,
      title: input.title,
      description: input.description,
      amount: input.amount,
      currency: input.currency || 'USD',
      splitType: input.splitType,
      paidBy: input.paidBy,
      createdBy: CURRENT_USER_ID,
      status: 'PENDING',
      dueDate: input.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockDb.billSplits.set(bill.id, bill);

    return Promise.resolve({ data: bill });
  },

  getBillSplit: (billSplitId: string): Promise<ApiResponse<BillSplit>> => {
    const bill = mockDb.billSplits.get(billSplitId);
    return bill ? Promise.resolve({ data: bill }) : Promise.resolve({ error: 'Bill split not found' });
  },

  updateBillSplit: (billSplitId: string, data: Partial<CreateBillSplitInput>): Promise<ApiResponse<BillSplit>> => {
    const bill = mockDb.billSplits.get(billSplitId);
    if (!bill) return Promise.resolve({ error: 'Bill split not found' });
    const updated = { ...bill, ...data, updatedAt: new Date().toISOString() } as BillSplit;
    mockDb.billSplits.set(billSplitId, updated);
    return Promise.resolve({ data: updated });
  },

  deleteBillSplit: (billSplitId: string): Promise<ApiResponse<void>> => {
    mockDb.billSplits.delete(billSplitId);
    mockDb.billSplitMembers.delete(billSplitId);
    return Promise.resolve({ data: undefined });
  },

  getBillSplitMembers: (billSplitId: string): Promise<ApiResponse<BillSplitMember[]>> =>
    Promise.resolve({ data: mockDb.billSplitMembers.get(billSplitId) || [] }),

  addBillSplitMember: (billSplitId: string, data: { userId: string; shares?: number; percentage?: number; dollarAmount?: number }): Promise<ApiResponse<BillSplitMember>> => {
    const members = mockDb.billSplitMembers.get(billSplitId) || [];
    const member: BillSplitMember = {
      id: generateId(),
      billSplitId,
      userId: data.userId,
      dollarAmount: data.dollarAmount || 0,
      type: 'EQUAL',
      status: 'PENDING',
    };
    members.push(member);
    mockDb.billSplitMembers.set(billSplitId, members);
    return Promise.resolve({ data: member });
  },

  markBillSplitMemberPaid: (billSplitId: string, userId: string, paymentMethod: string): Promise<ApiResponse<BillSplitMember>> => {
    const members = mockDb.billSplitMembers.get(billSplitId) || [];
    const index = members.findIndex(m => m.userId === userId);
    if (index === -1) return Promise.resolve({ error: 'Member not found' });
    const updated = { ...members[index], status: 'PAID' as const, paidAt: new Date().toISOString(), paymentMethod: paymentMethod as any };
    members[index] = updated;
    mockDb.billSplitMembers.set(billSplitId, members);
    return Promise.resolve({ data: updated });
  },

  removeBillSplitMember: (billSplitId: string, userId: string): Promise<ApiResponse<void>> => {
    const members = mockDb.billSplitMembers.get(billSplitId) || [];
    const filtered = members.filter(m => m.userId !== userId);
    mockDb.billSplitMembers.set(billSplitId, filtered);
    return Promise.resolve({ data: undefined });
  },

  // Timeline
  getTripTimeline: (tripId: string): Promise<ApiResponse<TimelineEvent[]>> => {
    const events = mockDb.timeline.get(tripId) || [];
    return Promise.resolve({ data: events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
  },

  // Notifications
  getNotifications: (): Promise<ApiResponse<Notification[]>> => {
    const notifications = mockDb.notifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return Promise.resolve({ data: notifications });
  },

  markNotificationRead: (id: string): Promise<ApiResponse<void>> => {
    const notif = mockDb.notifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
    return Promise.resolve({ data: undefined });
  },

  markAllNotificationsRead: (): Promise<ApiResponse<void>> => {
    mockDb.notifications.forEach(n => n.isRead = true);
    return Promise.resolve({ data: undefined });
  },

  // Settings
  getSettings: (): Promise<ApiResponse<Settings>> =>
    Promise.resolve({ data: mockDb.settings! }),

  updateSettings: (data: Partial<Settings>): Promise<ApiResponse<Settings>> => {
    mockDb.settings = { ...mockDb.settings!, ...data };
    return Promise.resolve({ data: mockDb.settings! });
  },

  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse<void>> => {
    return Promise.resolve({ data: undefined });
  },

  uploadAvatar: (file: File): Promise<ApiResponse<{ avatarUrl: string }>> => {
    return Promise.resolve({ data: { avatarUrl: URL.createObjectURL(file) } });
  },

  // User
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    Promise.resolve({ data: mockDb.getCurrentUser()! }),

  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> => {
    const user = mockDb.getCurrentUser()!;
    const updated = { ...user, ...data };
    mockDb.users.set(user.id, updated);
    return Promise.resolve({ data: updated });
  },

  getUser: (id: string): Promise<ApiResponse<User>> => {
    const user = mockDb.getUserById(id);
    return user ? Promise.resolve({ data: user }) : Promise.resolve({ error: 'User not found' });
  },
};
