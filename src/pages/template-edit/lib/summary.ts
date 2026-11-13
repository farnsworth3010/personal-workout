import type { Row } from '../model/types'

/** How many times each exercise is in the set, for the picker's badges. */
export function exerciseCounts(rows: readonly Row[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const row of rows) counts[row.exerciseId] = (counts[row.exerciseId] ?? 0) + 1

  return counts
}

export const heaviestKg = (sets: readonly { weightKg?: number | undefined }[]) =>
  sets.reduce((max, set) => Math.max(max, set.weightKg ?? 0), 0)
