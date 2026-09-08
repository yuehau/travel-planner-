import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LensId, Stop, TripState } from '../domain/types'
import { seed } from './seed'

interface TripStore extends TripState {
  lens: LensId
  selectedNodeId: string | null
  setLens: (lens: LensId) => void
  select: (id: string | null) => void
  updateStop: (id: string, patch: Partial<Stop>) => void
  reset: () => void
}

const initial = () => ({
  ...structuredClone(seed),
  lens: 'categories' as LensId,
  selectedNodeId: null,
})

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      ...initial(),
      setLens: (lens) => set({ lens }),
      select: (selectedNodeId) => set({ selectedNodeId }),
      updateStop: (id, patch) =>
        set((state) => ({
          stops: state.stops.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      reset: () => set(initial()),
    }),
    {
      name: 'travel-planner',
      // selectedNodeId is transient UI state, not trip data. Persisting it made
      // a reload restore whatever node was last clicked, so the app booted with
      // a drawer covering the map. lens stays persisted on purpose.
      partialize: (state) => ({
        trip: state.trip,
        members: state.members,
        stops: state.stops,
        bookings: state.bookings,
        expenses: state.expenses,
        lens: state.lens,
      }),
      // partialize only governs what gets written. Entries written before it
      // existed still carry a selectedNodeId, and zustand's default merge lets
      // the persisted value win over the initial state, so one stale reload
      // would still open a drawer. Pin the transient field on the way in.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<TripStore>),
        selectedNodeId: null,
      }),
    },
  ),
)
