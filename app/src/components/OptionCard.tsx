import type { RepairOption, Trip } from '../types'
import { describeAction } from '../engine/repair'
import { Avatar, Badge, Button, Card, Money } from './ui'

interface Props {
  trip: Trip
  option: RepairOption
  selected: boolean
  onSelect: () => void
  onApply: () => void
}

export function OptionCard({ trip, option, selected, onSelect, onApply }: Props) {
  const memberById = new Map(trip.members.map((m) => [m.id, m]))
  const sacrificesAny = option.impacts.some((i) => i.sacrificed.length > 0)
  const anyOver = option.impacts.some((i) => i.overCeiling)

  return (
    <Card
      className={`flex cursor-pointer flex-col p-4 transition ${
        selected ? 'border-ink-900 ring-1 ring-ink-900' : 'hover:border-ink-300'
      }`}
    >
      <div onClick={onSelect} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-ink-900">{option.name}</h3>
            <p className="mt-0.5 text-xs text-ink-500">{option.strategy}</p>
          </div>
          <span
            className={`shrink-0 rounded-md px-2 py-1 text-sm font-semibold tabular-nums ${
              option.costDelta > 0 ? 'bg-break-100 text-break-600'
                : option.costDelta < 0 ? 'bg-safe-100 text-safe-600'
                : 'bg-ink-50 text-ink-700'
            }`}
          >
            <Money value={option.costDelta} signed />
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-ink-700">{option.rationale}</p>

        <ul className="mt-3 space-y-1 border-t border-ink-100 pt-3">
          {option.actions.map((action) => {
            const item = trip.items.find((i) => i.id === action.itemId)
            if (!item) return null
            return (
              <li key={action.itemId} className="flex gap-2 text-xs">
                <span aria-hidden>{item.icon}</span>
                <span className="flex-1 text-ink-700">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-ink-500"> — {describeAction(trip, action)}</span>
                </span>
              </li>
            )
          })}
        </ul>

        <div className="mt-3 border-t border-ink-100 pt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            Effect on each person
          </p>
          <div className="space-y-1.5">
            {option.impacts.map((impact) => {
              const member = memberById.get(impact.memberId)
              if (!member) return null
              return (
                <div key={impact.memberId} className="flex items-center gap-2 text-xs">
                  <Avatar name={member.name} tone={member.tone} size={20} />
                  <span className="w-12 text-ink-700">{member.name}</span>
                  <span className={`w-14 tabular-nums ${impact.fitDelta < -20 ? 'text-break-600' : 'text-ink-500'}`}>
                    {impact.fitDelta === 0 ? '—' : `${impact.fitDelta}%`}
                  </span>
                  <span className={`tabular-nums ${impact.overCeiling ? 'font-semibold text-break-600' : 'text-ink-500'}`}>
                    RM{impact.share}
                  </span>
                  {impact.overCeiling && <Badge tone="broken">over ceiling</Badge>}
                  {impact.sacrificed.length > 0 && <Badge tone="broken">loses must-do</Badge>}
                </div>
              )
            })}
          </div>
        </div>

        {(option.bindingConstraint || sacrificesAny) && (
          <div className="mt-3 rounded-lg bg-warn-100/60 px-3 py-2 text-[11px] leading-relaxed text-warn-600">
            {option.bindingConstraint && <p><span className="font-semibold">Blocked by:</span> {option.bindingConstraint}</p>}
            {sacrificesAny && !anyOver && <p>This option costs someone something they said mattered.</p>}
          </div>
        )}
      </div>

      <Button onClick={onApply} className="mt-4 w-full" variant={selected ? 'primary' : 'ghost'}>
        Apply this plan
      </Button>
    </Card>
  )
}
