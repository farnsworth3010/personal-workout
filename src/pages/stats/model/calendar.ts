import type { Workout } from '@/shared/api'
import { addDays, sameDay, startOfDay, weekStart } from '@/shared/lib'

import { between, byDate, workoutDate } from './dates'

export interface CalendarDay<W extends Workout = Workout> {
  date: Date
  workouts: W[]
  today: boolean
  future: boolean
}

/** Days of the month that contains `month`; `lead` is the count of blank cells before day 1 (weeks start on Monday). */
export function monthCalendar<W extends Workout>(
  workouts: readonly W[],
  month: Date,
  now = new Date(),
) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const next = new Date(month.getFullYear(), month.getMonth() + 1, 1)
  const inMonth = byDate(between(workouts, first, next))
  const today = startOfDay(now)

  const days: CalendarDay<W>[] = []
  for (let date = first; date < next; date = addDays(date, 1)) {
    days.push({
      date,
      workouts: inMonth.filter((w) => sameDay(workoutDate(w), date)),
      today: date.getTime() === today.getTime(),
      future: date > today,
    })
  }

  return { lead: (first.getDay() + 6) % 7, days, count: inMonth.length }
}

/** Workouts from Monday to Sunday of the current week. */
export const workoutsThisWeek = (workouts: readonly Workout[], now = new Date()) =>
  between(workouts, weekStart(now), addDays(weekStart(now), 7)).length

export const totalDurationSec = (workouts: readonly Workout[]) =>
  workouts.reduce((sum, w) => sum + (w.summary?.durationSec ?? 0), 0)

/** First day of the month of the earliest workout, or null without workouts. */
export function firstMonth(workouts: readonly Workout[]) {
  const first = byDate(workouts).at(0)
  if (!first) return null

  const d = workoutDate(first)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
