import { beforeEach, describe, expect, it } from 'vitest'
import { DEFAULT_COORDS, type StopDraft } from '../stops'
import { seed } from '../../store/seed'
import { useTripStore } from '../../store/tripStore'

describe('trip store', () => {
  beforeEach(() => {
    localStorage.clear()
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

  it('keeps transient UI state out of what it writes', () => {
    useTripStore.getState().select('s3')
    const written = localStorage.getItem('travel-planner')!
    expect(written).toContain('Chulia Street night market')
    expect(written).not.toContain('selectedNodeId')
    expect(written).not.toContain('lens')
  })

  it('drops a stale selectedNodeId and lens when rehydrating an old payload', async () => {
    localStorage.setItem(
      'travel-planner',
      JSON.stringify({
        state: { ...seed, selectedNodeId: 's3', lens: 'people' },
        version: 0,
      }),
    )
    expect(localStorage.getItem('travel-planner')).toContain('"selectedNodeId":"s3"')

    await useTripStore.persist.rehydrate()

    expect(useTripStore.getState().selectedNodeId).toBeNull()
    expect(useTripStore.getState().lens).toBe('categories')
    // The trip data in the payload still wins — only the transient fields are pinned.
    expect(useTripStore.getState().stops).toHaveLength(11)
  })
})

const draft: StopDraft = {
  day: 1,
  name: 'Penang Botanic Gardens',
  start: '09:00',
  durationMin: 60,
  costPerPerson: 0,
  lat: DEFAULT_COORDS.lat,
  lng: DEFAULT_COORDS.lng,
  category: 'nature',
  serves: ['m3'],
  conflicts: [],
  reason: 'A slow green hour for Mei.',
}

describe('editing actions', () => {
  beforeEach(() => {
    useTripStore.getState().reset()
  })

  it('adds a stop and selects it', () => {
    useTripStore.getState().addStop(draft)
    const state = useTripStore.getState()
    expect(state.stops).toHaveLength(12)
    const added = state.stops.find((s) => s.name === 'Penang Botanic Gardens')!
    expect(added.id).toBe('s12')
    expect(state.selectedNodeId).toBe('s12')
  })

  it('persists an added stop', () => {
    useTripStore.getState().addStop(draft)
    expect(localStorage.getItem('travel-planner')).toContain('Penang Botanic Gardens')
  })

  it('deletes a stop and renumbers its day', () => {
    useTripStore.getState().deleteStop('s2')
    const stops = useTripStore.getState().stops
    expect(stops).toHaveLength(10)
    expect(stops.filter((s) => s.day === 1).map((s) => s.order).sort()).toEqual([1, 2, 3])
  })

  it('clears the selection when the selected stop is deleted', () => {
    useTripStore.getState().select('s2')
    useTripStore.getState().deleteStop('s2')
    expect(useTripStore.getState().selectedNodeId).toBeNull()
  })

  it('leaves an unrelated selection alone when deleting', () => {
    useTripStore.getState().select('s7')
    useTripStore.getState().deleteStop('s2')
    expect(useTripStore.getState().selectedNodeId).toBe('s7')
  })

  it('reorders within a day', () => {
    useTripStore.getState().moveStop('s2', 'up')
    const day1 = useTripStore.getState().stops
      .filter((s) => s.day === 1)
      .sort((a, b) => a.order - b.order)
      .map((s) => s.id)
    expect(day1).toEqual(['s2', 's1', 's3', 's4'])
  })

  it('edits a stop in place', () => {
    const s2 = useTripStore.getState().stops.find((s) => s.id === 's2')!
    const { id: _id, order: _order, ...rest } = s2
    useTripStore.getState().editStop('s2', { ...rest, name: 'Renamed' })
    expect(useTripStore.getState().stops.find((s) => s.id === 's2')!.name).toBe('Renamed')
  })

  it('keeps both days contiguous when an edit moves a stop to another day', () => {
    const s2 = useTripStore.getState().stops.find((s) => s.id === 's2')!
    const { id: _id, order: _order, ...rest } = s2
    useTripStore.getState().editStop('s2', { ...rest, day: 3 })
    const stops = useTripStore.getState().stops
    const orders = (day: number) =>
      stops.filter((s) => s.day === day).map((s) => s.order).sort((a, b) => a - b)
    expect(orders(1)).toEqual([1, 2, 3])
    expect(orders(3)).toEqual([1, 2, 3, 4])
    expect(stops.find((s) => s.id === 's2')!.day).toBe(3)
  })

  it('restores the seed on reset after edits', () => {
    useTripStore.getState().addStop(draft)
    useTripStore.getState().deleteStop('s1')
    useTripStore.getState().reset()
    expect(useTripStore.getState().stops).toHaveLength(11)
    expect(useTripStore.getState().stops.find((s) => s.id === 's1')!.name).toBe('Chew Jetty')
  })
})
