import { muscleSchema, type Muscle, type Workout } from '@/shared/api'

import { addDays, between, startOfDay, weekStart } from './dates'

export type LoadLevel = 0 | 1 | 2 | 3 | 4

// Sets per week: 0 none, under 4 light, under 8 medium, under 12 high, 12+ heavy.
export const loadLevel = (sets: number): LoadLevel =>
  sets <= 0 ? 0 : sets < 4 ? 1 : sets < 8 ? 2 : sets < 12 ? 3 : 4

export const loadLevelLabels: Record<LoadLevel, string> = {
  0: 'не тренировали',
  1: 'лёгкая нагрузка',
  2: 'средняя нагрузка',
  3: 'высокая нагрузка',
  4: 'тяжёлая нагрузка',
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
