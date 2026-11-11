import { muscleSchema, type Muscle, type Workout } from '@/shared/api'

import { addDays, between, startOfDay, weekStart } from './dates'

export type LoadLevel = 0 | 1 | 2 | 3

// Sets per week (owner's scale): 0 none, 1–9 light, 10–20 working, over 20 heavy.
export const loadLevel = (sets: number): LoadLevel =>
  sets <= 0 ? 0 : sets < 10 ? 1 : sets <= 20 ? 2 : 3

export const loadLevelLabels: Record<LoadLevel, string> = {
  0: 'не тренировали',
  1: 'лёгкая нагрузка',
  2: 'рабочая нагрузка',
  3: 'высокая нагрузка',
}

/** Sets per muscle from Monday to today, from the summaries written at finish. */
export function weekMuscleLoad(workouts: readonly Workout[], now = new Date()) {
  const from = weekStart(now)
  const week = between(workouts, from, addDays(startOfDay(now), 1))

  const sets = Object.fromEntries(muscleSchema.options.map((m) => [m, 0])) as Record<Muscle, number>
  for (const w of week) {
    for (const [muscle, n] of Object.entries(w.summary?.muscleSets ?? {})) {
      sets[muscle as Muscle] += n
    }
  }

  return {
    from,
    workouts: week.length,
    sets,
    untrained: muscleSchema.options.filter((m) => sets[m] === 0),
  }
}
