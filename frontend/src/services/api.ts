import {
  Trip,
  TripMember,
  TripStyle,
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

// ============================================================================
// CACHING LAYER
// ============================================================================
const CACHE_TTL = 30000; // 30 seconds default TTL
const cache = new Map<string, { data: any; timestamp: number }>();

interface CacheEntry {
  data: any;
  timestamp: number;
}

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

export function setCache(key: string, data: any, ttl?: number): void {
  const actualTTL = ttl ?? CACHE_TTL;
  // For mutable data like arrays/objects, store a clone to prevent mutations
  cache.set(key, { data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() + actualTTL - CACHE_TTL });
}

export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    cache.clear();
    return;
  }
  // Invalidate keys matching pattern (e.g., 'trip:' to invalidate all trip-related cache)
  Array.from(cache.keys()).forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

export function invalidateCacheByPrefix(prefix: string): void {
  Array.from(cache.keys()).forEach(key => {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  });
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// ============================================================================
// REQUEST DEDUPLICATION
// ============================================================================
const inFlightRequests = new Map<string, Promise<any>>();

export async function deduplicatedFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  // If there's an in-flight request for this key, wait for it instead of starting a new one
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }
  
  const promise = fetcher()
    .finally(() => {
      // Delay deletion slightly to handle rapid concurrent calls
      setTimeout(() => inFlightRequests.delete(key), 0);
    });
  
  inFlightRequests.set(key, promise);
  return promise;
}

// ============================================================================
// ABORT CONTROLLER HELPERS
// ============================================================================
export function createAbortableFetch<T>(
  url: string,
  options?: RequestInit
): { promise: Promise<T>; controller: AbortController } {
  const controller = new AbortController();
  const promise = fetch(url, { ...options, signal: controller.signal })
    .then(handleResponse<T>)
    .finally(() => inFlightRequests.delete(url));
  
  return { promise, controller };
}

