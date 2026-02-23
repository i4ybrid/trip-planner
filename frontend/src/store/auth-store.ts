import { create } from 'zustand';
import { User, ApiResponse } from '@/types';
import { api } from '@/services';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  fetchUser: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  fetchUser: async () => {
    console.log('====== [AuthStore fetchUser] START ======');
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    console.log('[AuthStore fetchUser] token from localStorage:', token);
    console.log('[AuthStore fetchUser] token type:', typeof token);
    console.log('[AuthStore fetchUser] token === null:', token === null);

    if (!token) {
      console.log('[AuthStore fetchUser] No token found, exiting');
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    console.log('[AuthStore fetchUser] Setting isLoading=true');
    set({ isLoading: true, error: null });
    try {
      console.log('[AuthStore fetchUser] About to call api.getCurrentUser()');
      const response = await api.getCurrentUser();
      console.log('====== [AuthStore fetchUser] API response ======');
      console.log('[AuthStore fetchUser] response:', response);
      console.log('[AuthStore fetchUser] response.data:', response.data);
      console.log('[AuthStore fetchUser] response.error:', response.error);
      console.log('[AuthStore fetchUser] typeof response.data:', typeof response.data);
      console.log('[AuthStore fetchUser] response.data === undefined:', response.data === undefined);
      console.log('[AuthStore fetchUser] response.data === null:', response.data === null);
      console.log('===========================================');

      if (response.error) {
        console.log('[AuthStore fetchUser] response.error exists:', response.error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        set({ error: response.error, isLoading: false, isAuthenticated: false });
        return;
      }
      
      console.log('[AuthStore fetchUser] Setting user to:', response.data);
      console.log('[AuthStore fetchUser] !!response.data:', !!response.data);
      set({
        user: response.data || null,
        isAuthenticated: !!response.data,
        isLoading: false
      });
      console.log('[AuthStore fetchUser] User set, state updated');
    } catch (error) {
      console.log('[AuthStore fetchUser] Caught error:', error);
      set({ error: 'Failed to fetch user', isLoading: false, isAuthenticated: false });
    }
    console.log('====== [AuthStore fetchUser] END ======');
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const userId = email;
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', userId);
      }

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const response = await Promise.race([
        api.getCurrentUser(),
        timeoutPromise
      ]) as ApiResponse<User>;

      if (response.error) {
        set({ error: response.error, isLoading: false });
        return false;
      }
      set({
        user: response.data || null,
        isAuthenticated: true,
        isLoading: false
      });
      return true;
    } catch (error) {
      set({ error: 'Login failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateUser: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.updateProfile(data);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }
      set({ user: response.data || null, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to update profile', isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
