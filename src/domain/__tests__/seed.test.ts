import { describe, expect, it } from 'vitest'
import { seed } from '../../store/seed'

const memberIds = new Set(seed.members.map((m) => m.id))

describe('seed fixture', () => {
  it('has four members and at least ten stops', () => {
    expect(seed.members).toHaveLength(4)
    expect(seed.stops.length).toBeGreaterThanOrEqual(10)
  })

  it('references only real member ids in serves and conflicts', () => {
    for (const stop of seed.stops) {
      for (const id of [...stop.serves, ...stop.conflicts]) {
        expect(memberIds.has(id)).toBe(true)
      }
    }
  })

  it('never lists a member as both served and conflicted on one stop', () => {
    for (const stop of seed.stops) {
      const overlap = stop.serves.filter((id) => stop.conflicts.includes(id))
      expect(overlap).toEqual([])
    }
  })

  it('serves at least one member per stop', () => {
    for (const stop of seed.stops) {
      expect(stop.serves.length).toBeGreaterThan(0)
    }
  })

  it('places every stop inside Penang', () => {
    for (const stop of seed.stops) {
      expect(stop.lat).toBeGreaterThan(5.2)
      expect(stop.lat).toBeLessThan(5.6)
      expect(stop.lng).toBeGreaterThan(100.1)
      expect(stop.lng).toBeLessThan(100.6)
    }
  })

  it('numbers stop orders contiguously from 1 within each day', () => {
    for (let day = 1; day <= seed.trip.days; day++) {
      const orders = seed.stops
        .filter((s) => s.day === day)
        .map((s) => s.order)
        .sort((a, b) => a - b)
      expect(orders).toEqual(orders.map((_, i) => i + 1))
    }
  })

  it('gives every member at least one stop they are served by and one they lose out on', () => {
    for (const member of seed.members) {
      expect(seed.stops.some((s) => s.serves.includes(member.id))).toBe(true)
      expect(seed.stops.some((s) => s.conflicts.includes(member.id))).toBe(true)
    }
  })

  it('links every booking and expense to a real day and member', () => {
    for (const booking of seed.bookings) {
      expect(booking.affectsDay).toBeGreaterThanOrEqual(1)
      expect(booking.affectsDay).toBeLessThanOrEqual(seed.trip.days)
    }
    for (const expense of seed.expenses) {
      expect(memberIds.has(expense.paidBy)).toBe(true)
      for (const id of expense.splitAmong) expect(memberIds.has(id)).toBe(true)
    }
  })
})
