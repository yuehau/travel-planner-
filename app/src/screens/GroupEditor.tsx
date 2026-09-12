import { useState } from 'react'
import type { Interest, Member, Pace, Preferences, Trip } from '../types'
import { INTEREST_LABEL, INTERESTS } from '../types'
import { Avatar, Badge, Button, Card, SectionTitle } from '../components/ui'

const TONES = ['#0f766e', '#b45309', '#7c3aed', '#0369a1', '#be185d', '#15803d']
const PACES: Pace[] = ['packed', 'balanced', 'slow']

const blankPreferences = (): Preferences => ({
  interests: { food: 3, culture: 3, nature: 3, nightlife: 3, rest: 3 },
  budgetCeiling: 500,
  pace: 'balanced',
  nonNegotiables: [],
})

interface Props {
  trip: Trip
  onSave: (member: Member) => Promise<void>
  onRemove: (memberId: string) => Promise<void>
  onDone: () => void
}

export function GroupEditor({ trip, onSave, onRemove, onDone }: Props) {
  const [editing, setEditing] = useState<Member | null>(null)
  const [busy, setBusy] = useState(false)

  const share = trip.members.length
    ? Math.round(trip.items.reduce((s, i) => s + i.cost, 0) / trip.members.length)
    : 0

  function startNew() {
    setEditing({
      id: `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      name: '',
      tone: TONES[trip.members.length % TONES.length],
      preferences: blankPreferences(),
    })
  }

  async function save() {
    if (!editing || !editing.name.trim()) return
    setBusy(true)
    try {
      await onSave({ ...editing, name: editing.name.trim() })
      setEditing(null)
    } finally {
      setBusy(false)
    }
  }

  const patch = (updates: Partial<Preferences>) =>
    setEditing((m) => (m ? { ...m, preferences: { ...m.preferences, ...updates } } : m))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Who is coming</h1>
          <p className="text-sm text-ink-500">{trip.destination} · {trip.startDate}</p>
        </div>
        <div className="flex gap-2">
          {!editing && <Button onClick={startNew}>Add someone</Button>}
          <Button variant="ghost" onClick={onDone}>Done</Button>
        </div>
      </header>

      <Card className="mb-6 border-brand-100 bg-brand-100/30 p-4">
        <p className="text-sm leading-relaxed text-ink-700">
          What people tell you here is what the repair engine optimises against when
          something breaks. A <span className="font-medium">must-do</span> is treated as
          near-inviolable; a <span className="font-medium">budget ceiling</span> is what
          decides whether an option is even offered. Vague answers give vague repairs.
        </p>
      </Card>

      {editing && (
        <Card className="rise mb-6 p-4 md:p-5">
          <SectionTitle>{trip.members.some((m) => m.id === editing.id) ? 'Edit' : 'New traveller'}</SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Name</span>
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="Ali"
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">
                Their budget ceiling (RM)
              </span>
              <input
                type="number"
                min={0}
                step={20}
                value={editing.preferences.budgetCeiling}
                onChange={(e) => patch({ budgetCeiling: Number(e.target.value) })}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
              />
              {share > 0 && (
                <span className={`mt-1 block text-[11px] ${
                  share > editing.preferences.budgetCeiling ? 'text-break-600' : 'text-ink-500'
                }`}>
                  Current share is RM{share}
                  {share > editing.preferences.budgetCeiling && ' — already over this ceiling'}
                </span>
              )}
            </label>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-xs font-medium text-ink-700">
              What they care about
            </span>
            <div className="space-y-2">
              {INTERESTS.map((key: Interest) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-ink-500">{INTEREST_LABEL[key]}</span>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={editing.preferences.interests[key]}
                    onChange={(e) =>
                      patch({
                        interests: {
                          ...editing.preferences.interests,
                          [key]: Number(e.target.value),
                        },
                      })
                    }
                    className="flex-1"
                    style={{ accentColor: editing.tone }}
                  />
                  <span className="w-4 text-right text-xs tabular-nums text-ink-700">
                    {editing.preferences.interests[key]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <span className="mb-2 block text-xs font-medium text-ink-700">Pace</span>
            <div className="flex gap-2">
              {PACES.map((pace) => (
                <button
                  key={pace}
                  onClick={() => patch({ pace })}
                  className={`rounded-lg border px-3 py-1.5 text-xs capitalize transition ${
                    editing.preferences.pace === pace
                      ? 'border-ink-900 bg-ink-900 text-white'
                      : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
                  }`}
                >
                  {pace}
                </button>
              ))}
            </div>
          </div>

          {trip.items.length > 0 && (
            <div className="mt-4">
              <span className="mb-2 block text-xs font-medium text-ink-700">
                Must-dos — what they will not give up
              </span>
              <div className="flex flex-wrap gap-2">
                {trip.items.filter((i) => i.flexibility !== 'locked').map((item) => {
                  const on = editing.preferences.nonNegotiables.includes(item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() =>
                        patch({
                          nonNegotiables: on
                            ? editing.preferences.nonNegotiables.filter((x) => x !== item.id)
                            : [...editing.preferences.nonNegotiables, item.id],
                        })
                      }
                      className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
                        on
                          ? 'border-ink-900 bg-ink-900 text-white'
                          : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
                      }`}
                    >
                      <span aria-hidden>{item.icon}</span> {item.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-medium text-ink-700">
              Anything the group should know
            </span>
            <textarea
              rows={2}
              value={editing.preferences.note ?? ''}
              onChange={(e) => patch({ note: e.target.value || undefined })}
              placeholder="Shellfish allergy — anywhere we eat needs an option for me."
              className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
            />
          </label>

          <div className="mt-4 flex gap-2">
            <Button onClick={save} disabled={busy || !editing.name.trim()}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </Card>
      )}

      {trip.members.length === 0 && !editing && (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">
            Nobody added yet. Add at least one person — without preferences there is
            nothing for the repair engine to weigh.
          </p>
        </Card>
      )}

      <ul className="space-y-2">
        {trip.members.map((member) => (
          <li key={member.id}>
            <Card className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={member.name} tone={member.tone} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-900">{member.name}</p>
                <p className="text-xs text-ink-500">
                  <span className="capitalize">{member.preferences.pace}</span> pace · ceiling RM
                  {member.preferences.budgetCeiling}
                  {member.preferences.nonNegotiables.length > 0 &&
                    ` · ${member.preferences.nonNegotiables.length} must-do`}
                </p>
              </div>
              {share > member.preferences.budgetCeiling && <Badge tone="broken">over ceiling</Badge>}
              <Button variant="ghost" onClick={() => setEditing(member)}>Edit</Button>
              <Button variant="ghost" onClick={() => onRemove(member.id)}>Remove</Button>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
