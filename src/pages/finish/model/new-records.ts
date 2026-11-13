import { compareRecords, type Records } from '@/entities/workout'
import type { ExerciseStats, WorkoutEntry } from '@/shared/api'

import { recordValue } from '../lib/format'
import type { NewRecord } from './types'

// The records of this workout that beat the stored ones; none until the stats load.
export function newRecords(
  current: Record<string, Records>,
  stats: Record<string, ExerciseStats | undefined> | undefined,
  entries: readonly WorkoutEntry[],
): NewRecord[] {
  return stats
    ? Object.entries(current).flatMap(([id, records]) => {
        const previous = stats[id]?.records
        const { improved } = compareRecords(previous, records)
        const name = entries.find((e) => e.exerciseId === id)?.name ?? id

        return improved.map((key) => ({
          id,
          key,
          name,
          now: records,
          was: recordValue(key, previous),
        }))
      })
    : []
}