// ============================================================================
// HTTP HELPERS
// ============================================================================

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
    const cacheKey = 'trips:list';
    const cached = getCached<ApiResponse<Trip[]>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<Trip[]>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<Trip[]>>(response);
      setCache(cacheKey, result);
      return result;
    });
  },

  async getTrip(id: string): Promise<ApiResponse<Trip>> {
    const cacheKey = `trip:${id}`;
    const cached = getCached<ApiResponse<Trip>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<Trip>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<Trip>>(response);
      setCache(cacheKey, result);
      return result;
    });
  },

  async createTrip(data: CreateTripInput): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<ApiResponse<Trip>>(response);
    // Invalidate trips list cache since we added a new one
    invalidateCacheByPrefix('trips:');
    return result;
  },

  async updateTrip(id: string, data: UpdateTripInput & { style?: TripStyle }): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<ApiResponse<Trip>>(response);
    // Invalidate caches since data changed
    invalidateCacheByPrefix(`trip:${id}`);
    invalidateCacheByPrefix('trips:');
    return result;
  },

  async deleteTrip(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    const result = await handleResponse<ApiResponse<void>>(response);
    // Invalidate caches
    invalidateCacheByPrefix(`trip:${id}`);
    invalidateCacheByPrefix('trips:');
    return result;
  },

  async changeTripStatus(id: string, status: string): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}/status`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ status }),
    });
    const result = await handleResponse<ApiResponse<Trip>>(response);
    // Invalidate caches
    invalidateCacheByPrefix(`trip:${id}`);
    invalidateCacheByPrefix('trips:');
    return result;
  },

  async getTripTimeline(tripId: string): Promise<ApiResponse<TimelineEvent[]>> {
    const cacheKey = `trip:${tripId}:timeline`;
    const cached = getCached<ApiResponse<TimelineEvent[]>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<TimelineEvent[]>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/timeline`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<TimelineEvent[]>>(response);
      setCache(cacheKey, result);
      return result;
    });
  },

  // Trip Members
  async getTripMembers(tripId: string): Promise<ApiResponse<TripMember[]>> {
    const cacheKey = `trip:${tripId}:members`;
    const cached = getCached<ApiResponse<TripMember[]>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<TripMember[]>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<TripMember[]>>(response);
      setCache(cacheKey, result);
      return result;
    });
  },

  async addTripMember(tripId: string, userId: string): Promise<ApiResponse<TripMember>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ userId }),
    });
    const result = await handleResponse<ApiResponse<TripMember>>(response);
    invalidateCacheByPrefix(`trip:${tripId}:members`);
    return result;
  },

  async updateTripMember(tripId: string, userId: string, data: { role?: string; status?: string }): Promise<ApiResponse<TripMember>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
      method: 'PATCH',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<ApiResponse<TripMember>>(response);
    invalidateCacheByPrefix(`trip:${tripId}:members`);
    return result;
  },

  async removeTripMember(tripId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    const result = await handleResponse<ApiResponse<void>>(response);
    invalidateCacheByPrefix(`trip:${tripId}:members`);
    return result;
  },

  // Trip Invite Codes
  async generateTripInviteCode(tripId: string): Promise<ApiResponse<Invite>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/invites`, {
      method: 'POST',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async useTripInviteCode(code: string): Promise<ApiResponse<{ tripId: string; tripName: string; status: string }>> {
    const response = await fetch(`${API_BASE_URL}/invites/code/use`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ code }),
    });
    return handleResponse(response);
  },

  async sendTripEmailInvite(tripId: string, email: string): Promise<ApiResponse<{ success: boolean; message: string; existingUserNotified: boolean }>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/invites/email`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Activities
  async getActivities(tripId: string): Promise<ApiResponse<Activity[]>> {
    const cacheKey = `trip:${tripId}:activities`;
    const cached = getCached<ApiResponse<Activity[]>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<Activity[]>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<Activity[]>>(response);
      setCache(cacheKey, result);
      return result;
    });
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
    const cacheKey = `trip:${tripId}:billsplits`;
    const cached = getCached<ApiResponse<BillSplit[]>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<BillSplit[]>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/payments`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<BillSplit[]>>(response);
      setCache(cacheKey, result);
      return result;
    });
  },

  async createBillSplit(tripId: string, data: CreateBillSplitInput): Promise<ApiResponse<BillSplit>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/payments`, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await handleResponse<ApiResponse<BillSplit>>(response);
    // Invalidate related caches
    invalidateCacheByPrefix(`trip:${tripId}:billsplits`);
    invalidateCacheByPrefix(`trip:${tripId}:debts`);
    return result;
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
    const result = await handleResponse<ApiResponse<BillSplit>>(response);
    // Invalidate caches - we need to find the tripId from the billSplitId
    // For simplicity, invalidate all bill split and debt caches
    invalidateCacheByPrefix('billsplits');
    invalidateCacheByPrefix('debts');
    return result;
  },

  async deleteBillSplit(billSplitId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/payments/${billSplitId}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    const result = await handleResponse<ApiResponse<void>>(response);
    invalidateCacheByPrefix('billsplits');
    invalidateCacheByPrefix('debts');
    return result;
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
    const result = await handleResponse<ApiResponse<BillSplitMember>>(response);
    invalidateCacheByPrefix('billsplits');
    invalidateCacheByPrefix('debts');
    return result;
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
    const result = await handleResponse<ApiResponse<BillSplit>>(response);
    invalidateCacheByPrefix('billsplits');
    invalidateCacheByPrefix('debts');
    return result;
  },

  // Debt Simplification
  async getSimplifiedDebts(tripId: string): Promise<ApiResponse<{ balances: { userId: string; name: string; balance: number }[]; settlements: { from: string; fromName: string; to: string; toName: string; amount: number }[] }>> {
    const cacheKey = `trip:${tripId}:debts`;
    const cached = getCached<ApiResponse<any>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<any>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/debt-simplify`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<any>>(response);
      setCache(cacheKey, result);
      return result;
    });
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    const cacheKey = 'notifications:list';
    const cached = getCached<ApiResponse<Notification[]>>(cacheKey);
    if (cached) return cached;
    
    return deduplicatedFetch<ApiResponse<Notification[]>>(cacheKey, async () => {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: await getHeaders(),
      });
      const result = await handleResponse<ApiResponse<Notification[]>>(response);
      setCache(cacheKey, result);
      return result;
    });
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

  async getUnreadNotificationCount(): Promise<ApiResponse<number>> {
    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'DELETE',
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  // Calendar Export
  async getCalendarEvents(tripId: string): Promise<ApiResponse<any[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/calendar`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getCalendarGoogleUrl(tripId: string): Promise<ApiResponse<{ url: string; eventCount: number }>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/calendar/google`, {
      headers: await getHeaders(),
    });
    return handleResponse(response);
  },

  async getCalendarOutlookUrl(tripId: string): Promise<ApiResponse<{ url: string; eventCount: number }>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/calendar/outlook`, {
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
