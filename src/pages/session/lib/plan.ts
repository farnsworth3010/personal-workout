import type { Exercise } from '@/entities/exercise'
import type { NewEntry } from '@/entities/session'

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
