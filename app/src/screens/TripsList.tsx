import { useState } from 'react'
import { DESTINATIONS, isFlyOnly, type Destination } from '../data/destinations'
import { nextSaturday } from '../data/seed'
import type { TripSummary } from '../data/repo'
import { Badge, Button, Card, Money, SectionTitle } from '../components/ui'

interface Props {
  trips: TripSummary[]
  storageMode: 'local' | 'supabase'
  storageNote: string
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onCreate: (input: {
    destinationId: string; destination: string; lat: number; lon: number
    startDate: string; nights: number; budget: number
  }) => Promise<void>
}

export function TripsList({ trips, storageMode, storageNote, onOpen, onDelete, onCreate }: Props) {
  const [creating, setCreating] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  const [destinationId, setDestinationId] = useState(DESTINATIONS[0].id)
  const [startDate, setStartDate] = useState(nextSaturday())
  const [nights, setNights] = useState(2)
  const [budget, setBudget] = useState(2000)

  const destination = DESTINATIONS.find((d) => d.id === destinationId) as Destination

  async function submit() {
    setError(undefined)
    if (!startDate) return setError('Pick a start date.')
    if (nights < 0 || nights > 30) return setError('Nights must be between 0 and 30.')
    if (budget < 0) return setError('Budget cannot be negative.')

    setBusy(true)
    try {
      await onCreate({
        destinationId: destination.id,
        destination: `${destination.name}, ${destination.state}`,
        lat: destination.lat,
        lon: destination.lon,
        startDate,
        nights,
        budget,
      })
      setCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the trip.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>🧭</span>
            <span className="text-lg font-semibold tracking-tight text-ink-900">Detour</span>
            <Badge tone="neutral">Malaysia</Badge>
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink-900">Your trips</h1>
          <p className="text-sm text-ink-500">
            Plan a getaway close to home. We watch the forecast and tell you when it is
            about to fall apart — days ahead, not at the trailhead.
          </p>
        </div>
        {!creating && <Button onClick={() => setCreating(true)}>New trip</Button>}
      </header>

      <Card
        className={`mb-6 p-3 text-xs ${
          storageMode === 'supabase'
            ? 'border-brand-100 bg-brand-100/30 text-ink-700'
            : 'border-warn-100 bg-warn-100/40 text-ink-700'
        }`}
      >
        <span className="font-medium">
          {storageMode === 'supabase' ? 'Signed in' : 'Local mode'} ·{' '}
        </span>
        {storageNote}
      </Card>

      {creating && (
        <Card className="rise mb-6 p-4 md:p-5">
          <SectionTitle hint="Costs are yours to fill in later — the app never invents a price.">
            New trip
          </SectionTitle>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">Where to</span>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              >
                {DESTINATIONS.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}, {d.state}
                    {isFlyOnly(d) ? ' · fly' : ` · ${d.driveHoursFromKL}h drive from KL`}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-[11px] text-ink-500">{destination.known}</span>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-700">Nights</span>
              <input
                type="number"
                min={0}
                max={30}
                value={nights}
                onChange={(e) => setNights(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-medium text-ink-700">
                Group budget (RM)
              </span>
              <input
                type="number"
                min={0}
                step={50}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm tabular-nums text-ink-900"
              />
            </label>
          </div>

          <div className="mt-3 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
            Forecast comes from {destination.lat.toFixed(3)}, {destination.lon.toFixed(3)}.
            Weather exposure here is {destination.weatherExposure}/5 — the higher it is,
            the more of your plan the rain can take out.
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-break-100 px-3 py-2 text-xs text-break-600">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Creating…' : 'Create trip'}
            </Button>
            <Button variant="ghost" onClick={() => { setCreating(false); setError(undefined) }}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {trips.length === 0 && !creating && (
        <Card className="p-8 text-center">
          <p className="text-sm text-ink-500">
            No trips yet. Start one and we will keep an eye on the weather for it.
          </p>
        </Card>
      )}

      <ul className="space-y-2">
        {trips.map((trip) => (
          <li key={trip.id}>
            <Card className="flex flex-wrap items-center gap-3 p-4 transition hover:border-ink-300">
              <button onClick={() => onOpen(trip.id)} className="min-w-0 flex-1 text-left">
                <p className="text-sm font-semibold text-ink-900">{trip.destination}</p>
                <p className="mt-0.5 text-xs text-ink-500">
                  {trip.startDate} · {trip.nights} {trip.nights === 1 ? 'night' : 'nights'} ·{' '}
                  {trip.memberCount} {trip.memberCount === 1 ? 'traveller' : 'travellers'} ·{' '}
                  {trip.itemCount} {trip.itemCount === 1 ? 'plan' : 'plans'}
                </p>
              </button>
              <Button variant="ghost" onClick={() => onOpen(trip.id)}>Open</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm(`Delete the ${trip.destination} trip? This cannot be undone.`)) {
                    onDelete(trip.id)
                  }
                }}
              >
                Delete
              </Button>
            </Card>
          </li>
        ))}
      </ul>

      <footer className="mt-10 border-t border-ink-100 pt-4 text-xs text-ink-300">
        Destination coordinates are bundled with the app and should be spot-checked —
        a pin in the wrong valley gives you the wrong forecast. Budget figures shown
        anywhere in Detour are entered by you; nothing is estimated on your behalf.
      </footer>
    </div>
  )
}

/** Small helper kept here so the money formatting stays identical across screens. */
export { Money }
