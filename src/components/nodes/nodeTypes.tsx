import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { Booking, Expense, Member, Stop, Trip } from '../../domain/types'
import { useTripStore } from '../../store/tripStore'

function useMemberColors(ids: string[]) {
  const members = useTripStore((s) => s.members)
  return ids.map((id) => members.find((m) => m.id === id)?.color ?? '#9CA3AF')
}

function bandFor(colors: string[]) {
  if (colors.length === 0) return '#9CA3AF'
  if (colors.length === 1) return colors[0]
  const step = 100 / colors.length
  const parts = colors.map((c, i) => `${c} ${i * step}%, ${c} ${(i + 1) * step}%`)
  return `linear-gradient(180deg, ${parts.join(', ')})`
}

export function TripNode({ data }: NodeProps) {
  const { trip, memberCount } = data as { trip: Trip; memberCount: number }
  return (
    <div className="rounded-xl border-2 border-gray-900 bg-white px-5 py-4 shadow-sm">
      <div className="text-lg font-semibold text-gray-900">{trip.destination}</div>
      <div className="mt-1 text-xs text-gray-500">
        {trip.days} days · {trip.currency} {trip.budgetPerPerson} pp · {memberCount} travellers
      </div>
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}

export function CategoryNode({ data }: NodeProps) {
  const { label, count } = data as { label: string; count: number }
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
      <div className="text-sm font-semibold text-gray-900">{label}</div>
      <div className="mt-0.5 text-xs text-gray-500">{count} items</div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  )
}

export function StopNode({ data, selected }: NodeProps) {
  const { stop } = data as { stop: Stop }
  const colors = useMemberColors(stop.serves)
  return (
    <div
      className={`relative w-64 cursor-pointer rounded-lg py-1 pr-1 pl-5 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
      style={{ background: bandFor(colors) }}
    >
      <div className="rounded-md bg-white/95 px-3 py-2">
        <div className="text-sm font-semibold text-gray-900">{stop.name}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          Day {stop.day} · {stop.start} · {stop.durationMin} min
        </div>
      </div>
      {stop.conflicts.length > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 rounded-tr-md bg-[linear-gradient(to_bottom_left,transparent_46%,#4B5563_46%,#4B5563_54%,transparent_54%)]" />
      )}
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export function BookingNode({ data, selected }: NodeProps) {
  const { booking } = data as { booking: Booking }
  return (
    <div
      className={`w-64 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
    >
      <div className="text-sm font-semibold text-gray-900">
        {booking.type === 'flight' ? '✈' : '⌂'} {booking.title}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        {booking.ref} · affects day {booking.affectsDay}
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export function BudgetNode({ data, selected }: NodeProps) {
  const { expense } = data as { expense: Expense }
  const members = useTripStore((s) => s.members)
  const currency = useTripStore((s) => s.trip.currency)
  const payer = members.find((m) => m.id === expense.paidBy)
  return (
    <div
      className={`w-64 cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
    >
      <div className="text-sm font-semibold text-gray-900">
        {currency} {expense.amount}
      </div>
      <div className="mt-0.5 text-xs text-gray-500">
        paid by {payer?.name ?? 'unknown'} · split {expense.splitAmong.length} ways
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export function MemberNode({ data, selected }: NodeProps) {
  const { member } = data as { member: Member }
  return (
    <div
      className={`w-64 cursor-pointer rounded-lg py-1 pr-1 pl-5 ${
        selected ? 'ring-2 ring-gray-900' : ''
      }`}
      style={{ background: member.color }}
    >
      <div className="rounded-md bg-white/95 px-3 py-2">
        <div className="text-sm font-semibold text-gray-900">{member.name}</div>
        <div className="mt-0.5 text-xs text-gray-500">
          {member.pace} · cap {member.budgetCap}
        </div>
      </div>
      <Handle type="target" position={Position.Left} className="opacity-0" />
    </div>
  )
}

export const nodeTypes = {
  trip: TripNode,
  category: CategoryNode,
  stop: StopNode,
  booking: BookingNode,
  budget: BudgetNode,
  member: MemberNode,
}
