import type { LoggedSet } from '@/shared/api'

export type ExerciseState = 'done' | 'partial' | 'skipped'

export interface ExerciseRow {
  exerciseId: string
  name: string
  state: ExerciseState
  planned: number
  sets: LoggedSet[]
  volumeKg: number
  /** Index of the set with the highest estimated 1RM; null without weighted sets. */
  best: number | null
}
