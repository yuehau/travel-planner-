import type { Impairment, Trip, TripItem } from '../types'
import { dateForDay } from './seed'

/**
 * Weather is the thing that ruins a Malaysian local trip. Unlike a flight
 * delay, it is knowable days in advance — which is the whole reason this
 * product can warn you instead of only consoling you.
 *
 * Source: Open-Meteo. Free, no API key, no attribution requirement for
 * non-commercial use at the time of writing (verify the terms before you ship
 * anything commercial).
 *
 * We pull HOURLY data, not daily. A 14:00 trek and an 08:00 trek on the same
 * day are completely different bets, and a daily summary throws that away.
 */

/** At or above this chance of rain, an outdoor item is treated as not viable. */
export const BREAK_PROBABILITY = 70
/** At or above this, it is flagged but not broken. */
export const WARN_PROBABILITY = 50

export interface Forecast {
  /** Local hour stamps, "YYYY-MM-DDTHH:MM". */
  times: string[]
  /** Chance of precipitation per hour, 0–100. */
  probability: number[]
  /** Precipitation per hour, mm. */
  mm: number[]
  source: 'live' | 'simulated'
}

export interface RainRisk {
  probability: number
  mm: number
  /** Local hour when it looks worst. */
  worstAt: string
}

const API = 'https://api.open-meteo.com/v1/forecast'

/**
 * True when the payload has the hourly arrays we need, all the same length.
 *
 * This guard exists because the response shape has not been verified from the
 * build environment — the sandbox cannot reach the API. If the shape is not
 * what we expect, the caller falls back to a simulated forecast rather than
 * throwing halfway through a demo.
 */
function isUsable(data: unknown): data is {
  hourly: { time: string[]; precipitation_probability: number[]; precipitation: number[] }
} {
  if (typeof data !== 'object' || data === null) return false
  const hourly = (data as { hourly?: unknown }).hourly
  if (typeof hourly !== 'object' || hourly === null) return false
  const h = hourly as Record<string, unknown>
  const ok = (v: unknown) => Array.isArray(v) && v.length > 0
  if (!ok(h.time) || !ok(h.precipitation_probability) || !ok(h.precipitation)) return false
  const n = (h.time as unknown[]).length
  return (
    (h.precipitation_probability as unknown[]).length === n &&
    (h.precipitation as unknown[]).length === n
  )
}

/** Fetch the hourly forecast for a trip's dates. Returns null on any problem. */
export async function fetchForecast(trip: Trip): Promise<Forecast | null> {
  const endDate = dateForDay(trip, trip.nights + 1)
  const url =
    `${API}?latitude=${trip.lat}&longitude=${trip.lon}` +
    `&hourly=precipitation_probability,precipitation` +
    `&timezone=Asia%2FKuala_Lumpur&start_date=${trip.startDate}&end_date=${endDate}`

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12_000) })
    if (!res.ok) throw new Error(`Open-Meteo returned ${res.status}`)
    const data: unknown = await res.json()
    if (!isUsable(data)) throw new Error('Unexpected forecast shape')

    return {
      times: data.hourly.time,
      probability: data.hourly.precipitation_probability,
      mm: data.hourly.precipitation,
      source: 'live',
    }
  } catch (err) {
    console.warn('[weather] live forecast unavailable:', err)
    return null
  }
}

/**
 * A recorded monsoon afternoon, generated against this trip's own dates.
 *
 * The demo needs a disruption to exist. If the real forecast happens to be
 * clear on the day you present, there is nothing to repair and the story dies.
 * This is the honest way to guarantee the scenario: a clearly-labelled
 * simulated forecast, wet on Saturday afternoon and evening, clearing
 * overnight.
 */
export function simulatedMonsoon(trip: Trip): Forecast {
  const times: string[] = []
  const probability: number[] = []
  const mm: number[] = []

  for (let day = 1; day <= trip.nights + 1; day++) {
    const date = dateForDay(trip, day)
    for (let hour = 0; hour < 24; hour++) {
      times.push(`${date}T${String(hour).padStart(2, '0')}:00`)

      // Day 1 from early afternoon: heavy, sustained highland rain.
      const wet = day === 1 && hour >= 13 && hour <= 21
      // Day 2 clears from mid-morning — which is what makes a repair possible.
      const damp = day === 2 && hour >= 14

      probability.push(wet ? 88 : damp ? 55 : 12)
      mm.push(wet ? 9.4 : damp ? 1.8 : 0)
    }
  }

  return { times, probability, mm, source: 'simulated' }
}

/** Worst rain risk across the hours an item actually occupies. */
export function rainRiskFor(
  forecast: Forecast,
  trip: Trip,
  item: TripItem,
  /** Override the item's own start, to test a candidate slot. */
  atDay = item.day,
  atStart = item.start,
): RainRisk | null {
  const date = dateForDay(trip, atDay)
  const firstHour = Math.floor(atStart / 60)
  const lastHour = Math.floor((atStart + Math.max(item.durationMin, 60) - 1) / 60)

  let probability = 0
  let mm = 0
  let worstAt = ''

  for (let hour = firstHour; hour <= Math.min(lastHour, 23); hour++) {
    const stamp = `${date}T${String(hour).padStart(2, '0')}:00`
    const i = forecast.times.indexOf(stamp)
    if (i === -1) continue
    mm += forecast.mm[i] ?? 0
    if ((forecast.probability[i] ?? 0) > probability) {
      probability = forecast.probability[i]
      worstAt = `${String(hour).padStart(2, '0')}:00`
    }
  }

  return worstAt ? { probability, mm: Math.round(mm * 10) / 10, worstAt } : null
}

/** Outdoor items whose own hours look unviable. */
export function impairmentsFromForecast(trip: Trip, forecast: Forecast): Impairment[] {
  return trip.items.flatMap<Impairment>((item) => {
    if (!item.outdoor) return []
    const risk = rainRiskFor(forecast, trip, item)
    if (!risk || risk.probability < BREAK_PROBABILITY) return []
    return [
      {
        kind: 'unavailable',
        itemId: item.id,
        reason: `${risk.probability}% chance of rain at ${risk.worstAt}, ${risk.mm}mm expected`,
      },
    ]
  })
}

/** Days where an outdoor plan is a bad bet — used to avoid rebooking into the same storm. */
export function outdoorBlockedDays(trip: Trip, forecast: Forecast): number[] {
  const blocked: number[] = []
  for (let day = 1; day <= trip.nights + 1; day++) {
    const date = dateForDay(trip, day)
    // Only the hours anyone would actually be out.
    const daytime = forecast.times
      .map((stamp, i) => ({ stamp, p: forecast.probability[i] }))
      .filter(({ stamp }) => {
        if (!stamp.startsWith(date)) return false
        const hour = Number(stamp.slice(11, 13))
        return hour >= 8 && hour <= 21
      })
    if (daytime.length === 0) continue
    // Blocked when most of the usable day is a washout.
    const wetHours = daytime.filter(({ p }) => p >= BREAK_PROBABILITY).length
    if (wetHours >= daytime.length / 2) blocked.push(day)
  }
  return blocked
}
