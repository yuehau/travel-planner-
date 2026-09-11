import type { Member, Trip } from '../types'
import { INTEREST_LABEL, INTERESTS } from '../types'
import { Avatar, Card, SectionTitle } from './ui'

function InterestBars({ member }: { member: Member }) {
  return (
    <div className="mt-2 space-y-1">
      {INTERESTS.map((key) => {
        const value = member.preferences.interests[key]
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[11px] text-ink-500">{INTEREST_LABEL[key]}</span>
            <span className="flex gap-0.5" aria-label={`${INTEREST_LABEL[key]}: ${value} of 5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className="h-1.5 w-4 rounded-full"
                  style={{ background: n <= value ? member.tone : 'var(--color-ink-100)' }}
                />
              ))}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function GroupPanel({ trip }: { trip: Trip }) {
  const total = trip.items.reduce((s, i) => s + i.cost, 0)
  const share = Math.round(total / trip.members.length)
  const tightest = [...trip.members].sort(
    (a, b) => a.preferences.budgetCeiling - b.preferences.budgetCeiling,
  )[0]

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <SectionTitle hint="Captured once, at the start. This is what the repair engine optimises against.">
          The group
        </SectionTitle>

        <div className="space-y-3">
          {trip.members.map((member) => {
            const over = share > member.preferences.budgetCeiling
            const headroom = member.preferences.budgetCeiling - share
            return (
              <div key={member.id} className="rounded-lg border border-ink-100 p-3">
                <div className="flex items-start gap-2.5">
                  <Avatar name={member.name} tone={member.tone} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-ink-900">{member.name}</span>
                      <span className={`text-[11px] tabular-nums ${over ? 'font-semibold text-break-600' : 'text-ink-500'}`}>
                        RM{share} / RM{member.preferences.budgetCeiling}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-500">
                      <span className="capitalize">{member.preferences.pace}</span> pace
                      {headroom >= 0 && headroom < 60 && (
                        <span className="text-warn-600"> · RM{headroom} headroom</span>
                      )}
                    </p>
                  </div>
                </div>

                <InterestBars member={member} />

                {member.preferences.nonNegotiables.length > 0 && (
                  <p className="mt-2 text-[11px] text-ink-700">
                    <span className="font-semibold">Must-do: </span>
                    {member.preferences.nonNegotiables
                      .map((id) => trip.items.find((i) => i.id === id)?.title ?? id)
                      .join(', ')}
                  </p>
                )}

                {member.preferences.note && (
                  <p className="mt-1.5 border-l-2 border-ink-100 pl-2 text-[11px] italic text-ink-500">
                    “{member.preferences.note}”
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="border-brand-100 bg-brand-100/30 p-4">
        <SectionTitle>What we optimised for</SectionTitle>
        <ul className="space-y-1.5 text-sm text-ink-700">
          <li>
            <span className="font-medium">Binding constraint:</span> {tightest.name}’s RM
            {tightest.preferences.budgetCeiling} ceiling. Everything else fits around it.
          </li>
          <li>
            <span className="font-medium">Protected:</span>{' '}
            {trip.members
              .filter((m) => m.preferences.nonNegotiables.length)
              .map((m) => `${m.name}’s must-do`)
              .join(', ')}
          </li>
          <li>
            <span className="font-medium">Could not fit:</span> Mei wanted a packed pace;
            Sarah and Danish both asked for slow. We went with two full days and one light one.
          </li>
        </ul>
        <p className="mt-3 border-t border-brand-100 pt-2.5 text-[11px] leading-relaxed text-ink-500">
          Naming the tradeoff is the point. A group can argue with a stated compromise.
          It cannot argue with an itinerary that just appeared.
        </p>
      </Card>
    </div>
  )
}
