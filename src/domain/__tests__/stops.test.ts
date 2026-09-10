import { describe, expect, it } from 'vitest'
import { DEFAULT_COORDS, nextStopId, validateStop, type StopDraft } from '../stops'
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
