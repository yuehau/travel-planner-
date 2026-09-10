import { useState } from 'react'
import { Button, Group, Modal, SegmentedControl, Text } from '@mantine/core'
import type { LensId } from '../domain/types'
import { useTripStore } from '../store/tripStore'
import { StopForm } from './StopForm'

export function Header() {
  const trip = useTripStore((s) => s.trip)
  const members = useTripStore((s) => s.members)
  const lens = useTripStore((s) => s.lens)
  const setLens = useTripStore((s) => s.setLens)
  const reset = useTripStore((s) => s.reset)
  const addStop = useTripStore((s) => s.addStop)
  const [adding, setAdding] = useState(false)

  return (
    <>
      <Group justify="space-between" className="border-b border-gray-200 bg-white px-6 py-3">
        <div>
          <Text fw={600} size="md">{trip.destination}</Text>
          <Text size="xs" c="dimmed">
            {trip.days} days · {trip.currency} {trip.budgetPerPerson} per person · {members.length} travellers
          </Text>
        </div>
        <Group gap="sm">
          <SegmentedControl
            size="xs"
            value={lens}
            onChange={(value) => setLens(value as LensId)}
            // All three lenses stay visible because they communicate the product
            // direction, but only categories has a graph builder. Phase 4 adds
            // itinerary.ts and people.ts and drops these disabled flags.
            data={[
              { label: 'Categories', value: 'categories' },
              { label: 'Itinerary', value: 'itinerary', disabled: true },
              { label: 'People', value: 'people', disabled: true },
            ]}
          />
          <Button size="xs" onClick={() => setAdding(true)}>Add stop</Button>
          <Button size="xs" variant="default" onClick={reset}>Reset trip</Button>
        </Group>
      </Group>
      <Modal opened={adding} onClose={() => setAdding(false)} title="Add a stop" size="md">
        <StopForm
          // Fresh fields every time the modal opens rather than whatever was
          // half-typed last time.
          key={adding ? 'open' : 'closed'}
          submitLabel="Add stop"
          onCancel={() => setAdding(false)}
          onSubmit={(draft) => {
            addStop(draft)
            setAdding(false)
          }}
        />
      </Modal>
    </>
  )
}
