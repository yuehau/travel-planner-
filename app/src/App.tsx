import { useMemo, useState } from 'react'
import type { Cascade, RepairAction, RepairResult } from './types'
import { DISRUPTION, SEED_TRIP } from './data/seed'
import { computeCascade, formatMins } from './engine/cascade'
import { repair } from './engine/claude'
import { Timeline } from './components/Timeline'
import { GroupPanel } from './components/GroupPanel'
import { OptionCard } from './components/OptionCard'
import { Badge, Button, Card, Money, SectionTitle } from './components/ui'

type Stage = 'plan' | 'analysing' | 'options' | 'applied'

export function App() {
  const trip = SEED_TRIP
  const [stage, setStage] = useState<Stage>('plan')
  const [cascade, setCascade] = useState<Cascade>()
  const [result, setResult] = useState<RepairResult>()
  const [selected, setSelected] = useState<string>()
  const [applied, setApplied] = useState<RepairAction[]>()

  const baseline = useMemo(() => trip.items.reduce((s, i) => s + i.cost, 0), [trip])
  const appliedOption = result?.options.find((o) => o.id === selected)

  async function triggerDisruption() {
    const next = computeCascade(trip, DISRUPTION.itemId, DISRUPTION.delayMin)
    setCascade(next)
    setStage('analysing')
    const repaired = await repair(trip, next)
    setResult(repaired)
    setSelected(repaired.options[0]?.id)
    setStage('options')
  }

  function reset() {
    setStage('plan'); setCascade(undefined); setResult(undefined)
    setSelected(undefined); setApplied(undefined)
  }

  const brokenItems = cascade?.brokenIds.map((id) => trip.items.find((i) => i.id === id)!) ?? []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* ---------- header ---------- */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>🧭</span>
            <span className="text-lg font-semibold tracking-tight text-ink-900">Detour</span>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900">
            {trip.destination}
          </h1>
          <p className="text-sm text-ink-500">
            {trip.nights} nights · {trip.members.length} travellers · planned spend{' '}
            <Money value={baseline} /> of <Money value={trip.budget} />
          </p>
        </div>

        <div className="flex items-center gap-2">
          {stage !== 'plan' && (
            <Button variant="ghost" onClick={reset}>Reset demo</Button>
          )}
          {stage === 'plan' && (
            <Button variant="danger" onClick={triggerDisruption}>
              Simulate: {DISRUPTION.label}
            </Button>
          )}
        </div>
      </header>

      {/* ---------- disruption banner ---------- */}
      {cascade && (
        <Card className="rise mb-6 border-break-100 bg-break-100/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span aria-hidden>⚠️</span>
                <h2 className="text-sm font-semibold text-break-600">{DISRUPTION.label}</h2>
              </div>
              <p className="mt-1 text-sm text-ink-700">
                {DISRUPTION.detail} — {formatMins(cascade.delayMin)} late.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Broken" value={String(cascade.brokenIds.length)} tone="break" />
              <Stat label="Running late" value={String(cascade.shiftedIds.length)} tone="warn" />
              <Stat label="Unaffected" value={String(cascade.safeIds.length)} tone="ink" />
              <Stat label="At risk" value={`RM${cascade.atRisk}`} tone="break" />
            </div>
          </div>

          {brokenItems.length > 0 && (
            <div className="mt-3 border-t border-break-100 pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                Walked the dependency graph — {cascade.brokenIds.length} broken, {cascade.shiftedIds.length} still viable
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {cascade.outcomes
                  .filter((o) => o.status !== 'safe')
                  .map((o) => {
                    const item = trip.items.find((i) => i.id === o.itemId)!
                    return (
                      <li key={o.itemId} className="text-xs text-ink-700">
                        <span aria-hidden>{item.icon}</span>{' '}
                        <span className="font-medium">{item.title}</span>
                        <span className="text-ink-500"> — {o.reason}</span>
                      </li>
                    )
                  })}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* ---------- recovery options ---------- */}
      {stage === 'analysing' && (
        <Card className="mb-6 p-8 text-center">
          <p className="text-sm text-ink-500">Working out what can be salvaged…</p>
        </Card>
      )}

      {stage === 'options' && result && (
        <section className="rise mb-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <SectionTitle hint="Three different values, not three points on one axis. Pick what matters tonight.">
              Recovery options
            </SectionTitle>
            <Badge tone={result.source === 'claude' ? 'brand' : 'neutral'}>
              {result.source === 'claude' ? 'Claude · live' : 'Offline engine'}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {result.options.map((option) => (
              <OptionCard
                key={option.id}
                trip={trip}
                option={option}
                selected={selected === option.id}
                onSelect={() => setSelected(option.id)}
                onApply={() => { setSelected(option.id); setApplied(option.actions); setStage('applied') }}
              />
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            No option satisfies everyone: protecting Ali’s must-do pushes Sarah past her ceiling,
            and staying inside Sarah’s ceiling costs Ali the thing he booked the trip for.
            That is a real decision, and it belongs to the group — the app’s job is to make it
            visible in seconds instead of an hour of group chat.
          </p>
        </section>
      )}

      {/* ---------- applied ---------- */}
      {stage === 'applied' && appliedOption && (
        <Card className="rise mb-6 border-safe-100 bg-safe-100/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-safe-600">
                ✓ “{appliedOption.name}” applied
              </h2>
              <p className="mt-0.5 text-sm text-ink-700">
                Itinerary rewritten · budget updated · all {trip.members.length} travellers notified.
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-ink-500">New total</p>
              <p className="font-semibold tabular-nums text-ink-900">
                <Money value={baseline + appliedOption.costDelta} />{' '}
                <span className={appliedOption.costDelta > 0 ? 'text-break-600' : 'text-safe-600'}>
                  (<Money value={appliedOption.costDelta} signed />)
                </span>
              </p>
            </div>
          </div>
          <Button variant="ghost" className="mt-3" onClick={() => setStage('options')}>
            ← Back to options
          </Button>
        </Card>
      )}

      {/* ---------- main body ---------- */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-4 md:p-5">
          <SectionTitle
            hint={
              stage === 'plan'
                ? 'Every arrow is a real dependency. That is what makes a break computable.'
                : undefined
            }
          >
            Itinerary
          </SectionTitle>
          <Timeline trip={trip} cascade={cascade} applied={applied} />
        </Card>

        <GroupPanel trip={trip} />
      </div>

      <footer className="mt-10 border-t border-ink-100 pt-4 text-xs text-ink-300">
        Prototype · seeded data · no live booking integrations.
        Repair strategies come from Claude when an endpoint is configured, otherwise from
        the offline engine. All monetary figures are computed locally from the trip’s own rows.
      </footer>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'break' | 'warn' | 'ink' }) {
  const color = { break: 'text-break-600', warn: 'text-warn-600', ink: 'text-ink-700' }[tone]
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${color}`}>{value}</p>
    </div>
  )
}
