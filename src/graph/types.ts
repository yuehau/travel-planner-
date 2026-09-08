import type { Edge, Node } from '@xyflow/react'

export type MapNodeKind = 'trip' | 'category' | 'stop' | 'booking' | 'budget' | 'member'
export type CategoryId = 'itinerary' | 'bookings' | 'budget' | 'people'

export interface Graph {
  nodes: Node[]
  edges: Edge[]
}
