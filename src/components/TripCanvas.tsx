import { useEffect, useMemo, useRef } from 'react'
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './nodes/nodeTypes'
import { buildCategoriesGraph } from '../graph/categories'
import { useTripStore } from '../store/tripStore'

function Canvas() {
  // Subscribe to the trip data slices only. Subscribing to the whole store would
  // rebuild the graph every time selectedNodeId changes, wiping React Flow's
  // internal selection the instant you click a node.
  const trip = useTripStore((s) => s.trip)
  const members = useTripStore((s) => s.members)
  const stops = useTripStore((s) => s.stops)
  const bookings = useTripStore((s) => s.bookings)
  const expenses = useTripStore((s) => s.expenses)
  const select = useTripStore((s) => s.select)
  const { fitView } = useReactFlow()
  const nodesInitialized = useNodesInitialized()

  // Phase 4 replaces this with a lens lookup; until then every lens renders categories.
  const graph = useMemo(
    () => buildCategoriesGraph({ trip, members, stops, bookings, expenses }),
    [trip, members, stops, bookings, expenses],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setNodes, setEdges])

  useEffect(() => {
    if (nodesInitialized) {
      fitView({ padding: 0.15 })
    }
  }, [nodesInitialized, fitView])

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    const refit = () => {
      clearTimeout(t)
      t = setTimeout(() => fitView({ padding: 0.15 }), 120)
    }
    window.addEventListener('resize', refit)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', refit)
    }
  }, [fitView])

  const onNodeClick: NodeMouseHandler = (_, node) => select(node.id)

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onPaneClick={() => select(null)}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      nodesDraggable={false}
      nodesConnectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={24} size={1} color="#E5E7EB" />
    </ReactFlow>
  )
}

export function TripCanvas() {
  return (
    <ReactFlowProvider>
      <Canvas />
    </ReactFlowProvider>
  )
}
