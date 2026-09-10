import type { Edge, Node } from '@xyflow/react'
import type { TripState } from '../domain/types'
import { column } from './layout'
import type { CategoryId, Graph } from './types'

const COL_TRIP = 0
const COL_CATEGORY = 320
const COL_LEAF = 660

export function buildCategoriesGraph(state: TripState): Graph {
  const nodes: Node[] = []
  const edges: Edge[] = []

  const groups: { id: CategoryId; label: string; leaves: Node[] }[] = [
    {
      id: 'itinerary',
      label: 'Itinerary',
      leaves: state.stops.map((stop) => ({
        id: stop.id,
        type: 'stop',
        position: { x: 0, y: 0 },
        data: { stop },
      })),
    },
    {
      id: 'bookings',
      label: 'Bookings',
      leaves: state.bookings.map((booking) => ({
        id: booking.id,
        type: 'booking',
        position: { x: 0, y: 0 },
        data: { booking },
      })),
    },
    {
      id: 'budget',
      label: 'Budget',
      leaves: state.expenses.map((expense) => ({
        id: expense.id,
        type: 'budget',
        position: { x: 0, y: 0 },
        data: { expense },
      })),
    },
    {
      id: 'people',
      label: 'People',
      leaves: state.members.map((member) => ({
        id: member.id,
        type: 'member',
        position: { x: 0, y: 0 },
        data: { member },
      })),
    },
  ]

  const totalLeaves = groups.reduce((sum, g) => sum + g.leaves.length, 0)
  const leafY = column(totalLeaves)
  let cursor = 0
  const categoryY: number[] = []

  for (const group of groups) {
    const first = cursor
    for (const leaf of group.leaves) {
      leaf.position = { x: COL_LEAF, y: leafY[cursor] }
      nodes.push(leaf)
      edges.push({
        id: `cat-${group.id}--${leaf.id}`,
        source: `cat-${group.id}`,
        target: leaf.id,
        type: 'smoothstep',
      })
      cursor += 1
    }
    // An empty group has no leaves to centre between. Fall back to where its
    // first leaf would have sat, so the category node stays in sequence with
    // its neighbours instead of landing on the map's centreline — where it
    // would overlap whichever group happens to straddle y=0.
    const centre = group.leaves.length
      ? (leafY[first] + leafY[cursor - 1]) / 2
      : (leafY[first] ?? leafY[leafY.length - 1] ?? 0)
    categoryY.push(centre)
    nodes.push({
      id: `cat-${group.id}`,
      type: 'category',
      position: { x: COL_CATEGORY, y: centre },
      data: { categoryId: group.id, label: group.label, count: group.leaves.length },
    })
    edges.push({
      id: `trip--cat-${group.id}`,
      source: 'trip',
      target: `cat-${group.id}`,
      type: 'smoothstep',
    })
  }

  nodes.push({
    id: 'trip',
    type: 'trip',
    position: { x: COL_TRIP, y: (categoryY[0] + categoryY[categoryY.length - 1]) / 2 },
    data: { trip: state.trip, memberCount: state.members.length },
  })

  return { nodes, edges }
}
