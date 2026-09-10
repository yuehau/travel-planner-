import { describe, expect, it } from 'vitest'
import { buildCategoriesGraph } from '../../graph/categories'
import { editStop, insertStop, moveStop } from '../stops'
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

  it('includes a node for every stop, booking, expense and member', () => {
    for (const stop of seed.stops) expect(ids.has(stop.id)).toBe(true)
    for (const booking of seed.bookings) expect(ids.has(booking.id)).toBe(true)
    for (const expense of seed.expenses) expect(ids.has(expense.id)).toBe(true)
    for (const member of seed.members) expect(ids.has(member.id)).toBe(true)
  })

  it('builds one node per leaf plus four categories and the trip', () => {
    // 11 stops + 3 bookings + 3 expenses + 4 members + 4 categories + 1 trip
    expect(graph.nodes).toHaveLength(26)
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

describe('categories lens with an empty group', () => {
  const emptied = { ...seed, expenses: [] }
  const g = buildCategoriesGraph(emptied)
  const categoryY = (id: string) => g.nodes.find((n) => n.id === id)!.position.y

  it('still renders all four category nodes', () => {
    for (const id of ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people']) {
      expect(g.nodes.some((n) => n.id === id)).toBe(true)
    }
  })

  it('does not drop the empty category onto the centreline', () => {
    expect(categoryY('cat-budget')).not.toBe(0)
  })

  it('keeps every category node at a distinct y', () => {
    const ys = ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people'].map(categoryY)
    expect(new Set(ys).size).toBe(4)
  })

  it('keeps the empty category in sequence between its neighbours', () => {
    expect(categoryY('cat-budget')).toBeGreaterThan(categoryY('cat-bookings'))
    expect(categoryY('cat-budget')).toBeLessThan(categoryY('cat-people'))
  })
})

// Delete only ever empties `stops`, and itinerary is the FIRST group -- so the
// case reachable in the app is `first === 0`, not the middle-group case above.
describe('categories lens with every stop deleted', () => {
  const emptied = { ...seed, stops: [] }
  const g = buildCategoriesGraph(emptied)
  const categoryY = (id: string) => g.nodes.find((n) => n.id === id)!.position.y

  it('still renders all four category nodes', () => {
    for (const id of ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people']) {
      expect(g.nodes.some((n) => n.id === id)).toBe(true)
    }
  })

  it('keeps every category node at a distinct y', () => {
    const ys = ['cat-itinerary', 'cat-bookings', 'cat-budget', 'cat-people'].map(categoryY)
    expect(new Set(ys).size).toBe(4)
  })

  it('keeps the emptied first category above its neighbour', () => {
    expect(categoryY('cat-itinerary')).toBeLessThan(categoryY('cat-bookings'))
  })
})

describe('categories lens ordering', () => {
  const yOf = (nodes: ReturnType<typeof buildCategoriesGraph>['nodes'], id: string) =>
    nodes.find((n) => n.id === id)!.position.y

  it('lays stops out in day and order sequence', () => {
    const { nodes } = buildCategoriesGraph(seed)
    expect(yOf(nodes, 's1')).toBeLessThan(yOf(nodes, 's2'))
    expect(yOf(nodes, 's4')).toBeLessThan(yOf(nodes, 's5'))
  })

  it('reflects a reorder in node positions', () => {
    const moved = { ...seed, stops: moveStop(seed.stops, 's2', 'up') }
    const { nodes } = buildCategoriesGraph(moved)
    expect(yOf(nodes, 's2')).toBeLessThan(yOf(nodes, 's1'))
  })

  it('places a newly added day-1 stop above the day-2 stops', () => {
    const withNew = { ...seed, stops: insertStop(seed.stops, { ...seed.stops[0], day: 1, name: 'New day-1 stop' }) }
    const { nodes } = buildCategoriesGraph(withNew)
    const added = withNew.stops.find((s) => s.name === 'New day-1 stop')!
    expect(yOf(nodes, added.id)).toBeLessThan(yOf(nodes, 's5'))
  })

  it('places a stop moved from day 3 to day 1 above the day-2 stops', () => {
    const s9 = seed.stops.find((s) => s.id === 's9')!
    const { id: _id, order: _order, ...draft } = s9
    const moved = { ...seed, stops: editStop(seed.stops, 's9', { ...draft, day: 1 }) }
    const { nodes } = buildCategoriesGraph(moved)
    expect(yOf(nodes, 's9')).toBeLessThan(yOf(nodes, 's5'))
  })
})
