export type TripStatus = 'IDEA' | 'PLANNING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type MemberRole = 'MASTER' | 'ORGANIZER' | 'MEMBER' | 'VIEWER';

export type MemberStatus = 'INVITED' | 'DECLINED' | 'MAYBE' | 'CONFIRMED' | 'REMOVED';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export type BookingStatus = 'PROPOSED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'SYSTEM';

export type NotificationType = 'invite' | 'vote' | 'booking' | 'payment' | 'message' | 'reminder' | 'milestone';

export type ActivityCategory = 'accommodation' | 'excursion' | 'restaurant' | 'transport' | 'activity' | 'other';

export type VoteOption = 'yes' | 'no' | 'maybe';

export type ShareChannel = 'email' | 'whatsapp' | 'sms' | 'messenger' | 'telegram' | 'google_chat' | 'link';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  phone?: string;
  venmo?: string;
  paypal?: string;
  zelle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Trip {
  id: string;
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
  status: TripStatus;
  tripMasterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  role: MemberRole;
  status: MemberStatus;
  paymentStatus?: 'pending' | 'partial' | 'paid';
  paymentAmount?: number;
  paymentConfirmedAt?: string;
  joinedAt: string;
  user?: User;
  trip?: Trip;
}

export interface Activity {
  id: string;
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  cost?: number;
  currency: string;
  category: ActivityCategory;
  proposedBy: string;
  proposer?: User;
  votes?: Vote[];
  createdAt: string;
}

export interface Vote {
  id: string;
  activityId: string;
  userId: string;
  option: VoteOption;
  user?: User;
}

export interface Invite {
  id: string;
  tripId: string;
  token: string;
  email?: string;
  phone?: string;
  status: InviteStatus;
  expiresAt: string;
  sentById: string;
  channels?: InviteChannel[];
  trip?: Trip;
}

export interface InviteChannel {
  id: string;
  inviteId: string;
  channel: ShareChannel;
  externalId?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  activityId?: string;
  bookedBy: string;
  confirmationNum?: string;
  status: BookingStatus;
  receiptUrl?: string;
  notes?: string;
  activity?: Activity;
  createdAt: string;
  updatedAt: string;
}

export interface TripMessage {
  id: string;
  tripId: string;
  userId: string;
  content: string;
  messageType: MessageType;
  createdAt: string;
  user?: User;
}

export interface MediaItem {
  id: string;
  tripId: string;
  uploaderId: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  activityId?: string;
  caption?: string;
  uploader?: User;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  tripId?: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  createdAt: string;
}

export interface CreateTripInput {
  name: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateTripInput {
  name?: string;
  description?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  coverImage?: string;
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  cost?: number;
  category: ActivityCategory;
}

export interface CreateInviteInput {
  email?: string;
  phone?: string;
}

export interface SendMessageInput {
  content: string;
  messageType?: MessageType;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
