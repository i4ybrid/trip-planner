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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const isLoggingEnabled = process.env.NEXT_PUBLIC_API_LOGGING === 'true' || process.env.NODE_ENV !== 'production';

// Enhanced console logging for API calls
function consoleLogRequest(url: string, options: RequestInit) {
  const method = options.method || 'GET';
  const headers = options.headers as Record<string, string> || {};
  const userId = headers['x-user-id'] || 'none';
  
  console.groupCollapsed(`🌐 [API REQUEST] ${method} ${url.replace(API_BASE_URL, '')}`);
  console.log('📍 URL:', url);
  console.log('🔑 User ID:', userId);
  console.log('📝 Method:', method);
  if (options.body && method !== 'GET') {
    try {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
      console.log('📦 Body:', body);
    } catch {
      console.log('📦 Body:', options.body);
    }
  }
  console.groupEnd();
}

function consoleLogResponse(url: string, method: string, status: number, statusText: string, data: unknown, duration: number) {
  const statusIcon = status >= 200 && status < 300 ? '✅' : status >= 400 ? '❌' : '⚠️';
  
  console.groupCollapsed(`${statusIcon} [API RESPONSE] ${method} ${url.replace(API_BASE_URL, '')} - ${status} (${duration}ms)`);
  console.log('📊 Status:', status, statusText);
  console.log('⏱️ Duration:', duration, 'ms');
  if (data) {
    console.log('📥 Response:', data);
  }
  console.groupEnd();
}

function consoleLogError(url: string, method: string, error: Error) {
  console.groupCollapsed(`❌ [API ERROR] ${method} ${url.replace(API_BASE_URL, '')}`);
  console.error('🚨 Error:', error);
  console.groupEnd();
}

