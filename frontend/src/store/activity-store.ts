import { create } from 'zustand';
import { Activity, CreateActivityInput, Vote, VoteOption } from '@/types';
import { mockApi } from '@/services/mock-api';

interface ActivityState {
  activities: Activity[];
  isLoading: boolean;
  error: string | null;
  
  fetchActivities: (tripId: string) => Promise<void>;
  createActivity: (tripId: string, input: CreateActivityInput) => Promise<Activity | null>;
  castVote: (activityId: string, option: VoteOption) => Promise<Vote | null>;
  removeVote: (activityId: string) => Promise<boolean>;
  clearActivities: () => void;
  clearError: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  isLoading: false,
  error: null,

  fetchActivities: async (tripId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.getActivities(tripId);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }
      set({ activities: response.data || [], isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch activities', isLoading: false });
    }
  },

  createActivity: async (tripId: string, input: CreateActivityInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.createActivity(tripId, 'user-1', input);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return null;
      }
      const newActivity = response.data!;
      set((state) => ({
        activities: [...state.activities, newActivity],
        isLoading: false,
      }));
      return newActivity;
    } catch (error) {
      set({ error: 'Failed to create activity', isLoading: false });
      return null;
    }
  },

  castVote: async (activityId: string, option: VoteOption) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.castVote(activityId, 'user-1', option);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return null;
      }
      set((state) => {
        const activities = state.activities.map((a) => {
          if (a.id === activityId) {
            const existingVoteIndex = (a.votes || []).findIndex(v => v.userId === 'user-1');
            const newVotes = [...(a.votes || [])];
            if (existingVoteIndex >= 0) {
              newVotes[existingVoteIndex] = response.data!;
            } else {
              newVotes.push(response.data!);
            }
            return { ...a, votes: newVotes };
          }
          return a;
        });
        return { activities, isLoading: false };
      });
      return response.data!;
    } catch (error) {
      set({ error: 'Failed to cast vote', isLoading: false });
      return null;
    }
  },

  removeVote: async (activityId: string) => {
    set({ isLoading: true, error: null });
    try {
      set((state) => {
        const activities = state.activities.map((a) => {
          if (a.id === activityId) {
            return { ...a, votes: (a.votes || []).filter(v => v.userId !== 'user-1') };
          }
          return a;
        });
        return { activities, isLoading: false };
      });
      return true;
    } catch (error) {
      set({ error: 'Failed to remove vote', isLoading: false });
      return false;
    }
  },

  clearActivities: () => {
    set({ activities: [], error: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
