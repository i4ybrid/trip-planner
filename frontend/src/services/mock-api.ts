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
  TripEvent,
  Settlement,
  Album,
  CreateAlbumInput,
  ApiResponse,
} from '@/types';

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
  { id: 'v12', activityId: 'act-5', userId: 'user-2', option: 'yes' },
];

const SEED_MESSAGES: TripMessage[] = [
  { id: 'msg-1', tripId: 'trip-1', userId: 'user-1', content: 'Hey everyone! Excited about this trip! 🏝️', messageType: 'TEXT', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'msg-2', tripId: 'trip-1', userId: 'user-2', content: 'Me too! I\'ve always wanted to go to Maui!', messageType: 'TEXT', createdAt: '2026-01-15T10:15:00Z' },
  { id: 'msg-3', tripId: 'trip-1', userId: 'user-3', content: 'Has anyone looked at the surf lessons? I think that would be so fun!', messageType: 'TEXT', createdAt: '2026-01-20T14:30:00Z' },
  { id: 'msg-4', tripId: 'trip-1', userId: 'user-1', content: 'I added it as an activity - please vote!', messageType: 'TEXT', createdAt: '2026-01-20T15:00:00Z' },
  { id: 'msg-5', tripId: 'trip-2', userId: 'user-2', content: 'Birthday trip! Can\'t wait! 🎉', messageType: 'TEXT', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'msg-6', tripId: 'trip-2', userId: 'user-1', content: 'Going to book us tickets to Hamilton!', messageType: 'TEXT', createdAt: '2026-01-25T11:00:00Z' },
];

