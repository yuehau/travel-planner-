import { useCallback, useEffect, useState } from 'react'
import type { Member, Trip, TripItem } from './types'
import { getRepo, type NewTrip, type TripRepo, type TripSummary } from './data/repo'
import { TripsList } from './screens/TripsList'
import { TripDetail } from './screens/TripDetail'
import { GroupEditor } from './screens/GroupEditor'
import { ItemEditor } from './screens/ItemEditor'
import { Card } from './components/ui'

type View =
  | { name: 'trips' }
  | { name: 'trip'; id: string }
  | { name: 'group'; id: string }
  | { name: 'plan'; id: string }

export function App() {
  const [repo, setRepo] = useState<TripRepo>()
  const [view, setView] = useState<View>({ name: 'trips' })
  const [summaries, setSummaries] = useState<TripSummary[]>([])
  const [trip, setTrip] = useState<Trip>()
  const [fatal, setFatal] = useState<string>()

  useEffect(() => {
    getRepo()
      .then(setRepo)
      .catch((err) => setFatal(err instanceof Error ? err.message : String(err)))
  }, [])

  const refreshList = useCallback(async (r: TripRepo) => {
    setSummaries(await r.listTrips())
  }, [])

  useEffect(() => {
    if (repo) void refreshList(repo)
  }, [repo, refreshList])

  // Load the open trip whenever the view or the underlying data changes.
  const loadTrip = useCallback(async (id: string) => {
    if (!repo) return
    setTrip((await repo.getTrip(id)) ?? undefined)
  }, [repo])

  useEffect(() => {
    if (view.name === 'trips') { setTrip(undefined); return }
    void loadTrip(view.id)
  }, [view, loadTrip])

  if (fatal) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="border-break-100 bg-break-100/40 p-5">
          <h1 className="text-sm font-semibold text-break-600">Could not start</h1>
          <p className="mt-1 text-sm text-ink-700">{fatal}</p>
        </Card>
      </div>
    )
  }

  if (!repo) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-5 text-sm text-ink-500">Loading your trips…</Card>
      </div>
    )
  }

  async function createTrip(input: NewTrip) {
    const created = await repo!.createTrip(input)
    await refreshList(repo!)
    // Straight into the plan: must-dos reference items, so the itinerary has to
    // exist before preferences mean anything.
    setView({ name: 'plan', id: created.id })
  }

  async function deleteTrip(id: string) {
    await repo!.deleteTrip(id)
    await refreshList(repo!)
    setView({ name: 'trips' })
  }

  async function saveMember(member: Member) {
    if (view.name !== 'group') return
    await repo!.upsertMember(view.id, member)
    await repo!.setPreferences(view.id, member.id, member.preferences)
    await loadTrip(view.id)
    await refreshList(repo!)
  }

  async function removeMember(memberId: string) {
    if (view.name !== 'group') return
    await repo!.removeMember(view.id, memberId)
    await loadTrip(view.id)
    await refreshList(repo!)
  }

  async function saveItem(item: TripItem) {
    if (view.name !== 'plan') return
    await repo!.upsertItem(view.id, item)
    await loadTrip(view.id)
    await refreshList(repo!)
  }

  async function deleteItem(itemId: string) {
    if (view.name !== 'plan') return
    await repo!.deleteItem(view.id, itemId)
    await loadTrip(view.id)
    await refreshList(repo!)
  }

  if (view.name === 'trips') {
    return (
      <TripsList
        trips={summaries}
        storageMode={repo.mode}
        storageNote={repo.note}
        onOpen={(id) => setView({ name: 'trip', id })}
        onDelete={deleteTrip}
        onCreate={createTrip}
      />
    )
  }

  if (!trip) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="p-5 text-sm text-ink-500">Loading trip…</Card>
      </div>
    )
  }

  if (view.name === 'group') {
    return (
      <GroupEditor
        trip={trip}
        onSave={saveMember}
        onRemove={removeMember}
        onDone={() => setView({ name: 'trip', id: trip.id })}
      />
    )
  }

  if (view.name === 'plan') {
    return (
      <ItemEditor
        trip={trip}
        onSave={saveItem}
        onDelete={deleteItem}
        onDone={() => setView({ name: 'trip', id: trip.id })}
      />
    )
  }

  return (
    <TripDetail
      trip={trip}
      onBack={() => setView({ name: 'trips' })}
      onEditGroup={() => setView({ name: 'group', id: trip.id })}
      onEditPlan={() => setView({ name: 'plan', id: trip.id })}
      storageNote={repo.note}
    />
  )
}
