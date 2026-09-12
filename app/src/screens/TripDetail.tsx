import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Cascade, Impairment, RepairAction, RepairResult, Trip, TripItem } from '../types'
import {
  BREAK_PROBABILITY, fetchForecast, impairmentsFromForecast, rainRiskFor, simulatedMonsoon,
  type Forecast,
} from '../data/weather'
import { computeCascade } from '../engine/cascade'
import { repair } from '../engine/claude'
import type { RepairConstraints } from '../engine/repair'
import { Timeline } from '../components/Timeline'
import { GroupPanel } from '../components/GroupPanel'
import { OptionCard } from '../components/OptionCard'
import { WeatherStrip } from '../components/WeatherStrip'
import { Badge, Button, Card, Money, SectionTitle } from '../components/ui'

type Stage = 'plan' | 'analysing' | 'options' | 'applied' | 'clear'

interface Props {
  trip: Trip
  onBack: () => void
  onEditGroup: () => void
  onEditPlan: () => void
  /** Where the trip came from — shown in the footer so it is never a mystery. */
  storageNote: string
}

export function TripDetail({ trip, onBack, onEditGroup, onEditPlan, storageNote }: Props) {
  const [stage, setStage] = useState<Stage>('plan')
  const [forecast, setForecast] = useState<Forecast>()
  const [loadingForecast, setLoadingForecast] = useState(true)
  const [cascade, setCascade] = useState<Cascade>()
  const [result, setResult] = useState<RepairResult>()
  const [selected, setSelected] = useState<string>()
  const [applied, setApplied] = useState<RepairAction[]>()

  const baseline = useMemo(() => trip.items.reduce((s, i) => s + i.cost, 0), [trip])
  const appliedOption = result?.options.find((o) => o.id === selected)

  // Live forecast on load. Falls back to nothing rather than blocking the page.
  useEffect(() => {
    let cancelled = false
    fetchForecast(trip).then((f) => {
      if (cancelled) return
      if (f) setForecast(f)
      setLoadingForecast(false)
    })
    return () => { cancelled = true }
  }, [trip])

  /**
   * Stops the repair engine rebooking an outdoor item into weather just as bad.
   * Without this, "move it later today" is a free slot and useless advice.
   */
  const constraintsFor = useCallback(
    (active: Forecast): RepairConstraints => ({
      slotViable: (item: TripItem, day: number, start: number) => {
        if (!item.outdoor) return true
        const risk = rainRiskFor(active, trip, item, day, start)
        return !risk || risk.probability < BREAK_PROBABILITY
      },
    }),
    [trip],
  )

  async function runCheck(active: Forecast) {
    setForecast(active)
    const impairments: Impairment[] = impairmentsFromForecast(trip, active)

    if (impairments.length === 0) {
      setStage('clear')
      return
    }

    const next = computeCascade(trip, impairments)
    setCascade(next)
    setStage('analysing')
    const repaired = await repair(trip, next, constraintsFor(active))
    setResult(repaired)
    setSelected(repaired.options[0]?.id)
    setStage('options')
  }

  const reset = useCallback(() => {
    setStage('plan'); setCascade(undefined); setResult(undefined)
    setSelected(undefined); setApplied(undefined)
  }, [])

  useEffect(() => { reset() }, [trip.id, reset])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* ---------- header ---------- */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>🧭</span>
            <span className="text-lg font-semibold tracking-tight text-ink-900">Detour</span>
            <Badge tone="neutral">Malaysia</Badge>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900">
            {trip.destination}
          </h1>
          <p className="text-sm text-ink-500">
            {trip.startDate} · {trip.nights} {trip.nights === 1 ? 'night' : 'nights'} ·{' '}
            {trip.members.length} {trip.members.length === 1 ? 'traveller' : 'travellers'} ·
            planned spend <Money value={baseline} /> of <Money value={trip.budget} />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={onBack}>← Trips</Button>
          <Button variant="ghost" onClick={onEditPlan}>
            {trip.items.length ? 'Edit plan' : 'Add plans'}
          </Button>
          <Button variant="ghost" onClick={onEditGroup}>
            {trip.members.length ? 'Edit group' : 'Add people'}
          </Button>
          {stage !== 'plan' && <Button variant="ghost" onClick={reset}>Reset</Button>}
          {(stage === 'plan' || stage === 'clear') && (
            <>
              <Button
                variant="ghost"
                disabled={!forecast || loadingForecast}
                onClick={() => forecast && runCheck(forecast)}
              >
                Check live forecast
              </Button>
              <Button variant="danger" onClick={() => runCheck(simulatedMonsoon(trip))}>
                Simulate monsoon
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ---------- forecast ---------- */}
      <div className="mb-6">
        {loadingForecast && (
          <Card className="p-4 text-sm text-ink-500">Fetching the forecast for {trip.destination}…</Card>
        )}
        {!loadingForecast && !forecast && (
          <Card className="border-warn-100 bg-warn-100/40 p-4">
            <p className="text-sm text-ink-700">
              <span className="font-medium">Live forecast unavailable.</span> The app is
              offline or the weather service did not respond. Everything still works —
              use <span className="font-medium">Simulate monsoon</span> to see the repair flow.
            </p>
          </Card>
        )}
        {forecast && <WeatherStrip trip={trip} forecast={forecast} />}
      </div>

      {/* ---------- clear weather ---------- */}
      {stage === 'clear' && (
        <Card className="rise mb-6 border-safe-100 bg-safe-100/40 p-4">
          <h2 className="text-sm font-semibold text-safe-600">✓ Nothing to fix</h2>
          <p className="mt-1 text-sm text-ink-700">
            No outdoor plan crosses the {BREAK_PROBABILITY}% rain threshold. That is the
            normal state, and it is the right answer — the app should stay quiet when your
            plan is fine. Use <span className="font-medium">Simulate monsoon</span> to see
            what happens when it is not.
          </p>
        </Card>
      )}

      {/* ---------- disruption banner ---------- */}
      {cascade && (
        <Card className="rise mb-6 border-break-100 bg-break-100/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span aria-hidden>🌧️</span>
                <h2 className="text-sm font-semibold text-break-600">
                  Rain is going to take out your Saturday
                </h2>
              </div>
              <p className="mt-1 text-sm text-ink-700">
                {cascade.impairments.length} outdoor{' '}
                {cascade.impairments.length === 1 ? 'plan' : 'plans'} are not viable in this
                forecast — and you can see it days ahead, not at the trailhead.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <Stat label="Broken" value={String(cascade.brokenIds.length)} tone="break" />
              <Stat label="Still on" value={String(cascade.safeIds.length)} tone="ink" />
              <Stat label="At risk" value={`RM${cascade.atRisk}`} tone="break" />
            </div>
          </div>

          <div className="mt-3 border-t border-break-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              What the forecast rules out
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
        </Card>
      )}

      {/* ---------- recovery options ---------- */}
      {stage === 'analysing' && (
        <Card className="mb-6 p-8 text-center">
          <p className="text-sm text-ink-500">Working out what can be saved…</p>
        </Card>
      )}

      {stage === 'options' && result && (
        <section className="rise mb-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <SectionTitle hint="Three different values, not three points on one axis. Pick what matters this weekend.">
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
            Nothing here is rescheduled into more rain — the engine checks the forecast for
            each candidate slot, not just whether the calendar is free. Where an outdoor
            plan has nowhere dry to go, it is dropped rather than quietly moved into the
            same storm.
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
                Itinerary rewritten · budget updated · all {trip.members.length} friends notified.
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
                ? 'Outdoor plans carry their rain risk. Every arrow is a real dependency.'
                : undefined
            }
          >
            Itinerary
          </SectionTitle>
          <Timeline trip={trip} cascade={cascade} applied={applied} forecast={forecast} />
        </Card>

        <GroupPanel trip={trip} />
      </div>

      <footer className="mt-10 border-t border-ink-100 pt-4 text-xs leading-relaxed text-ink-300">
        {storageNote} No live booking integrations. Forecast from Open-Meteo (no API key).
        Repair strategies come from Claude when an endpoint is configured, otherwise from
        the offline engine. All monetary figures are computed locally from the trip’s own
        rows — the model is never asked for a number.
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
