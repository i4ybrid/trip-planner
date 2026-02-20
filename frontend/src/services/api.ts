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

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(response.status, error.message || 'An error occurred');
  }
  return response.json();
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

export const api = {
  // Trips
  async getTrips(): Promise<ApiResponse<Trip[]>> {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async getTrip(id: string): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createTrip(data: CreateTripInput): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateTrip(id: string, data: UpdateTripInput): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteTrip(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async changeTripStatus(id: string, status: string): Promise<ApiResponse<Trip>> {
    const response = await fetch(`${API_BASE_URL}/trips/${id}/status`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  },

  // Trip Members
  async getTripMembers(tripId: string): Promise<ApiResponse<TripMember[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async addTripMember(tripId: string, userId: string): Promise<ApiResponse<TripMember>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    return handleResponse(response);
  },

  async removeTripMember(tripId: string, userId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async confirmPayment(tripId: string, userId: string): Promise<ApiResponse<TripMember>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}/confirm-payment`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Activities
  async getActivities(tripId: string): Promise<ApiResponse<Activity[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createActivity(tripId: string, data: CreateActivityInput): Promise<ApiResponse<Activity>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/activities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateActivity(id: string, data: Partial<CreateActivityInput>): Promise<ApiResponse<Activity>> {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async deleteActivity(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/activities/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Votes
  async getVotes(activityId: string): Promise<ApiResponse<Vote[]>> {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}/votes`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async castVote(activityId: string, option: string): Promise<ApiResponse<Vote>> {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}/votes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ option }),
    });
    return handleResponse(response);
  },

  async removeVote(activityId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/activities/${activityId}/votes`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Invites
  async getInvites(tripId: string): Promise<ApiResponse<Invite[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/invites`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createInvite(tripId: string, data: CreateInviteInput): Promise<ApiResponse<Invite>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/invites`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async acceptInvite(token: string): Promise<ApiResponse<{ tripId: string }>> {
    const response = await fetch(`${API_BASE_URL}/invites/${token}/accept`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async declineInvite(token: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/invites/${token}/decline`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Bookings
  async getBookings(tripId: string): Promise<ApiResponse<Booking[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/bookings`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async createBooking(tripId: string, data: { activityId?: string; notes?: string }): Promise<ApiResponse<Booking>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/bookings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async updateBooking(id: string, data: { status?: string; confirmationNum?: string }): Promise<ApiResponse<Booking>> {
    const response = await fetch(`${API_BASE_URL}/bookings/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Messages
  async getMessages(tripId: string): Promise<ApiResponse<TripMessage[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/messages`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async sendMessage(tripId: string, data: SendMessageInput): Promise<ApiResponse<TripMessage>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Media
  async getMedia(tripId: string): Promise<ApiResponse<MediaItem[]>> {
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/media`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async uploadMedia(tripId: string, file: File): Promise<ApiResponse<MediaItem>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const headers: HeadersInit = {};
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_BASE_URL}/trips/${tripId}/media`, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(response);
  },

  // Notifications
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    const response = await fetch(`${API_BASE_URL}/notifications`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async markNotificationRead(id: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ read: true }),
    });
    return handleResponse(response);
  },

  async markAllNotificationsRead(): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // User
  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  async getUser(id: string): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

export { ApiError };
