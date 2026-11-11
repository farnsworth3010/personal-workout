import type { Workout } from '@/shared/api'
import { weekStart } from '@/shared/lib'

import { byDate, workoutDate } from './dates'

export const bodyWeightSeries = (workouts: readonly Workout[]) =>
  byDate(workouts).flatMap((w) =>
    w.survey.bodyWeightKg === undefined
      ? []
      : [{ date: workoutDate(w), kg: w.survey.bodyWeightKg }],
  )

export interface SurveyWeek {
  /** Monday of the week. */
  week: Date
  wellbeing: number | null
  energy: number | null
}

const average = (values: number[]) =>
  values.length === 0
    ? null
    : Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10

/** Weekly averages of wellbeing and energy (1–5, one decimal); weeks without answers are left out. */
export function weeklySurvey(workouts: readonly Workout[]): SurveyWeek[] {
  const weeks = new Map<number, { week: Date; wellbeing: number[]; energy: number[] }>()
  for (const w of byDate(workouts)) {
    const { wellbeing, energy } = w.survey
    if (wellbeing === undefined && energy === undefined) continue

    const week = weekStart(workoutDate(w))
    const bucket = weeks.get(week.getTime()) ?? { week, wellbeing: [], energy: [] }
    if (wellbeing !== undefined) bucket.wellbeing.push(wellbeing)
    if (energy !== undefined) bucket.energy.push(energy)
    weeks.set(week.getTime(), bucket)
  }

  return [...weeks.values()].map((b) => ({
    week: b.week,
    wellbeing: average(b.wellbeing),
    energy: average(b.energy),
  }))
}
