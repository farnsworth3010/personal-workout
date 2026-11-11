import type { Timestamp } from 'firebase/firestore'

import type { ExerciseStats, LoggedSet, Workout } from '@/shared/api'

import {
  compareRecords,
  muscleSets,
  recordsByExercise,
  setsDone,
  volumeKg,
  type MuscleFacts,
} from '../model/summary'

// The documents finishWorkout writes; pure, so tests/rules can check them against firestore.rules.
export function finishedWorkout(
  workout: Workout,
  exercises: Readonly<Record<string, MuscleFacts | undefined>>,
  now: Timestamp,
): Workout {
  const endedAt = workout.endedAt ?? now
  const durationMs = endedAt.toMillis() - workout.startedAt.toMillis()

  return {
    ...workout,
    status: 'done',
    endedAt,
    summary: {
      durationSec: Math.max(0, Math.round(durationMs / 1000)),
      volumeKg: volumeKg(workout.entries),
      setsDone: setsDone(workout.entries),
      muscleSets: muscleSets(workout.entries, exercises),
    },
    updatedAt: now,
  }
}

type SetValues = ExerciseStats['lastSets'][number]

// Present values only: a Firestore without ignoreUndefinedProperties rejects undefined fields.
function setValues({ reps, weightKg, durationSec }: LoggedSet): SetValues {
  const values: SetValues = {}

  if (reps !== undefined) values.reps = reps
  if (weightKg !== undefined) values.weightKg = weightKg
  if (durationSec !== undefined) values.durationSec = durationSec

  return values
}

// One stats document per exercise with logged sets; an exercise done twice keeps its last entry's sets.
export function exerciseStatsAfter(
  workoutId: string,
  workout: Workout,
  previousById: Readonly<Record<string, ExerciseStats | undefined>>,
  now: Timestamp,
): Record<string, ExerciseStats> {
  const records = recordsByExercise(workout.entries)
  const stats: Record<string, ExerciseStats> = {}

  for (const { exerciseId, sets } of workout.entries) {
    if (sets.length === 0) continue

    const previous = previousById[exerciseId]

    stats[exerciseId] = {
      weightStepKg: previous?.weightStepKg ?? null,
      lastSets: sets.toSorted((a, b) => a.n - b.n).map(setValues),
      lastWorkoutId: workoutId,
      lastAt: now,
      records: compareRecords(previous?.records, records[exerciseId] ?? {}).merged,
    }
  }

  return stats
}
