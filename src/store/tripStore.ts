import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LensId, Stop, TripState } from '../domain/types'
import {
  editStop as editStopIn,
  insertStop,
  moveStop as moveStopIn,
  removeStop,
  type StopDraft,
} from '../domain/stops'
import { seed } from './seed'

interface TripStore extends TripState {
  lens: LensId
  selectedNodeId: string | null
  setLens: (lens: LensId) => void
  select: (id: string | null) => void
  updateStop: (id: string, patch: Partial<Stop>) => void
  addStop: (draft: StopDraft) => void
  deleteStop: (id: string) => void
  moveStop: (id: string, direction: 'up' | 'down') => void
  editStop: (id: string, draft: StopDraft) => void
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
      addStop: (draft) =>
        set((state) => {
          const stops = insertStop(state.stops, draft)
          const added = stops.find((s) => !state.stops.some((old) => old.id === s.id))
          return { stops, selectedNodeId: added ? added.id : state.selectedNodeId }
        }),
      deleteStop: (id) =>
        set((state) => ({
          stops: removeStop(state.stops, id),
          // A drawer showing a stop that no longer exists would render blank.
          selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
        })),
      moveStop: (id, direction) =>
        set((state) => ({ stops: moveStopIn(state.stops, id, direction) })),
      editStop: (id, draft) =>
        set((state) => ({ stops: editStopIn(state.stops, id, draft) })),
      reset: () => set(initial()),
    }),
    {
      name: 'travel-planner',
      // An allowlist of trip data. Anything added to the store later has to be
      // added here by hand or it silently stops persisting.
      //
      // selectedNodeId is transient UI state, not trip data. Persisting it made
      // a reload restore whatever node was last clicked, so the app booted with
      // a drawer covering the map.
      //
      // lens is excluded for the same class of reason: until Phase 4 ships the
      // itinerary and people builders the canvas can only render categories, so
      // a persisted lens could boot the app labelled "People" over a categories
      // map. Add it back when every lens has a builder.
      partialize: (state) => ({
        trip: state.trip,
        members: state.members,
        stops: state.stops,
        bookings: state.bookings,
        expenses: state.expenses,
      }),
      // partialize only governs what gets written. Entries written before a
      // field left the allowlist still carry it, and zustand's default merge
      // lets the persisted value win over the initial state, so one stale
      // reload would still open a drawer or select an unrenderable lens. Pin
      // both transient fields on the way in. The lens pin comes out in Phase 4
      // together with the disabled flags in Header.tsx.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<TripStore>),
        lens: 'categories' as LensId,
        selectedNodeId: null,
      }),
    },
  ),
)
