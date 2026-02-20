import { create } from 'zustand';
import { User } from '@/types';
import { mockApi } from '@/services/mock-api';

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

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  fetchUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.getCurrentUser();
      if (response.error) {
        set({ error: response.error, isLoading: false, isAuthenticated: false });
        return;
      }
      set({ 
        user: response.data || null, 
        isAuthenticated: !!response.data, 
        isLoading: false 
      });
    } catch (error) {
      set({ error: 'Failed to fetch user', isLoading: false, isAuthenticated: false });
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.getCurrentUser();
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
    set({ user: null, isAuthenticated: false, error: null });
  },

  updateUser: async (data: Partial<User>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.updateProfile(data);
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