async function logToServer(level: string, message: string, extra: object = {}) {
  if (!isLoggingEnabled) return;
  
  try {
    await fetch(`${API_BASE_URL}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...extra
      }),
    });
  } catch (err) {
    // Fail silently to avoid infinite recursion or disrupting the UI
    console.error('Failed to send log to server:', err);
  }
}

function logApiCall(url: string, options: RequestInit, response?: Response, error?: Error) {
  if (!isLoggingEnabled) return;
  
  const method = options.method || 'GET';
  const timestamp = new Date().toISOString();
  let message = '';
  let level = 'INFO';
  
  if (error) {
    level = 'ERROR';
    message = `${method} ${url} - ERROR: ${error.message}`;
    console.log(`[API] ${timestamp} ${message}`);
  } else if (response) {
    message = `${method} ${url} - ${response.status} ${response.statusText}`;
    console.log(`[API] ${timestamp} ${message}`);
  } else {
    message = `${method} ${url}`;
    console.log(`[API] ${timestamp} ${message}`);
  }

  logToServer(level, `[API] ${message}`);
}

async function fetchWithLogging(url: string, options: RequestInit): Promise<Response> {
  const startTime = Date.now();
  consoleLogRequest(url, options);
  
  const response = await fetch(url, options);
  
  const duration = Date.now() - startTime;
  const method = options.method || 'GET';
  
  // Log response
  if (response.ok) {
    const data = await response.clone().json().catch(() => null);
    consoleLogResponse(url, method, response.status, response.statusText, data, duration);
  }
  
  return response;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const data = await response.json();
  
  if (!response.ok) {
    return { error: data.message || 'An error occurred' };
  }
  
  return { data: data as T };
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['x-user-id'] = token;
    }
  }
  
  return headers;
}


export class ApiService {
  protected async request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${path}`;
    const response = await fetchWithLogging(url, {
      ...options,
      headers: {
        ...getHeaders() as Record<string, string>,
        ...options.headers as Record<string, string>,
      },
    });
    return handleResponse(response);
  }

  // Trips
  getTrips() {
    return this.request<(TripMember & { trip: Trip })[]>('/trips');
  }

  getTrip(id: string) {
    return this.request<Trip>(`/trips/${id}`);
  }

  createTrip(data: CreateTripInput) {
    return this.request<Trip>('/trips', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateTrip(id: string, data: UpdateTripInput) {
    return this.request<Trip>(`/trips/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteTrip(id: string) {
    return this.request<void>(`/trips/${id}`, {
      method: 'DELETE',
    });
  }

  changeTripStatus(id: string, status: string) {
    return this.request<Trip>(`/trips/${id}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  // Trip Members
  getTripMembers(tripId: string) {
    return this.request<TripMember[]>(`/trips/${tripId}/members`);
  }

  addTripMember(tripId: string, userId: string) {
    return this.request<TripMember>(`/trips/${tripId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  removeTripMember(tripId: string, userId: string) {
    return this.request<void>(`/trips/${tripId}/members/${userId}`, {
      method: 'DELETE',
    });
  }

  confirmPayment(tripId: string, userId: string) {
    return this.request<TripMember>(`/trips/${tripId}/members/${userId}/confirm-payment`, {
      method: 'POST',
    });
  }

  // Activities
  getActivities(tripId: string) {
    return this.request<Activity[]>(`/trips/${tripId}/activities`);
  }

  createActivity(tripId: string, data: CreateActivityInput) {
    return this.request<Activity>(`/trips/${tripId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateActivity(id: string, data: Partial<CreateActivityInput>) {
    return this.request<Activity>(`/activities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  deleteActivity(id: string) {
    return this.request<void>(`/activities/${id}`, {
      method: 'DELETE',
    });
  }

  // Votes
  getVotes(activityId: string) {
    return this.request<Vote[]>(`/activities/${activityId}/votes`);
  }

  castVote(activityId: string, option: string) {
    return this.request<Vote>(`/activities/${activityId}/votes`, {
      method: 'POST',
      body: JSON.stringify({ option }),
    });
  }

  removeVote(activityId: string) {
    return this.request<void>(`/activities/${activityId}/votes`, {
      method: 'DELETE',
    });
  }

  // Invites
  getInvites(tripId: string) {
    return this.request<Invite[]>(`/trips/${tripId}/invites`);
  }

  createInvite(tripId: string, data: CreateInviteInput) {
    return this.request<Invite>(`/trips/${tripId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  acceptInvite(token: string) {
    return this.request<{ tripId: string }>(`/invites/${token}/accept`, {
      method: 'POST',
    });
  }

  declineInvite(token: string) {
    return this.request<void>(`/invites/${token}/decline`, {
      method: 'POST',
    });
  }

  // Bookings
  getBookings(tripId: string) {
    return this.request<Booking[]>(`/trips/${tripId}/bookings`);
  }

  createBooking(tripId: string, data: { activityId?: string; notes?: string }) {
    return this.request<Booking>(`/trips/${tripId}/bookings`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  updateBooking(id: string, data: { status?: string; confirmationNum?: string }) {
    return this.request<Booking>(`/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Messages
  getMessages(tripId: string) {
    return this.request<TripMessage[]>(`/trips/${tripId}/messages`);
  }

  sendMessage(tripId: string, data: SendMessageInput) {
    return this.request<TripMessage>(`/trips/${tripId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Direct Messages
  getDirectMessages(userId: string) {
    return this.request<DirectMessage[]>(`/messages/${userId}`);
  }

  sendDirectMessage(userId: string, data: SendMessageInput) {
    return this.request<DirectMessage>(`/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Media
  getMedia(tripId: string) {
    return this.request<MediaItem[]>(`/trips/${tripId}/media`);
  }

  async uploadMedia(tripId: string, file: File): Promise<ApiResponse<MediaItem>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: HeadersInit = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      headers['x-user-id'] = token;
    }

    const response = await fetchWithLogging(`${API_BASE_URL}/trips/${tripId}/media`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  }

  // Notifications
  getNotifications() {
    return this.request<Notification[]>('/notifications');
  }

  markNotificationRead(id: string) {
    return this.request<void>(`/notifications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });
  }

  markAllNotificationsRead() {
    return this.request<void>('/notifications/mark-all-read', {
      method: 'POST',
    });
  }

  // User
  getCurrentUser() {
    return this.request<User>('/users/me');
  }

  updateProfile(data: Partial<User>) {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  getUser(id: string) {
    return this.request<User>(`/users/${id}`);
  }
}

export const api = new ApiService();

export { ApiError };
