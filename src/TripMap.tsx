import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import tripJson from './data/trip.json'
import tripDelayedJson from './data/trip_delayed.json'
import './TripMap.css'

type Member = {
  id: string
  name: string
  color: string
  budget_cap: number
  pace: string
  must: string[]
  avoid: string[]
}

type Stop = {
  id: string
  day: number
  order: number
  name: string
  start: string
  duration_min: number
  cost_per_person: number
  serves: string[]
  conflicts: string[]
  reason: string
}

type TripData = {
  trip: { destination: string; days: number; budget_per_person: number; currency: string }
  members: Member[]
  stops: Stop[]
}

const BASE = tripJson as TripData
const DELAYED = tripDelayedJson as TripData

const memberById = new Map<string, Member>(BASE.members.map((m) => [m.id, m]))
const CURRENCY = BASE.trip.currency

const COL_TRIP = 0
const COL_DAY = 300
const COL_STOP = 620
const ROW_HEIGHT = 108

function fillFor(memberIds: string[]) {
  const colors = memberIds.map((id) => memberById.get(id)!.color)
  if (colors.length === 1) return colors[0]
  const step = 100 / colors.length
  const stops = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`)
  return `linear-gradient(180deg, ${stops.join(', ')})`
}

function endTime(start: string, durationMin: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + durationMin
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

function joinNames(names: string[]) {
  if (names.length <= 1) return names.join('')
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
}

function TripNode({ data }: NodeProps) {
  const { destination, days } = data as { destination: string; days: number }
  return (
    <div className="node node--trip">
      <div className="node__title">{destination}</div>
      <div className="node__sub">{days} days</div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function DayNode({ data }: NodeProps) {
  const { day, count } = data as { day: number; count: number }
  return (
    <div className="node node--day">
      <div className="node__title">Day {day}</div>
      <div className="node__sub">{count} stops</div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

function StopNode({ data, selected }: NodeProps) {
  const { stop, shifted } = data as { stop: Stop; shifted: boolean }
  return (
    <div
      className={`node node--stop${selected ? ' node--stop-active' : ''}`}
      style={{ background: fillFor(stop.serves) }}
    >
      <div className="node__inner">
        <div className="node__title">{stop.name}</div>
        <div className="node__sub">
          {stop.start} · {stop.duration_min} min · {CURRENCY} {stop.cost_per_person}
          {shifted && <span className="node__shifted">moved</span>}
        </div>
      </div>
      {stop.conflicts.length > 0 && <span className="node__conflict" />}
      <Handle type="target" position={Position.Left} />
    </div>
  )
}

const nodeTypes = { trip: TripNode, day: DayNode, stop: StopNode }

function buildGraph(data: TripData): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const dayNumbers = [...new Set(data.stops.map((s) => s.day))].sort((a, b) => a - b)
  const baseById = new Map(BASE.stops.map((s) => [s.id, s]))

  let row = 0
  const dayCentres: number[] = []

  for (const day of dayNumbers) {
    const stops = data.stops.filter((s) => s.day === day).sort((a, b) => a.order - b.order)
    const firstRow = row

    for (const stop of stops) {
      const before = baseById.get(stop.id)
      nodes.push({
        id: stop.id,
        type: 'stop',
        position: { x: COL_STOP, y: row * ROW_HEIGHT },
        data: { stop, shifted: before ? before.start !== stop.start : false },
      })
      edges.push({ id: `d${day}-${stop.id}`, source: `day-${day}`, target: stop.id, type: 'smoothstep' })
      row += 1
    }

    const centre = ((firstRow + row - 1) / 2) * ROW_HEIGHT
    dayCentres.push(centre)
    nodes.push({
      id: `day-${day}`,
      type: 'day',
      position: { x: COL_DAY, y: centre },
      data: { day, count: stops.length },
    })
    edges.push({ id: `trip-day${day}`, source: 'trip', target: `day-${day}`, type: 'smoothstep' })
  }

  nodes.push({
    id: 'trip',
    type: 'trip',
    position: { x: COL_TRIP, y: (dayCentres[0] + dayCentres[dayCentres.length - 1]) / 2 },
    data: { destination: data.trip.destination, days: data.trip.days },
  })

  return { nodes, edges }
}

const initial = buildGraph(BASE)

function Legend() {
  return (
    <div className="legend">
      <div className="legend__title">Planned for</div>
      {BASE.members.map((m) => (
        <div key={m.id} className="legend__row">
          <span className="legend__swatch" style={{ background: m.color }} />
          {m.name}
        </div>
      ))}
      <div className="legend__row legend__row--note">
        <span className="legend__swatch legend__swatch--conflict" />
        has a conflict
      </div>
    </div>
  )
}

function MemberChips({ ids }: { ids: string[] }) {
  return (
    <div className="chips">
      {ids.map((id) => {
        const m = memberById.get(id)!
        return (
          <span key={id} className="chip" style={{ borderColor: m.color, color: m.color }}>
            <span className="chip__dot" style={{ background: m.color }} />
            {m.name}
          </span>
        )
      })}
    </div>
  )
}

function StopPanel({ stop, onClose }: { stop: Stop; onClose: () => void }) {
  return (
    <aside className="panel">
      <button className="panel__close" onClick={onClose} aria-label="Close">
        ×
      </button>

      <div className="panel__day">Day {stop.day}</div>
      <h2 className="panel__title">{stop.name}</h2>
      <div className="panel__meta">
        {stop.start}–{endTime(stop.start, stop.duration_min)} · {stop.duration_min} min · {CURRENCY}{' '}
        {stop.cost_per_person} per person
      </div>

      <div className="panel__section">
        <div className="panel__label">Planned for</div>
        <MemberChips ids={stop.serves} />
      </div>

      <div className="panel__section">
        <div className="panel__label">At the cost of</div>
        {stop.conflicts.length > 0 ? (
          <>
            <MemberChips ids={stop.conflicts} />
            <p className="panel__reason">{stop.reason}</p>
          </>
        ) : (
          <p className="panel__reason panel__reason--clear">
            Nobody gives anything up for this one.
          </p>
        )}
      </div>
    </aside>
  )
}

const keptIds = new Set(DELAYED.stops.map((s) => s.id))
const droppedStops = BASE.stops.filter((s) => !keptIds.has(s.id))
const paidIds = [...new Set(droppedStops.flatMap((s) => s.serves))]

function DelayBanner() {
  return (
    <div className="banner">
      <span className="banner__lead">Day 1 lost 3 hours.</span>
      <span>
        Dropped {joinNames(droppedStops.map((s) => s.name))}, and the rest of the evening moved
        back. That came out of
      </span>
      <MemberChips ids={paidIds} />
    </div>
  )
}

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [selected, setSelected] = useState<Stop | null>(null)
  const [delayed, setDelayed] = useState(false)
  const { fitView } = useReactFlow()

  const isOpen = selected !== null

  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const graph = buildGraph(delayed ? DELAYED : BASE)
    setNodes(graph.nodes)
    setEdges(graph.edges)
    setSelected(null)
  }, [delayed, setNodes, setEdges])

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.15, duration: 400 }), 60)
    return () => clearTimeout(t)
  }, [isOpen, delayed, fitView])

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

  const onNodeClick = useCallback<NodeMouseHandler>((_, node) => {
    if (node.type !== 'stop') return
    setSelected((node.data as { stop: Stop }).stop)
  }, [])

  const onPaneClick = useCallback(() => setSelected(null), [])

  return (
    <div className="app">
      <header className="toolbar">
        <div>
          <div className="toolbar__title">{BASE.trip.destination}</div>
          <div className="toolbar__sub">
            {BASE.trip.days} days · {CURRENCY} {BASE.trip.budget_per_person} per person ·{' '}
            {BASE.members.length} travellers
          </div>
        </div>
        {delayed ? (
          <button className="btn" onClick={() => setDelayed(false)}>
            Reset
          </button>
        ) : (
          <button className="btn btn--primary" onClick={() => setDelayed(true)}>
            Flight delayed 3 hours
          </button>
        )}
      </header>

      {delayed && <DelayBanner />}

      <div className="tripmap">
        <div className="tripmap__canvas">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} size={1} color="#E5E7EB" />
          </ReactFlow>
          <Legend />
        </div>
        {selected && <StopPanel stop={selected} onClose={() => setSelected(null)} />}
      </div>
    </div>
  )
}

export default function TripMap() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  )
}
