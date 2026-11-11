import type { Exercise } from '@/entities/exercise'
import { elapsed, type NewEntry, type SetValues } from '@/entities/session'
import type { WorkoutEntry } from '@/shared/api'

// The plan of an exercise added during a workout; the person corrects the sets as they go.
export function newEntry({ id, name, kind }: Exercise, restSec: number): NewEntry {
  const plan =
    kind === 'timed'
      ? { sets: 3, durationSec: 30, restSec }
      : kind === 'cardio'
        ? { sets: 1, durationSec: 600, restSec }
        : { sets: 3, reps: 10, restSec }

  return { exerciseId: id, name, kind, plan }
}

// A timed set ended early logs the time actually held, never more than predicted.
export function doneValues(
  kind: WorkoutEntry['kind'],
  predicted: SetValues,
  setStartedAt: number | null,
  now: number,
): SetValues {
  if (kind !== 'timed' || predicted.durationSec === undefined || setStartedAt === null)
    return predicted

  return { ...predicted, durationSec: Math.min(predicted.durationSec, elapsed(setStartedAt, now)) }
}