const SEED_EVENTS: TripEvent[] = [
  { id: 'evt-1', tripId: 'trip-1', type: 'trip_created', title: 'Trip created', description: 'Hawaii Beach Vacation was created', userId: 'user-1', createdAt: '2026-01-15T10:00:00Z' },
  { id: 'evt-2', tripId: 'trip-1', type: 'member_invited', title: 'Sarah invited', description: 'Sarah Chen was invited to the trip', userId: 'user-1', createdAt: '2026-01-15T10:05:00Z' },
  { id: 'evt-3', tripId: 'trip-1', type: 'member_joined', title: 'Sarah joined', description: 'Sarah Chen joined the trip', userId: 'user-2', createdAt: '2026-01-16T09:00:00Z' },
  { id: 'evt-4', tripId: 'trip-1', type: 'member_invited', title: 'Mike invited', description: 'Mike Johnson was invited to the trip', userId: 'user-1', createdAt: '2026-01-16T10:00:00Z' },
  { id: 'evt-5', tripId: 'trip-1', type: 'member_joined', title: 'Mike joined', description: 'Mike Johnson joined the trip', userId: 'user-3', createdAt: '2026-01-17T08:30:00Z' },
  { id: 'evt-6', tripId: 'trip-1', type: 'activity_proposed', title: 'Activity proposed', description: 'Surfing Lessons proposed', userId: 'user-1', relatedId: 'act-1', createdAt: '2026-01-20T14:00:00Z' },
  { id: 'evt-7', tripId: 'trip-1', type: 'activity_proposed', title: 'Activity proposed', description: 'Hotel: Grand Wailea proposed', userId: 'user-1', relatedId: 'act-4', createdAt: '2026-01-18T11:00:00Z' },
  { id: 'evt-8', tripId: 'trip-1', type: 'vote_cast', title: 'Vote cast', description: 'Voted yes on Surfing Lessons', userId: 'user-1', createdAt: '2026-01-20T14:05:00Z' },
  { id: 'evt-9', tripId: 'trip-1', type: 'vote_cast', title: 'Vote cast', description: 'Voted yes on Hotel: Grand Wailea', userId: 'user-2', createdAt: '2026-01-19T10:00:00Z' },
  { id: 'evt-10', tripId: 'trip-1', type: 'status_changed', title: 'Status changed', description: 'Trip moved to PLANNING', userId: 'user-1', createdAt: '2026-01-19T12:00:00Z' },
  { id: 'evt-11', tripId: 'trip-1', type: 'activity_booked', title: 'Activity booked', description: 'Hotel: Grand Wailea was booked', userId: 'user-1', relatedId: 'act-4', createdAt: '2026-02-01T15:00:00Z' },
  { id: 'evt-12', tripId: 'trip-1', type: 'payment_received', title: 'Payment received', description: 'Sarah paid $450 for hotel', userId: 'user-2', createdAt: '2026-02-01T16:00:00Z' },
  { id: 'evt-13', tripId: 'trip-1', type: 'payment_received', title: 'Payment received', description: 'Mike paid $450 for hotel', userId: 'user-3', createdAt: '2026-02-01T16:30:00Z' },
  { id: 'evt-14', tripId: 'trip-2', type: 'trip_created', title: 'Trip created', description: 'NYC Birthday Weekend was created', userId: 'user-2', createdAt: '2026-01-20T09:00:00Z' },
  { id: 'evt-15', tripId: 'trip-2', type: 'member_invited', title: 'Test User invited', description: 'Test User was invited to the trip', userId: 'user-2', createdAt: '2026-01-20T09:05:00Z' },
  { id: 'evt-16', tripId: 'trip-2', type: 'member_joined', title: 'Test User joined', description: 'Test User joined the trip', userId: 'user-1', createdAt: '2026-01-21T10:00:00Z' },
  { id: 'evt-17', tripId: 'trip-2', type: 'activity_proposed', title: 'Activity proposed', description: 'Broadway Show proposed', userId: 'user-2', relatedId: 'act-5', createdAt: '2026-01-25T11:00:00Z' },
  { id: 'evt-18', tripId: 'trip-2', type: 'status_changed', title: 'Status changed', description: 'Trip confirmed! All activities booked.', userId: 'user-2', createdAt: '2026-02-10T14:00:00Z' },
  { id: 'evt-19', tripId: 'trip-2', type: 'payment_received', title: 'Payment received', description: 'Test User paid $500 for hotel & show', userId: 'user-1', createdAt: '2026-02-10T15:00:00Z' },
  { id: 'evt-20', tripId: 'trip-3', type: 'trip_created', title: 'Trip created', description: 'European Adventure was created', userId: 'user-1', createdAt: '2026-02-01T10:00:00Z' },
  { id: 'evt-21', tripId: 'trip-3', type: 'activity_proposed', title: 'Activity proposed', description: 'Eiffel Tower Visit proposed', userId: 'user-1', relatedId: 'act-7', createdAt: '2026-02-01T10:30:00Z' },
  { id: 'evt-22', tripId: 'trip-4', type: 'trip_created', title: 'Trip created', description: 'Ski Trip 2025 was created', userId: 'user-3', createdAt: '2025-10-01T09:00:00Z' },
  { id: 'evt-23', tripId: 'trip-4', type: 'member_joined', title: 'Members joined', description: 'Trip members joined', userId: 'user-1', createdAt: '2025-10-02T10:00:00Z' },
  { id: 'evt-24', tripId: 'trip-4', type: 'status_changed', title: 'Trip in progress', description: 'Trip started', userId: 'user-3', createdAt: '2025-12-20T08:00:00Z' },
  { id: 'evt-25', tripId: 'trip-4', type: 'status_changed', title: 'Trip completed', description: 'Trip completed successfully', userId: 'user-3', createdAt: '2025-12-23T18:00:00Z' },
  { id: 'evt-26', tripId: 'trip-5', type: 'trip_created', title: 'Trip created', description: 'Happening Nashville trip was created', userId: 'user-2', createdAt: '2026-01-25T10:00:00Z' },
  { id: 'evt-27', tripId: 'trip-5', type: 'member_invited', title: 'Members invited', description: 'Test User and Emma invited', userId: 'user-2', createdAt: '2026-01-25T10:05:00Z' },
  { id: 'evt-28', tripId: 'trip-5', type: 'member_joined', title: 'Test User joined', description: 'Test User joined the trip', userId: 'user-1', createdAt: '2026-01-25T11:00:00Z' },
  { id: 'evt-29', tripId: 'trip-5', type: 'member_joined', title: 'Emma joined', description: 'Emma Wilson joined the trip', userId: 'user-4', createdAt: '2026-01-26T09:00:00Z' },
  { id: 'evt-30', tripId: 'trip-5', type: 'status_changed', title: 'Trip started!', description: 'The Nashville adventure begins!', userId: 'user-2', createdAt: '2026-02-18T08:00:00Z' },
  { id: 'evt-31', tripId: 'trip-5', type: 'photo_shared', title: 'Photo album added', description: 'Downtown Nashville photos added', userId: 'user-2', createdAt: '2026-02-18T14:00:00Z' },
  { id: 'evt-32', tripId: 'trip-5', type: 'photo_shared', title: 'Video added', description: 'Live music at Broadway added', userId: 'user-1', createdAt: '2026-02-18T22:00:00Z' },
];

