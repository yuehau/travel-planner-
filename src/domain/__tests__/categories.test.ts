import { describe, expect, it } from 'vitest'
import { buildCategoriesGraph } from '../../graph/categories'
import { seed } from '../../store/seed'

const graph = buildCategoriesGraph(seed)
const ids = new Set(graph.nodes.map((n) => n.id))

describe('categories lens', () => {
  it('has exactly one trip node', () => {
    expect(graph.nodes.filter((n) => n.type === 'trip')).toHaveLength(1)
  })

  it('has the four category nodes', () => {
    const categories = graph.nodes.filter((n) => n.type === 'category').map((n) => n.id)
    expect(categories.sort()).toEqual(
      ['cat-bookings', 'cat-budget', 'cat-itinerary', 'cat-people'].sort(),
    )
  })

  it('includes a node for every stop, booking and member', () => {
    for (const stop of seed.stops) expect(ids.has(stop.id)).toBe(true)
    for (const booking of seed.bookings) expect(ids.has(booking.id)).toBe(true)
    for (const member of seed.members) expect(ids.has(member.id)).toBe(true)
  })

  it('connects every category to the trip node', () => {
    for (const id of ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people']) {
      expect(graph.edges.some((e) => e.source === 'trip' && e.target === id)).toBe(true)
    }
  })

  it('parents every stop to the itinerary category', () => {
    for (const stop of seed.stops) {
      expect(graph.edges.some((e) => e.source === 'cat-itinerary' && e.target === stop.id)).toBe(true)
    }
  })

  it('gives every edge endpoints that exist', () => {
    for (const edge of graph.edges) {
      expect(ids.has(edge.source)).toBe(true)
      expect(ids.has(edge.target)).toBe(true)
    }
  })

  it('gives every node a unique id', () => {
    expect(ids.size).toBe(graph.nodes.length)
  })
})
