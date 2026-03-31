import { create } from 'zustand';
import { User } from '@/types';
import { api } from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setUser: (user: User | null) => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    });
  },

  clearSession: () => {
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
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
    } catch (error: any) {
      set({ error: error.message || 'Failed to update profile', isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
