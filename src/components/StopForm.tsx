import { useState } from 'react'
import {
  Button,
  Group,
  MultiSelect,
  NumberInput,
  Select,
  Stack,
  Textarea,
  TextInput,
} from '@mantine/core'
import type { StopCategory } from '../domain/types'
import { DEFAULT_COORDS, validateStop, type StopDraft } from '../domain/stops'
import { useTripStore } from '../store/tripStore'

const CATEGORIES: StopCategory[] = ['food', 'sight', 'nature', 'cafe', 'market']

function blankDraft(initial?: Partial<StopDraft>): StopDraft {
  return {
    day: 1,
    name: '',
    start: '09:00',
    durationMin: 60,
    costPerPerson: 0,
    lat: DEFAULT_COORDS.lat,
    lng: DEFAULT_COORDS.lng,
    category: 'sight',
    serves: [],
    conflicts: [],
    reason: '',
    ...initial,
  }
}

export function StopForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<StopDraft>
  submitLabel: string
  onSubmit: (draft: StopDraft) => void
  onCancel?: () => void
}) {
  const members = useTripStore((s) => s.members)
  const days = useTripStore((s) => s.trip.days)
  const currency = useTripStore((s) => s.trip.currency)

  const [draft, setDraft] = useState<StopDraft>(() => blankDraft(initial))
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = <K extends keyof StopDraft>(key: K, value: StopDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const memberOptions = members.map((m) => ({ value: m.id, label: m.name }))

  const submit = () => {
    const found = validateStop(draft, days)
    setErrors(found)
    if (Object.keys(found).length === 0) onSubmit(draft)
  }

  return (
    <Stack gap="sm">
      <TextInput
        label="Name"
        value={draft.name}
        error={errors.name}
        onChange={(e) => set('name', e.currentTarget.value)}
      />
      <Group grow>
        <NumberInput
          label="Day"
          min={1}
          max={days}
          value={draft.day}
          error={errors.day}
          // Fall back to NaN, not a valid day like 1 — a valid fallback would pass
          // validateStop silently and let a cleared field submit as day 1 unnoticed.
          onChange={(v) => set('day', typeof v === 'number' ? v : NaN)}
        />
        <TextInput
          label="Start"
          placeholder="09:30"
          value={draft.start}
          error={errors.start}
          onChange={(e) => set('start', e.currentTarget.value)}
        />
      </Group>
      <Group grow>
        <NumberInput
          label="Minutes"
          min={1}
          value={draft.durationMin}
          error={errors.durationMin}
          onChange={(v) => set('durationMin', typeof v === 'number' ? v : NaN)}
        />
        <NumberInput
          label={`Cost (${currency})`}
          min={0}
          value={draft.costPerPerson}
          error={errors.costPerPerson}
          onChange={(v) => set('costPerPerson', typeof v === 'number' ? v : NaN)}
        />
      </Group>
      <Select
        label="Kind"
        data={CATEGORIES.map((c) => ({ value: c, label: c }))}
        value={draft.category}
        onChange={(v) => set('category', (v ?? 'sight') as StopCategory)}
      />
      <MultiSelect
        label="Planned for"
        data={memberOptions}
        value={draft.serves}
        error={errors.serves}
        onChange={(v) => set('serves', v)}
      />
      <MultiSelect
        label="At the cost of"
        data={memberOptions}
        value={draft.conflicts}
        error={errors.conflicts}
        onChange={(v) => set('conflicts', v)}
      />
      <Textarea
        label="Why"
        autosize
        minRows={2}
        value={draft.reason}
        onChange={(e) => set('reason', e.currentTarget.value)}
      />
      <Group justify="flex-end" gap="xs" mt="xs">
        {onCancel && (
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={submit}>{submitLabel}</Button>
      </Group>
    </Stack>
  )
}
