import { create } from 'zustand';
import { Trip, TripMember, CreateTripInput, UpdateTripInput, TripStatus } from '@/types';
import { api } from '@/services';

const DEBUG = process.env.NEXT_PUBLIC_DEBUG === 'true';
const debugLog = DEBUG ? console.log.bind(console) : () => {};

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
    console.log('====== [TripStore fetchTrips] START ======');
    set({ isLoading: true, error: null });
    try {
      console.log('[TripStore fetchTrips] Calling api.getTrips()');
      const response = await api.getTrips();
      console.log('[TripStore fetchTrips] Raw response:', response);
      console.log('[TripStore fetchTrips] response.data:', response.data);
      console.log('[TripStore fetchTrips] response.data type:', Array.isArray(response.data) ? 'array' : typeof response.data);
      console.log('[TripStore fetchTrips] response.data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
      console.log('[TripStore fetchTrips] response.error:', response.error);

      if (response.error) {
        console.log('[TripStore fetchTrips] Has error, setting error state');
        set({ error: response.error, isLoading: false });
        return;
      }

      // Backend returns TripMember[] with embedded trip objects
      const tripMembers = response.data;

      console.log('[TripStore fetchTrips] tripMembers count:', tripMembers.length);
      if (tripMembers.length > 0) {
        console.log('[TripStore fetchTrips] First tripMember:', tripMembers[0]);
        console.log('[TripStore fetchTrips] First tripMember has trip?', 'trip' in tripMembers[0]);
        if ('trip' in tripMembers[0]) {
          console.log('[TripStore fetchTrips] First tripMember.trip:', tripMembers[0].trip);
        }
      }

      // Extract trips from TripMember objects
      const trips = tripMembers
        .filter(m => {
          const hasTrip = m && m.trip;
          console.log('[TripStore fetchTrips] Filter member:', m.id, 'hasTrip:', hasTrip);
          return hasTrip;
        })
        .map(m => {
          console.log('[TripStore fetchTrips] Mapping member to trip:', m.trip);
          return m.trip!;
        });

      console.log('[TripStore fetchTrips] Extracted trips count:', trips.length);
      console.log('[TripStore fetchTrips] Extracted trips:', trips);
      console.log('[TripStore fetchTrips] About to set state with trips:', trips);

      set({ trips, isLoading: false });
      console.log('[TripStore fetchTrips] State updated, current state trips:', get().trips);
    } catch (error) {
      console.log('[TripStore fetchTrips] Caught error:', error);
      set({ error: 'Failed to fetch trips', isLoading: false });
    }
    console.log('====== [TripStore fetchTrips] END ======');
  },

  fetchTrip: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.getTrip(id);
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
    debugLog('[TripStore] createTrip called with input:', input);
    set({ isLoading: true, error: null });
    try {
      debugLog('[TripStore] Calling API createTrip...');
      const response = await api.createTrip(input);
      debugLog('[TripStore] API response:', response);
      if (response.error) {
        debugLog('[TripStore] API error:', response.error);
        set({ error: response.error, isLoading: false });
        return null;
      }
      const newTrip = response.data!;
      debugLog('[TripStore] Created trip:', newTrip);
      set((state) => ({
        trips: [...state.trips, newTrip],
        isLoading: false,
      }));
      return newTrip;
    } catch (error) {
      console.error('[TripStore] Exception:', error);
      set({ error: 'Failed to create trip', isLoading: false });
      return null;
    }
  },

  updateTrip: async (id: string, input: UpdateTripInput) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.updateTrip(id, input);
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
      const response = await api.deleteTrip(id);
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
      const response = await api.changeTripStatus(id, status);
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