const SEED_SETTLEMENTS: Settlement[] = [
  { id: 'set-1', tripId: 'trip-1', fromUserId: 'user-2', toUserId: 'user-1', amount: 450, currency: 'USD', description: 'Hotel: Grand Wailea share', status: 'received', venmoHandle: 'sarah-chen', createdAt: '2026-02-01T16:00:00Z' },
  { id: 'set-2', tripId: 'trip-1', fromUserId: 'user-3', toUserId: 'user-1', amount: 450, currency: 'USD', description: 'Hotel: Grand Wailea share', status: 'received', venmoHandle: 'mike-j', createdAt: '2026-02-01T16:30:00Z' },
  { id: 'set-3', tripId: 'trip-1', fromUserId: 'user-4', toUserId: 'user-1', amount: 795, currency: 'USD', description: 'Hotel + Activities share (pending)', status: 'pending', createdAt: '2026-02-10T10:00:00Z' },
  { id: 'set-4', tripId: 'trip-2', fromUserId: 'user-1', toUserId: 'user-2', amount: 500, currency: 'USD', description: 'Hotel & Broadway tickets', status: 'received', paypalEmail: 'sarah@example.com', createdAt: '2026-02-10T15:00:00Z' },
  { id: 'set-5', tripId: 'trip-1', fromUserId: 'user-2', toUserId: 'user-3', amount: 37, currency: 'USD', description: 'Surf lessons share', status: 'pending', zellePhone: '555-0123', createdAt: '2026-02-15T10:00:00Z' },
  { id: 'set-6', tripId: 'trip-1', fromUserId: 'user-2', toUserId: 'user-3', amount: 60, currency: 'USD', description: 'Luau dinner share', status: 'pending', createdAt: '2026-02-15T10:00:00Z' },
];

const SEED_ALBUMS: Album[] = [
  {
    id: 'album-1',
    tripId: 'trip-5',
    name: 'Downtown Nashville',
    description: 'First day exploring Broadway and downtown',
    coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
    mediaItems: [],
    createdAt: '2026-02-18T14:00:00Z',
    updatedAt: '2026-02-18T14:00:00Z',
  },
  {
    id: 'album-2',
    tripId: 'trip-5',
    name: 'Music Row',
    description: 'Recording studios and live music venues',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    mediaItems: [],
    createdAt: '2026-02-19T10:00:00Z',
    updatedAt: '2026-02-19T10:00:00Z',
  },
];

