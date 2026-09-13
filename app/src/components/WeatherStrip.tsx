import type { Trip } from '../types'
import { dateForDay } from '../data/seed'
import { BREAK_PROBABILITY, WARN_PROBABILITY, type Forecast } from '../data/weather'
import { Badge, Card, SectionTitle } from './ui'

/** Worst rain risk in the usable hours of one day. */
function dayRisk(forecast: Forecast, date: string) {
  let probability = 0
  let mm = 0
  let worstAt = ''

  forecast.times.forEach((stamp, i) => {
    if (!stamp.startsWith(date)) return
    const hour = Number(stamp.slice(11, 13))
    if (hour < 8 || hour > 21) return
    mm += forecast.mm[i] ?? 0
    if ((forecast.probability[i] ?? 0) > probability) {
      probability = forecast.probability[i]
      worstAt = `${String(hour).padStart(2, '0')}:00`
    }
  })

  return { probability, mm: Math.round(mm * 10) / 10, worstAt }
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function WeatherStrip({ trip, forecast }: { trip: Trip; forecast: Forecast }) {
  const days = Array.from({ length: trip.nights + 1 }, (_, n) => n + 1)

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <SectionTitle hint="Hourly, not daily — a 14:00 trek and an 08:00 trek are different bets.">
          Forecast
        </SectionTitle>
        <Badge tone={forecast.source === 'live' ? 'brand' : 'shifted'}>
          {forecast.source === 'live' ? 'Live · Open-Meteo' : 'Simulated'}
        </Badge>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map((day) => {
          const date = dateForDay(trip, day)
          const risk = dayRisk(forecast, date)
          const bad = risk.probability >= BREAK_PROBABILITY
          const iffy = !bad && risk.probability >= WARN_PROBABILITY
          const weekday = WEEKDAY[new Date(`${date}T00:00:00`).getDay()]

          return (
            <div
              key={day}
              className={`rounded-lg border px-3 py-2.5 ${
                bad ? 'border-break-100 bg-break-100/50'
                : iffy ? 'border-warn-100 bg-warn-100/50'
                : 'border-safe-100 bg-safe-100/40'
              }`}
            >
              <p className="text-[11px] font-medium text-ink-500">
                Day {day} · {weekday}
              </p>
              <p className="mt-0.5 text-lg leading-tight" aria-hidden>
                {bad ? '🌧️' : iffy ? '🌤️' : '☀️'}
              </p>
              <p className={`text-sm font-semibold tabular-nums ${
                bad ? 'text-break-600' : iffy ? 'text-warn-600' : 'text-safe-600'
              }`}>
                {risk.probability}%
              </p>
              <p className="text-[11px] text-ink-500">
                {risk.mm > 0 ? `${risk.mm}mm` : 'dry'}
                {bad && risk.worstAt && ` · worst ${risk.worstAt}`}
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
