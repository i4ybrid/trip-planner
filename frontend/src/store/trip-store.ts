import { create } from 'zustand';
import { Trip, CreateTripInput, UpdateTripInput, TripStatus } from '@/types';
import { mockApi } from '@/services/mock-api';

interface TripState {
  trips: Trip[];
  currentTrip: Trip | null;
  isLoading: boolean;
  error: string | null;
  
  fetchTrips: () => Promise<void>;
  fetchTrip: (id: string) => Promise<void>;
  createTrip: (input: CreateTripInput) => Promise<Trip | null>;
  updateTrip: (id: string, input: UpdateTripInput) => Promise<Trip | null>;
  deleteTrip: (id: string) => Promise<boolean>;
  changeStatus: (id: string, status: TripStatus) => Promise<Trip | null>;
  setCurrentTrip: (trip: Trip | null) => void;
  clearError: () => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  currentTrip: null,
  isLoading: false,
  error: null,

  fetchTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.getTrips();
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }
      set({ trips: response.data || [], isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch trips', isLoading: false });
    }
  },

  fetchTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.getTrip(id);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return;
      }
      set({ currentTrip: response.data || null, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch trip', isLoading: false });
    }
  },

  createTrip: async (input: CreateTripInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.createTrip('user-1', input);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return null;
      }
      const newTrip = response.data!;
      set((state) => ({
        trips: [...state.trips, newTrip],
        isLoading: false,
      }));
      return newTrip;
    } catch (error) {
      set({ error: 'Failed to create trip', isLoading: false });
      return null;
    }
  },

  updateTrip: async (id: string, input: UpdateTripInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.updateTrip(id, input);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return null;
      }
      const updated = response.data!;
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? updated : t)),
        currentTrip: state.currentTrip?.id === id ? updated : state.currentTrip,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({ error: 'Failed to update trip', isLoading: false });
      return null;
    }
  },

  deleteTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.deleteTrip(id);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return false;
      }
      set((state) => ({
        trips: state.trips.filter((t) => t.id !== id),
        currentTrip: state.currentTrip?.id === id ? null : state.currentTrip,
        isLoading: false,
      }));
      return true;
    } catch (error) {
      set({ error: 'Failed to delete trip', isLoading: false });
      return false;
    }
  },

  changeStatus: async (id: string, status: TripStatus) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockApi.changeTripStatus(id, status);
      if (response.error) {
        set({ error: response.error, isLoading: false });
        return null;
      }
      const updated = response.data!;
      set((state) => ({
        trips: state.trips.map((t) => (t.id === id ? updated : t)),
        currentTrip: state.currentTrip?.id === id ? updated : state.currentTrip,
        isLoading: false,
      }));
      return updated;
    } catch (error) {
      set({ error: 'Failed to change status', isLoading: false });
      return null;
    }
  },

  setCurrentTrip: (trip: Trip | null) => {
    set({ currentTrip: trip });
  },

  clearError: () => {
    set({ error: null });
  },
}));