const SEED_MEDIA: MediaItem[] = [
  { id: 'media-1', tripId: 'trip-5', uploaderId: 'user-2', type: 'image', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800', caption: 'Nashville skyline at night', createdAt: '2026-02-18T14:00:00Z' },
  { id: 'media-2', tripId: 'trip-5', uploaderId: 'user-2', type: 'image', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800', caption: 'Broadway neon lights', createdAt: '2026-02-18T14:05:00Z' },
  { id: 'media-3', tripId: 'trip-5', uploaderId: 'user-1', type: 'image', url: 'https://images.unsplash.com/photo-1544542900-1af4c07e98d8?w=800', caption: 'Guitar shop on Broadway', createdAt: '2026-02-18T16:00:00Z' },
  { id: 'media-4', tripId: 'trip-5', uploaderId: 'user-2', type: 'image', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800', caption: 'Live music everywhere!', createdAt: '2026-02-18T22:00:00Z' },
  { id: 'media-5', tripId: 'trip-5', uploaderId: 'user-1', type: 'image', url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', caption: 'Studio vibes', createdAt: '2026-02-19T10:00:00Z' },
  { id: 'media-6', tripId: 'trip-5', uploaderId: 'user-4', type: 'image', url: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800', caption: 'Honky tonk night', createdAt: '2026-02-19T21:00:00Z' },
];

class MockTrip {
  trips: Map<string, Trip> = new Map();
  members: Map<string, TripMember[]> = new Map();
  activities: Map<string, Activity[]> = new Map();
  votes: Map<string, Vote[]> = new Map();
  invites: Map<string, Invite[]> = new Map();
  bookings: Map<string, Booking[]> = new Map();
  messages: Map<string, TripMessage[]> = new Map();
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
    return { data: this.getActivitiesWithVotes(tripId) };
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
      votes: [],
      createdAt: new Date().toISOString(),
    };
    const activities = this.activities.get(tripId) || [];
    activities.push(activity);
    this.activities.set(tripId, activities);
    return { data: activity };
  }

  async castVote(activityId: string, userId: string, option: string): Promise<ApiResponse<Vote>> {
    const existingVotes = this.votes.get(activityId) || [];
    const existingIndex = existingVotes.findIndex(v => v.userId === userId);
    
    const vote: Vote = {
      id: generateId(),
      activityId,
      userId,
      option: option as Vote['option'],
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
    const messagesWithUsers = messages.map(m => ({
      ...m,
      user: this.users.get(m.userId)
    })) as (TripMessage & { user?: User })[];
    return { data: messages as TripMessage[] };
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

  async getAlbums(tripId: string): Promise<ApiResponse<Album[]>> {
    const albums = Array.from(this.albums.values()).filter(a => a.tripId === tripId);
    return { data: albums };
  }

  async createAlbum(tripId: string, userId: string, input: CreateAlbumInput): Promise<ApiResponse<Album>> {
    const trip = this.trips.get(tripId);
    if (!trip) {
      return { error: 'Trip not found' };
    }
    if (trip.status !== 'HAPPENING' && trip.status !== 'COMPLETED') {
      return { error: 'Albums can only be added after the trip has started' };
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
    this.media.clear();
    this.events.clear();
    this.settlements.clear();
    this.seed();
  }
}

export const mockTrip = new MockTrip(true);

export { MockTrip };

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
  getAlbums: (tripId: string): Promise<ApiResponse<Album[]>> => mockTrip.getAlbums(tripId),
  createAlbum: (tripId: string, userId: string, input: CreateAlbumInput): Promise<ApiResponse<Album>> => mockTrip.createAlbum(tripId, userId, input),
  addMediaToAlbum: (tripId: string, userId: string, type: 'image' | 'video', url: string, caption?: string): Promise<ApiResponse<MediaItem>> => mockTrip.addMediaToAlbum(tripId, userId, type, url, caption),
  getNotifications: (): Promise<ApiResponse<Notification[]>> => {
    const notifications = SEED_NOTIFICATIONS.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return Promise.resolve({ data: notifications });
  },
  markNotificationRead: (id: string): Promise<ApiResponse<void>> => Promise.resolve({ data: undefined }),
  markAllNotificationsRead: (): Promise<ApiResponse<void>> => Promise.resolve({ data: undefined }),
  getCurrentUser: (): Promise<ApiResponse<User>> => Promise.resolve({ data: mockTrip.getUserById('user-1')! }),
  updateProfile: (data?: Partial<User>): Promise<ApiResponse<User>> => Promise.resolve({ data: { ...mockTrip.getUserById('user-1')!, ...data } as User }),
  getUser: (): Promise<ApiResponse<User>> => Promise.resolve({ data: {} as User }),
  getEvents: (tripId: string): Promise<ApiResponse<TripEvent[]>> => mockTrip.getEvents(tripId),
  getSettlements: (tripId: string): Promise<ApiResponse<Settlement[]>> => mockTrip.getSettlements(tripId),
  getBalances: (tripId: string): Promise<ApiResponse<{ userId: string; balance: number; user?: User }[]>> => mockTrip.getBalances(tripId),
};
