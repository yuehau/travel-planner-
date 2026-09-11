import type { Cascade, RepairAction, Trip, TripItem } from '../types'
import { fmt } from '../engine/cascade'
import { Badge } from './ui'

interface Props {
  trip: Trip
  cascade?: Cascade
  /** Applied repair actions — renders the plan in its post-repair state. */
  applied?: RepairAction[]
}

interface Row {
  item: TripItem
  day: number
  start: number
  status: 'safe' | 'shifted' | 'broken' | 'moved' | 'dropped'
  note?: string
}

function buildRows(trip: Trip, cascade?: Cascade, applied?: RepairAction[]): Row[] {
  const actionFor = new Map((applied ?? []).map((a) => [a.itemId, a]))

  const rows: Row[] = trip.items.map((item) => {
    const action = actionFor.get(item.id)
    if (action?.kind === 'drop') {
      return { item, day: item.day, start: item.start, status: 'dropped' as const, note: 'Cancelled' }
    }
    if (action?.kind === 'move') {
      return {
        item, day: action.toDay, start: action.toStart, status: 'moved' as const,
        note: action.toDay === item.day ? 'Moved later' : `Moved from Day ${item.day}`,
      }
    }

    const outcome = cascade?.outcomes.find((o) => o.itemId === item.id)
    if (!outcome || outcome.status === 'safe') {
      return { item, day: item.day, start: item.start, status: 'safe' as const }
    }
    return {
      item,
      day: item.day,
      start: applied ? outcome.earliestStart : item.start,
      status: outcome.status,
      note: outcome.reason,
    }
  })

  return rows.sort((a, b) => a.day - b.day || a.start - b.start)
}

const STATUS_META = {
  safe: { tone: 'neutral', label: '' },
  shifted: { tone: 'shifted', label: 'Running late' },
  broken: { tone: 'broken', label: 'Broken' },
  moved: { tone: 'safe', label: 'Moved' },
  dropped: { tone: 'neutral', label: 'Cancelled' },
} as const

export function Timeline({ trip, cascade, applied }: Props) {
  const rows = buildRows(trip, cascade, applied)
  const days = [...new Set(rows.map((r) => r.day))].sort((a, b) => a - b)

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day}>
          <div className="mb-2 flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink-900">Day {day}</h3>
            <span className="h-px flex-1 bg-ink-100" />
          </div>

          <ol className="space-y-1.5">
            {rows.filter((r) => r.day === day).map((row) => {
              const meta = STATUS_META[row.status]
              const dropped = row.status === 'dropped'
              const broken = row.status === 'broken'
              const dependsOn = row.item.dependsOn
                .map((id) => trip.items.find((i) => i.id === id)?.title)
                .filter(Boolean)

              return (
                <li
                  key={row.item.id}
                  className={`rise flex gap-3 rounded-lg border px-3 py-2.5 transition ${
                    broken ? 'border-break-100 bg-break-100/40'
                    : row.status === 'shifted' ? 'border-warn-100 bg-warn-100/40'
                    : row.status === 'moved' ? 'border-safe-100 bg-safe-100/40'
                    : dropped ? 'border-ink-100 bg-ink-50/60'
                    : 'border-ink-100 bg-white'
                  }`}
                >
                  <span className={`w-14 shrink-0 pt-0.5 text-xs tabular-nums ${dropped ? 'text-ink-300 line-through' : 'text-ink-500'}`}>
                    {row.item.durationMin === 0 ? fmt(row.start) : `${fmt(row.start)}`}
                  </span>

                  <span className="shrink-0 text-base leading-6" aria-hidden>{row.item.icon}</span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={`text-sm font-medium ${dropped ? 'text-ink-300 line-through' : 'text-ink-900'}`}>
                        {row.item.title}
                      </span>
                      {meta.label && <Badge tone={meta.tone}>{meta.label}</Badge>}
                      {row.item.prepaid && row.item.refundRate === 0 && row.item.cost > 0 && !dropped && (
                        <Badge tone="neutral">Non-refundable</Badge>
                      )}
                    </div>

                    <p className={`mt-0.5 text-xs ${dropped ? 'text-ink-300' : 'text-ink-500'}`}>
                      {row.note ?? row.item.detail}
                    </p>

                    {dependsOn.length > 0 && (
                      <p className="mt-1 text-[11px] text-ink-300">
                        depends on {dependsOn.join(' · ')}
                      </p>
                    )}
                  </div>

                  {row.item.cost > 0 && (
                    <span className={`shrink-0 text-xs tabular-nums ${dropped ? 'text-ink-300 line-through' : 'text-ink-500'}`}>
                      RM{row.item.cost}
                    </span>
                  )}
                </li>
              )
            })}
          </ol>
        </div>
      ))}
    </div>
  )
}
