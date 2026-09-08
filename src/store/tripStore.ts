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
    { name: 'travel-planner' },
  ),
)
