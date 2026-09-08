import { beforeEach, describe, expect, it } from 'vitest'
import { useTripStore } from '../../store/tripStore'

describe('trip store', () => {
  beforeEach(() => {
    useTripStore.getState().reset()
  })

  it('starts from the seed fixture', () => {
    expect(useTripStore.getState().trip.destination).toBe('Penang')
    expect(useTripStore.getState().stops).toHaveLength(11)
  })

  it('defaults to the categories lens with nothing selected', () => {
    expect(useTripStore.getState().lens).toBe('categories')
    expect(useTripStore.getState().selectedNodeId).toBeNull()
  })

  it('switches lens', () => {
    useTripStore.getState().setLens('people')
    expect(useTripStore.getState().lens).toBe('people')
  })

  it('selects and clears a node', () => {
    useTripStore.getState().select('s3')
    expect(useTripStore.getState().selectedNodeId).toBe('s3')
    useTripStore.getState().select(null)
    expect(useTripStore.getState().selectedNodeId).toBeNull()
  })

  it('patches a single stop without touching the others', () => {
    useTripStore.getState().updateStop('s3', { name: 'Renamed', costPerPerson: 99 })
    const stops = useTripStore.getState().stops
    const changed = stops.find((s) => s.id === 's3')!
    expect(changed.name).toBe('Renamed')
    expect(changed.costPerPerson).toBe(99)
    expect(changed.start).toBe('19:30')
    expect(stops.find((s) => s.id === 's4')!.name).toBe('Gurney Drive hawker centre')
  })

  it('restores the seed on reset', () => {
    useTripStore.getState().updateStop('s3', { name: 'Renamed' })
    useTripStore.getState().reset()
    expect(useTripStore.getState().stops.find((s) => s.id === 's3')!.name)
      .toBe('Chulia Street night market')
  })

  it('writes to localStorage under the travel-planner key', () => {
    useTripStore.getState().updateStop('s3', { name: 'Persisted' })
    expect(localStorage.getItem('travel-planner')).toContain('Persisted')
  })
})
