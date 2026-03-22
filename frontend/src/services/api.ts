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
  BlockedUser,
  InviteCode,
  UserSearchResult,
  ApiResponse,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const status = response.status;
    
    // Handle 401 - redirect to login
    if (status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
      // Return empty data to prevent error while redirecting
      return {} as T;
    }
    
    let errorMessage = 'An error occurred';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // Response might not be JSON
    }
    
    throw new ApiError(status, errorMessage);
  }
  return response.json();
}

async function getHeaders(): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Try to get token from NextAuth session
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/auth/session', {
        credentials: 'same-origin',
      });
      if (res.ok) {
        const session = await res.json();
        if (session?.accessToken) {
          headers['Authorization'] = `Bearer ${session.accessToken}`;
        }
      }
    } catch (error) {
      // Session fetch failed, continue without auth
      console.warn('Failed to fetch session:', error);
    }
  }

  return headers;
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await handleResponse<{ data: { user: User; token: string } }>(response);
    return result.data;
  },

  async register(email: string, name: string, password: string): Promise<{ user: User; token: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password }),
    });
    const result = await handleResponse<{ data: { user: User; token: string } }>(response);
    return result.data;
  },

  async logout(): Promise<void> {
    // Token cleanup is handled by NextAuth signOut
  },
  // Trips
  async getTrips(): Promise<ApiResponse<Trip[]>> {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getTrip(id: string): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async createTrip(data: CreateTripInput): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateTrip(id: string, data: UpdateTripInput): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteTrip(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async changeTripStatus(id: string, status: string): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}/status`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  async getTripTimeline(tripId: string): Promise<ApiResponse<TimelineEvent[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/timeline`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Trip Members
  async getTripMembers(tripId: string): Promise<ApiResponse<TripMember[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async addTripMember(tripId: string, userId: string): Promise<ApiResponse<TripMember>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId }),
    });
    return handleResponse(response);
  },

  async updateTripMember(tripId: string, userId: string, data: { role?: string; status?: string }): Promise<ApiResponse<TripMember>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async removeTripMember(tripId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Activities
  async getActivities(tripId: string): Promise<ApiResponse<Activity[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async createActivity(tripId: string, data: CreateActivityInput): Promise<ApiResponse<Activity>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateActivity(id: string, data: Partial<CreateActivityInput>): Promise<ApiResponse<Activity>> {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteActivity(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Votes
  async getVotes(activityId: string): Promise<ApiResponse<Vote[]>> {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}/votes`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async castVote(activityId: string, option: string): Promise<ApiResponse<Vote>> {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}/votes`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ option }),
    });
    return handleResponse(response);
  },

  async removeVote(activityId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}/votes`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Invites
  async getInvites(tripId: string): Promise<ApiResponse<Invite[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/invites`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async createInvite(tripId: string, data: CreateInviteInput): Promise<ApiResponse<Invite>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/invites`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async acceptInvite(token: string): Promise<ApiResponse<{ tripId: string }>> {
    const response = await fetch(`${API_BASE_URL}/invites/${token}/accept`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async declineInvite(token: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/invites/${token}/decline`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Messages (Trip Chat)
  async getTripMessages(tripId: string, limit = 30, before?: string): Promise<ApiResponse<Message[]>> {
    const url = new URL(`${API_BASE_URL}/trips/${tripId}/messages`);
    url.searchParams.set('limit', limit.toString());
    if (before) {
      url.searchParams.set('before', before);
    }
    
    const response = await fetch(url.toString(), {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async sendTripMessage(tripId: string, data: SendMessageInput): Promise<ApiResponse<Message>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/messages`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async editMessage(messageId: string, data: { mentions?: string[] }): Promise<ApiResponse<Message>> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async addReaction(messageId: string, emoji: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/reactions`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ emoji }),
    });
    return handleResponse(response);
  },

  // Media
  async getMedia(tripId: string): Promise<ApiResponse<MediaItem[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/media`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async uploadMedia(tripId: string, file: File): Promise<ApiResponse<MediaItem>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = await getHeaders();
    delete (headers as any)['Content-Type']; // Let browser set it for FormData

    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/media`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  async deleteMedia(mediaId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/media/${mediaId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Friends
  async getFriends(): Promise<ApiResponse<Friend[]>> {
    const response = await fetch(`${API_BASE_URL}/friends`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async addFriend(userId: string): Promise<ApiResponse<Friend>> {
    const response = await fetch(`${API_BASE_URL}/friends`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId }),
    });
    return handleResponse(response);
  },

  async removeFriend(friendId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/friends/${friendId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getFriendRequests(): Promise<ApiResponse<{ sent: FriendRequest[]; received: FriendRequest[] }>> {
    const response = await fetch(`${API_BASE_URL}/friend-requests`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async sendFriendRequest(data: CreateFriendRequestInput): Promise<ApiResponse<FriendRequest>> {
    const response = await fetch(`${API_BASE_URL}/friend-requests`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async respondToFriendRequest(requestId: string, action: 'ACCEPTED' | 'DECLINED'): Promise<ApiResponse<FriendRequest>> {
    const actionMap = { ACCEPTED: 'accept', DECLINED: 'decline' } as const;
    const response = await fetch(`${API_BASE_URL}/friend-requests/${requestId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify({ action: actionMap[action] }),
    });
    return handleResponse(response);
  },

  async searchUsersByEmail(email: string): Promise<ApiResponse<UserSearchResult>> {
    const response = await fetch(`${API_BASE_URL}/friends/search?email=${encodeURIComponent(email)}`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getBlockedUsers(): Promise<ApiResponse<BlockedUser[]>> {
    const response = await fetch(`${API_BASE_URL}/blocked`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async blockUser(userId: string): Promise<ApiResponse<BlockedUser>> {
    const response = await fetch(`${API_BASE_URL}/blocked`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ blockedId: userId }),
    });
    return handleResponse(response);
  },

  async unblockUser(userId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/blocked/${userId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getInviteCodes(): Promise<ApiResponse<InviteCode[]>> {
    const response = await fetch(`${API_BASE_URL}/invite-codes`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async generateInviteCode(daysUntilExpiry?: number): Promise<ApiResponse<InviteCode>> {
    const response = await fetch(`${API_BASE_URL}/invite-codes`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ daysUntilExpiry }),
    });
    return handleResponse(response);
  },

  async useInviteCode(code: string): Promise<ApiResponse<{ friendId: string; friendshipCreated: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/invite-codes/${code}/use`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async revokeInviteCode(codeId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/invite-codes/${codeId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async sendEmailInvite(email: string, message?: string): Promise<ApiResponse<{ success: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/invites/email`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ email, message }),
    });
    return handleResponse(response);
  },

  // Direct Messages
  async getDmConversations(): Promise<ApiResponse<DmConversation[]>> {
    const response = await fetch(`${API_BASE_URL}/dm/conversations`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async createDmConversation(participantId: string): Promise<ApiResponse<DmConversation>> {
    const response = await fetch(`${API_BASE_URL}/dm/conversations`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ participantId }),
    });
    return handleResponse(response);
  },

  async getDmMessages(conversationId: string, limit = 30, before?: string): Promise<ApiResponse<Message[]>> {
    const url = new URL(`${API_BASE_URL}/dm/conversations/${conversationId}`);
    url.searchParams.set('limit', limit.toString());
    if (before) {
      url.searchParams.set('before', before);
    }
    
    const response = await fetch(url.toString(), {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async sendDmMessage(conversationId: string, data: SendMessageInput): Promise<ApiResponse<Message>> {
    const response = await fetch(`${API_BASE_URL}/dm/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Bill Splits (Payments)
  async getBillSplits(tripId: string): Promise<ApiResponse<BillSplit[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/payments`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async createBillSplit(tripId: string, data: CreateBillSplitInput): Promise<ApiResponse<BillSplit>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/payments`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getBillSplit(billSplitId: string): Promise<ApiResponse<BillSplit>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async updateBillSplit(billSplitId: string, data: Partial<CreateBillSplitInput>): Promise<ApiResponse<BillSplit>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteBillSplit(billSplitId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getBillSplitMembers(billSplitId: string): Promise<ApiResponse<BillSplitMember[]>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}/members`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async addBillSplitMember(billSplitId: string, data: { userId: string; shares?: number; percentage?: number; dollarAmount?: number }): Promise<ApiResponse<BillSplitMember>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}/members`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async markBillSplitMemberPaid(billSplitId: string, userId: string, paymentMethod: string): Promise<ApiResponse<BillSplitMember>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}/members/${userId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify({ status: 'PAID', paymentMethod }),
    });
    return handleResponse(response);
  },

  async removeBillSplitMember(billSplitId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}/members/${userId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async confirmBillSplitPayment(billSplitId: string): Promise<ApiResponse<BillSplit>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}/confirm`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify({ read: true }),
    });
    return handleResponse(response);
  },

  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Settings
  async getSettings(): Promise<ApiResponse<Settings>> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async updateSettings(data: Partial<Settings>): Promise<ApiResponse<Settings>> {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/settings/password`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse(response);
  },

  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = await getHeaders();
    delete (headers as any)['Content-Type']; // Let browser set it for FormData

    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  async removeAvatar(): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/users/me/avatar`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // User
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },
};

export { ApiError };
