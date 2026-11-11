import type { ExerciseStats, WorkoutEntry } from '@/shared/api'

export type SetValues = ExerciseStats['lastSets'][number]

export interface Prediction {
  values: SetValues
  // What was done in this set number last time, shown on the rest screen.
  last: SetValues | undefined
}

// Weights like 0.1 + 0.2 must not show up as 0.30000000000000004.
export const roundKg = (kg: number) => Math.round(kg * 100) / 100

function fromPlan({ reps, durationSec }: WorkoutEntry['plan']): SetValues {
  return reps === undefined ? { durationSec } : { reps }
}

// Set n (1-based): the same set last time, else the last known set, else the plan without weight;
// then shifted by the weight change chosen earlier today in this exercise.
export function predictSet(
  n: number,
  plan: WorkoutEntry['plan'],
  lastSets: ExerciseStats['lastSets'] = [],
  shiftKg = 0,
): Prediction {
  const last = lastSets.at(n - 1)
  const { weightKg, ...rest } = last ?? lastSets.at(-1) ?? fromPlan(plan)

  if (weightKg === undefined && shiftKg === 0) return { values: rest, last }

  return { values: { ...rest, weightKg: Math.max(0, roundKg((weightKg ?? 0) + shiftKg)) }, last }
}
