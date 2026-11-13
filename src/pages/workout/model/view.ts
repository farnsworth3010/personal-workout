import { e1rm } from '@/entities/workout'
import type { Workout } from '@/shared/api'

import type { ExerciseRow } from './types'

/** Entries in the order they were done, with their state, volume and best set. */
export function exerciseRows(workout: Workout): ExerciseRow[] {
  return workout.entries.map((entry) => {
    let best: number | null = null
    let bestE1rm = 0
    entry.sets.forEach(({ reps = 0, weightKg = 0 }, i) => {
      const estimate = e1rm(weightKg, reps)
      if (weightKg > 0 && reps > 0 && estimate > bestE1rm) {
        best = i
        bestE1rm = estimate
      }
    })

    return {
      exerciseId: entry.exerciseId,
      name: entry.name,
      state:
        entry.sets.length === 0
          ? 'skipped'
          : entry.sets.length < entry.plan.sets
            ? 'partial'
            : 'done',
      planned: entry.plan.sets,
      sets: entry.sets,
      volumeKg: entry.sets.reduce((v, s) => v + (s.reps ?? 0) * (s.weightKg ?? 0), 0),
      best,
    }
  })
}

/** The body weight of the latest workout before this one that recorded it. */
export function previousBodyWeight(workout: Workout, history: readonly Workout[]) {
  const before = history
    .filter((w) => w.startedAt.toMillis() < workout.startedAt.toMillis())
    .sort((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis())

  return before.find((w) => w.survey.bodyWeightKg !== undefined)?.survey.bodyWeightKg ?? null
}
