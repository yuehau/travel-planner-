import { useState } from 'react'
import type { Flexibility, Interest, Trip, TripItem } from '../types'
import { INTEREST_LABEL, INTERESTS } from '../types'
import { hhmm, t as toMinutes } from '../data/seed'
import { Badge, Button, Card, SectionTitle } from '../components/ui'

const FLEXIBILITIES: { value: Flexibility; label: string; hint: string }[] = [
  { value: 'locked', label: 'Fixed', hint: 'Cannot move — a flight, a drive home' },
  { value: 'movable', label: 'Movable', hint: 'Can be rebooked for another slot' },
  { value: 'droppable', label: 'Droppable', hint: 'Nice to have; first to go' },
]

const ICONS = ['📍', '🚗', '🏡', '☕', '🍲', '🍜', '🌲', '⛰️', '🍃', '🏮', '🍓', '🏖️', '🛣️', '🎡', '🕌', '🛫']

const blank = (day: number): TripItem => ({
  id: `i-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  detail: '',
  icon: '📍',
  day,
  start: toMinutes('10:00'),
  durationMin: 90,
  cost: 0,
  prepaid: false,
  refundRate: 1,
  dependsOn: [],
  flexibility: 'movable',
  interest: 'rest',
  outdoor: false,
})

interface Props {
  trip: Trip
  onSave: (item: TripItem) => Promise<void>
  onDelete: (itemId: string) => Promise<void>
  onDone: () => void
}

export function ItemEditor({ trip, onSave, onDelete, onDone }: Props) {
  const [editing, setEditing] = useState<TripItem | null>(null)
  const [busy, setBusy] = useState(false)
  const days = Array.from({ length: trip.nights + 1 }, (_, i) => i + 1)

  const set = (updates: Partial<TripItem>) =>
    setEditing((i) => (i ? { ...i, ...updates } : i))

  async function save() {
    if (!editing || !editing.title.trim()) return
    setBusy(true)
    try {
      await onSave({ ...editing, title: editing.title.trim() })
      setEditing(null)
    } finally {
      setBusy(false)
    }
  }

  /** Items that could legally come before this one — no self, no cycles back. */
  const candidateDeps = editing
    ? trip.items.filter((i) => i.id !== editing.id && !i.dependsOn.includes(editing.id))
    : []

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">The plan</h1>
          <p className="text-sm text-ink-500">{trip.destination} · {trip.startDate}</p>
        </div>
        <div className="flex gap-2">
          {!editing && <Button onClick={() => setEditing(blank(1))}>Add a plan</Button>}
          <Button variant="ghost" onClick={onDone}>Done</Button>
        </div>
      </header>

      <Card className="mb-6 border-brand-100 bg-brand-100/30 p-4">
        <p className="text-sm leading-relaxed text-ink-700">
          Two fields do the real work. <span className="font-medium">Outdoors</span> decides
          whether the forecast can rule this out. <span className="font-medium">Depends on</span>
          {' '}is what turns a list into a graph — it is how the app knows that missing your
          check-in also costs you everything after it.
        </p>
      </Card>

      {editing && (
        <Card className="rise mb-6 p-4 md:p-5">
          <SectionTitle>{trip.items.some((i) => i.id === editing.id) ? 'Edit plan' : 'New plan'}</SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">What is it</span>
              <input
                value={editing.title}
                onChange={(e) => set({ title: e.target.value })}
                placeholder="Mossy Forest guided trek"
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">Note (optional)</span>
              <input
                value={editing.detail}
                onChange={(e) => set({ detail: e.target.value })}
                placeholder="Prepaid, non-refundable"
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              />
            </label>

            <div className="sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">Icon</span>
              <div className="flex flex-wrap gap-1">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => set({ icon })}
                    className={`rounded-lg border px-2 py-1 text-base transition ${
                      editing.icon === icon ? 'border-ink-900 bg-ink-50' : 'border-ink-100 bg-white'
                    }`}
                    aria-label={`Icon ${icon}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Day</span>
              <select
                value={editing.day}
                onChange={(e) => set({ day: Number(e.target.value) })}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              >
                {days.map((d) => <option key={d} value={d}>Day {d}</option>)}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Starts</span>
              <input
                type="time"
                value={hhmm(editing.start)}
                onChange={(e) => set({ start: toMinutes(e.target.value || '10:00') })}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Minutes long</span>
              <input
                type="number"
                min={0}
                step={15}
                value={editing.durationMin}
                onChange={(e) => set({ durationMin: Math.max(0, Number(e.target.value)) })}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
              />
              <span className="mt-1 block text-[11px] text-ink-500">
                Ends {hhmm(editing.start + editing.durationMin)}
              </span>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">
                Cost for the group (RM)
              </span>
              <input
                type="number"
                min={0}
                step={10}
                value={editing.cost}
                onChange={(e) => set({ cost: Math.max(0, Number(e.target.value)) })}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Kind</span>
              <select
                value={editing.interest}
                onChange={(e) => set({ interest: e.target.value as Interest })}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              >
                {INTERESTS.map((i) => (
                  <option key={i} value={i}>{INTEREST_LABEL[i]}</option>
                ))}
              </select>
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-ink-100 p-3">
              <input
                type="checkbox"
                checked={editing.outdoor}
                onChange={(e) => set({ outdoor: e.target.checked })}
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-medium text-ink-700">Outdoors</span>
                <span className="block text-[11px] text-ink-500">
                  Rain can rule this out entirely
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-xs font-medium text-ink-700">
              How movable is it
            </span>
            <div className="grid gap-2 sm:grid-cols-3">
              {FLEXIBILITIES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => set({ flexibility: f.value })}
                  className={`rounded-lg border px-3 py-2 text-left transition ${
                    editing.flexibility === f.value
                      ? 'border-ink-900 bg-ink-50'
                      : 'border-ink-100 bg-white hover:bg-ink-50'
                  }`}
                >
                  <span className="block text-xs font-medium text-ink-900">{f.label}</span>
                  <span className="block text-[11px] text-ink-500">{f.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex items-start gap-2 rounded-lg border border-ink-100 p-3">
              <input
                type="checkbox"
                checked={editing.prepaid && editing.refundRate === 0}
                onChange={(e) =>
                  set({ prepaid: e.target.checked, refundRate: e.target.checked ? 0 : 1 })
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-medium text-ink-700">
                  Paid, non-refundable
                </span>
                <span className="block text-[11px] text-ink-500">
                  Money already gone if this falls through
                </span>
              </span>
            </label>

            <label className="flex items-start gap-2 rounded-lg border border-ink-100 p-3">
              <input
                type="checkbox"
                checked={editing.sensibleHours !== undefined}
                onChange={(e) =>
                  set({
                    sensibleHours: e.target.checked
                      ? { earliest: toMinutes('09:00'), latest: toMinutes('17:00') }
                      : undefined,
                  })
                }
                className="mt-0.5"
              />
              <span>
                <span className="block text-xs font-medium text-ink-700">
                  Only sensible at certain hours
                </span>
                <span className="block text-[11px] text-ink-500">
                  Opening hours, daylight, a night market
                </span>
              </span>
            </label>
          </div>

          {editing.sensibleHours && (
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">Not before</span>
                <input
                  type="time"
                  value={hhmm(editing.sensibleHours.earliest)}
                  onChange={(e) =>
                    set({
                      sensibleHours: {
                        earliest: toMinutes(e.target.value || '09:00'),
                        latest: editing.sensibleHours!.latest,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">
                  Cannot start after
                </span>
                <input
                  type="time"
                  value={hhmm(editing.sensibleHours.latest)}
                  onChange={(e) =>
                    set({
                      sensibleHours: {
                        earliest: editing.sensibleHours!.earliest,
                        latest: toMinutes(e.target.value || '17:00'),
                      },
                    })
                  }
                  className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
                />
              </label>
            </div>
          )}

          {candidateDeps.length > 0 && (
            <div className="mt-4">
              <span className="mb-2 block text-xs font-medium text-ink-700">
                Depends on — what has to happen first
              </span>
              <div className="flex flex-wrap gap-2">
                {candidateDeps.map((other) => {
                  const on = editing.dependsOn.includes(other.id)
                  return (
                    <button
                      key={other.id}
                      onClick={() =>
                        set({
                          dependsOn: on
                            ? editing.dependsOn.filter((x) => x !== other.id)
                            : [...editing.dependsOn, other.id],
                        })
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                        on
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
                      }`}
                    >
                      <span aria-hidden>{other.icon}</span> {other.title || 'Untitled'}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={busy || !editing.title.trim()}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {trip.items.length === 0 && !editing && (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">
            Nothing planned yet. Add a few things — mark the outdoor ones, and say what
            depends on what.
          </p>
        </Card>
      )}

      <ul className="space-y-2">
        {[...trip.items]
          .sort((a, b) => a.day - b.day || a.start - b.start)
          .map((item) => (
            <li key={item.id}>
              <Card className="flex flex-wrap items-center gap-3 p-4">
                <span className="text-base" aria-hidden>{item.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-ink-900">
                    {item.title}
                    {item.outdoor && <Badge tone="shifted">outdoors</Badge>}
                    {item.prepaid && item.refundRate === 0 && item.cost > 0 && (
                      <Badge tone="neutral">non-refundable</Badge>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-500">
                    Day {item.day} · {hhmm(item.start)}–{hhmm(item.start + item.durationMin)}
                    {item.cost > 0 && ` · RM${item.cost}`}
                    {item.dependsOn.length > 0 && ` · after ${item.dependsOn.length}`}
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setEditing(item)}>Edit</Button>
                <Button variant="ghost" onClick={() => onDelete(item.id)}>Delete</Button>
              </Card>
            </li>
          ))}
      </ul>
    </div>
  )
}
