import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COORDS,
  editStop,
  insertStop,
  moveStop,
  nextStopId,
  removeStop,
  validateStop,
  type StopDraft,
} from '../stops'
import { seed } from '../../store/seed'

const valid: StopDraft = {
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

describe('nextStopId', () => {
  it('follows the highest existing numeric suffix', () => {
    expect(nextStopId(seed.stops)).toBe('s12')
  })

  it('does not reuse an id after a gap', () => {
    const withGap = seed.stops.filter((s) => s.id !== 's5')
    expect(nextStopId(withGap)).toBe('s12')
  })

  it('starts at s1 when there are no stops', () => {
    expect(nextStopId([])).toBe('s1')
  })

  it('never collides with booking, expense or member ids', () => {
    const id = nextStopId(seed.stops)
    const taken = new Set([
      ...seed.stops.map((s) => s.id),
      ...seed.bookings.map((b) => b.id),
      ...seed.expenses.map((e) => e.id),
      ...seed.members.map((m) => m.id),
    ])
    expect(taken.has(id)).toBe(false)
  })
})

describe('validateStop', () => {
  it('accepts a well-formed draft', () => {
    expect(validateStop(valid, 3)).toEqual({})
  })

  it('rejects a blank name', () => {
    expect(validateStop({ ...valid, name: '   ' }, 3)).toHaveProperty('name')
  })

  it('rejects a malformed start time', () => {
    for (const start of ['9:00', '25:00', '12:60', 'morning', '']) {
      expect(validateStop({ ...valid, start }, 3)).toHaveProperty('start')
    }
  })

  it('accepts boundary start times', () => {
    for (const start of ['00:00', '23:59']) {
      expect(validateStop({ ...valid, start }, 3)).toEqual({})
    }
  })

  it('rejects a non-positive duration', () => {
    expect(validateStop({ ...valid, durationMin: 0 }, 3)).toHaveProperty('durationMin')
    expect(validateStop({ ...valid, durationMin: -30 }, 3)).toHaveProperty('durationMin')
  })

  it('rejects a negative cost but allows zero', () => {
    expect(validateStop({ ...valid, costPerPerson: -1 }, 3)).toHaveProperty('costPerPerson')
    expect(validateStop({ ...valid, costPerPerson: 0 }, 3)).toEqual({})
  })

  it('requires the stop to serve at least one member', () => {
    expect(validateStop({ ...valid, serves: [] }, 3)).toHaveProperty('serves')
  })

  it('rejects a member who is both served and conflicted', () => {
    expect(validateStop({ ...valid, serves: ['m3'], conflicts: ['m3'] }, 3)).toHaveProperty('conflicts')
  })

  it('rejects a day outside the trip', () => {
    expect(validateStop({ ...valid, day: 0 }, 3)).toHaveProperty('day')
    expect(validateStop({ ...valid, day: 4 }, 3)).toHaveProperty('day')
  })

  it('reports every problem at once rather than stopping at the first', () => {
    const errors = validateStop({ ...valid, name: '', start: 'nope', serves: [] }, 3)
    expect(Object.keys(errors).sort()).toEqual(['name', 'serves', 'start'])
  })
})

const ordersFor = (stops: typeof seed.stops, day: number) =>
  stops.filter((s) => s.day === day).sort((a, b) => a.order - b.order).map((s) => s.order)

const namesFor = (stops: typeof seed.stops, day: number) =>
  stops.filter((s) => s.day === day).sort((a, b) => a.order - b.order).map((s) => s.name)

describe('insertStop', () => {
  it('appends to the end of its day with the next order', () => {
    const next = insertStop(seed.stops, valid)
    const added = next.find((s) => s.name === 'Penang Botanic Gardens')!
    expect(added.id).toBe('s12')
    expect(added.day).toBe(1)
    expect(added.order).toBe(5)
    expect(next).toHaveLength(seed.stops.length + 1)
  })

  it('keeps day orders contiguous', () => {
    const next = insertStop(seed.stops, { ...valid, day: 3 })
    expect(ordersFor(next, 3)).toEqual([1, 2, 3, 4])
  })

  it('does not mutate the input', () => {
    const before = seed.stops.length
    insertStop(seed.stops, valid)
    expect(seed.stops).toHaveLength(before)
  })
})

describe('removeStop', () => {
  it('drops the stop and renumbers its day', () => {
    const next = removeStop(seed.stops, 's2')
    expect(next.some((s) => s.id === 's2')).toBe(false)
    expect(ordersFor(next, 1)).toEqual([1, 2, 3])
    expect(namesFor(next, 1)).toEqual([
      'Chew Jetty',
      'Chulia Street night market',
      'Gurney Drive hawker centre',
    ])
  })

  it('leaves other days untouched', () => {
    const next = removeStop(seed.stops, 's2')
    expect(ordersFor(next, 2)).toEqual([1, 2, 3, 4])
  })

  it('is a no-op for an unknown id', () => {
    expect(removeStop(seed.stops, 'nope')).toHaveLength(seed.stops.length)
  })
})

describe('moveStop', () => {
  it('swaps a stop with its predecessor', () => {
    const next = moveStop(seed.stops, 's2', 'up')
    expect(namesFor(next, 1)).toEqual([
      'Armenian Street murals',
      'Chew Jetty',
      'Chulia Street night market',
      'Gurney Drive hawker centre',
    ])
    expect(ordersFor(next, 1)).toEqual([1, 2, 3, 4])
  })

  it('swaps a stop with its successor', () => {
    const next = moveStop(seed.stops, 's1', 'down')
    expect(namesFor(next, 1)[0]).toBe('Armenian Street murals')
    expect(namesFor(next, 1)[1]).toBe('Chew Jetty')
  })

  it('is a no-op at the top of a day', () => {
    expect(namesFor(moveStop(seed.stops, 's1', 'up'), 1)).toEqual(namesFor(seed.stops, 1))
  })

  it('is a no-op at the bottom of a day', () => {
    expect(namesFor(moveStop(seed.stops, 's4', 'down'), 1)).toEqual(namesFor(seed.stops, 1))
  })

  it('never moves a stop across days', () => {
    const next = moveStop(seed.stops, 's4', 'down')
    expect(next.find((s) => s.id === 's4')!.day).toBe(1)
    expect(next.filter((s) => s.day === 2)).toHaveLength(4)
  })
})

describe('editStop', () => {
  const asDraft = (id: string): StopDraft => {
    const { id: _id, order: _order, ...rest } = seed.stops.find((s) => s.id === id)!
    return rest
  }

  it('patches fields in place when the day is unchanged', () => {
    const next = editStop(seed.stops, 's2', { ...asDraft('s2'), name: 'Renamed', costPerPerson: 12 })
    const edited = next.find((s) => s.id === 's2')!
    expect(edited.name).toBe('Renamed')
    expect(edited.costPerPerson).toBe(12)
    expect(edited.order).toBe(2)
    expect(ordersFor(next, 1)).toEqual([1, 2, 3, 4])
  })

  it('closes the gap in the old day when a stop moves day', () => {
    const next = editStop(seed.stops, 's2', { ...asDraft('s2'), day: 3 })
    expect(ordersFor(next, 1)).toEqual([1, 2, 3])
    expect(namesFor(next, 1)).toEqual([
      'Chew Jetty',
      'Chulia Street night market',
      'Gurney Drive hawker centre',
    ])
  })

  it('appends to the end of the new day', () => {
    const next = editStop(seed.stops, 's2', { ...asDraft('s2'), day: 3 })
    const moved = next.find((s) => s.id === 's2')!
    expect(moved.day).toBe(3)
    expect(moved.order).toBe(4)
    expect(ordersFor(next, 3)).toEqual([1, 2, 3, 4])
  })

  it('ignores a stale order riding along on the draft', () => {
    // StopForm spreads a whole Stop into its draft, so `id` and `order` reach
    // us at runtime even though StopDraft omits them. The store's order wins.
    const draft = { ...asDraft('s2'), id: 'sX', order: 99 } as StopDraft
    const next = editStop(seed.stops, 's2', draft)
    const edited = next.find((s) => s.id === 's2')!
    expect(edited.order).toBe(2)
    expect(ordersFor(next, 1)).toEqual([1, 2, 3, 4])
    expect(next.some((s) => s.id === 'sX')).toBe(false)
  })

  it('lands at order 1 in a day that currently has no stops', () => {
    const noDay3 = seed.stops.filter((s) => s.day !== 3)
    const next = editStop(noDay3, 's2', { ...asDraft('s2'), day: 3 })
    const moved = next.find((s) => s.id === 's2')!
    expect(moved.day).toBe(3)
    expect(moved.order).toBe(1)
    expect(ordersFor(next, 3)).toEqual([1])
  })

  it('is a no-op for an unknown id', () => {
    expect(editStop(seed.stops, 'nope', asDraft('s2'))).toEqual(seed.stops)
  })
})

describe('a sequence of operations', () => {
  // Worked out by hand from the seed, not read off the implementation:
  //
  //   seed  day 1: Chew Jetty, Armenian, Chulia, Gurney
  //         day 2: Line Clear, Kek Lok Si, Penang Hill, China House
  //         day 3: Batu Ferringhi, Spice Garden, Kimberley
  //
  //   1. insert "Botanic Gardens" into day 1 -> appended 5th
  //   2. move it up                          -> swaps with Gurney, now 4th
  //   3. remove s6 (Kek Lok Si), day 2's 2nd -> day 2 closes to three
  //   4. edit s2 (Armenian) to day 3         -> day 1 closes to four,
  //                                             Armenian appended 4th on day 3
  //   5. insert "Tanjung Bungah night market" into day 3 -> appended 5th
  const composed = [
    (stops: typeof seed.stops) => insertStop(stops, { ...valid, day: 1, name: 'Botanic Gardens' }),
    (stops: typeof seed.stops) =>
      moveStop(stops, stops.find((s) => s.name === 'Botanic Gardens')!.id, 'up'),
    (stops: typeof seed.stops) => removeStop(stops, 's6'),
    (stops: typeof seed.stops) => {
      const { id: _id, order: _order, ...rest } = stops.find((s) => s.id === 's2')!
      return editStop(stops, 's2', { ...rest, day: 3 })
    },
    (stops: typeof seed.stops) =>
      insertStop(stops, { ...valid, day: 3, name: 'Tanjung Bungah night market' }),
  ].reduce((stops, step) => step(stops), seed.stops)

  it('leaves every day contiguous from 1', () => {
    expect(ordersFor(composed, 1)).toEqual([1, 2, 3, 4])
    expect(ordersFor(composed, 2)).toEqual([1, 2, 3])
    expect(ordersFor(composed, 3)).toEqual([1, 2, 3, 4, 5])
  })

  it('keeps every stop id unique', () => {
    const ids = composed.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(composed).toHaveLength(12)
  })

  it('puts the stops in the sequence the operations describe', () => {
    expect(namesFor(composed, 1)).toEqual([
      'Chew Jetty',
      'Chulia Street night market',
      'Botanic Gardens',
      'Gurney Drive hawker centre',
    ])
    expect(namesFor(composed, 2)).toEqual([
      'Line Clear Nasi Kandar',
      'Penang Hill funicular',
      'China House',
    ])
    expect(namesFor(composed, 3)).toEqual([
      'Batu Ferringhi beach',
      'Tropical Spice Garden',
      'Kimberley Street food street',
      'Armenian Street murals',
      'Tanjung Bungah night market',
    ])
  })
})
