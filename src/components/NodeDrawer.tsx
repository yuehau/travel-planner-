import { Badge, Drawer, Group, Stack, Text } from '@mantine/core'
import type { Booking, Expense, Member, Stop } from '../domain/types'
import { useTripStore } from '../store/tripStore'

function endTime(start: string, durationMin: number) {
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + durationMin
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function MemberBadges({ ids }: { ids: string[] }) {
  const members = useTripStore((s) => s.members)
  if (ids.length === 0) return <Text size="sm" c="dimmed">Nobody</Text>
  return (
    <Group gap="xs">
      {ids.map((id) => {
        const m = members.find((x) => x.id === id)
        if (!m) return null
        return (
          <Badge key={id} variant="outline" style={{ color: m.color, borderColor: m.color }}>
            {m.name}
          </Badge>
        )
      })}
    </Group>
  )
}

export function NodeDrawer() {
  const selectedNodeId = useTripStore((s) => s.selectedNodeId)
  const select = useTripStore((s) => s.select)
  const { stops, bookings, expenses, members, trip } = useTripStore((s) => s)

  const stop = stops.find((s) => s.id === selectedNodeId)
  const booking = bookings.find((b) => b.id === selectedNodeId)
  const expense = expenses.find((e) => e.id === selectedNodeId)
  const member = members.find((m) => m.id === selectedNodeId)
  const open = Boolean(stop || booking || expense || member)

  return (
    <Drawer opened={open} onClose={() => select(null)} position="right" size={380} padding="lg"
      // The drawer must unmount synchronously when `opened` goes false.
      //
      // Mantine 9's `Transition` only advances an exiting element to the
      // "exited" status that unmounts it from inside two nested
      // requestAnimationFrame callbacks (see useTransition.handleStateChange).
      // Whenever those frames are starved -- a hidden, occluded or
      // background-throttled tab -- the exit never begins at all, so the
      // fixed-position overlay stays mounted at opacity 1 with
      // pointer-events: auto and swallows every click on the canvas long
      // after `selectedNodeId` is null.
      //
      // A zero exitDuration takes Transition's synchronous branch instead: the
      // element becomes a pure function of `opened`, with no rAF and no
      // timers, so nothing can outlive the closed state. This also closes the
      // ~200ms window during a normal fade-out where the overlay is already
      // invisible but still intercepts the next click.
      //
      // The enter animation is unaffected -- the panel still slides in over
      // 200ms; only the exit is immediate.
      transitionProps={{ duration: 200, exitDuration: 0 }}
      overlayProps={{ transitionProps: { duration: 0 } }}
      title={stop?.name ?? booking?.title ?? member?.name ?? (expense ? 'Expense' : '')}>
      {stop && <StopBody stop={stop} currency={trip.currency} />}
      {booking && <BookingBody booking={booking} currency={trip.currency} />}
      {expense && <ExpenseBody expense={expense} currency={trip.currency} />}
      {member && <MemberBody member={member} />}
    </Drawer>
  )
}

function StopBody({ stop, currency }: { stop: Stop; currency: string }) {
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        Day {stop.day} · {stop.start}–{endTime(stop.start, stop.durationMin)} · {stop.durationMin} min · {currency} {stop.costPerPerson} per person
      </Text>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Planned for</Text>
        <MemberBadges ids={stop.serves} />
      </div>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>At the cost of</Text>
        <MemberBadges ids={stop.conflicts} />
        {stop.conflicts.length > 0 && <Text size="sm" mt="sm">{stop.reason}</Text>}
      </div>
    </Stack>
  )
}

function BookingBody({ booking, currency }: { booking: Booking; currency: string }) {
  return (
    <Stack gap="xs">
      <Text size="sm" c="dimmed">Reference {booking.ref}</Text>
      <Text size="sm">Starts {new Date(booking.start).toLocaleString()}</Text>
      <Text size="sm">Ends {new Date(booking.end).toLocaleString()}</Text>
      <Text size="sm">{currency} {booking.cost} · affects day {booking.affectsDay}</Text>
    </Stack>
  )
}

function ExpenseBody({ expense, currency }: { expense: Expense; currency: string }) {
  return (
    <Stack gap="md">
      <Text size="sm">{currency} {expense.amount}</Text>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Paid by</Text>
        <MemberBadges ids={[expense.paidBy]} />
      </div>
      <div>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={6}>Split among</Text>
        <MemberBadges ids={expense.splitAmong} />
      </div>
    </Stack>
  )
}

function MemberBody({ member }: { member: Member }) {
  return (
    <Stack gap="xs">
      <Text size="sm">Pace: {member.pace}</Text>
      <Text size="sm">Budget cap: {member.budgetCap}</Text>
      <Text size="sm">Must have: {member.must.join(', ') || 'nothing specified'}</Text>
      <Text size="sm">Avoids: {member.avoid.join(', ') || 'nothing'}</Text>
    </Stack>
  )
}
