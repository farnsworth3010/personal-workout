import type { Workout, WorkoutEntry } from '@/shared/api'

import type { SetValues } from './prediction'

// `id`: the template entry's id when started from a set; quick-added entries always get a new one.
export type NewEntry = Pick<WorkoutEntry, 'exerciseId' | 'name' | 'kind' | 'plan'> & { id?: string }

export type AddMode = 'now' | 'next' | 'replace'

export interface SessionData {
  workoutId: string | null
  // The Firestore document as it should be written now; null without a running session.
  workout: Workout | null
  // Entry on screen; null when the queue is over (postponed entries may remain).
  current: number | null
  // 0-based set of the current entry: in work, or just logged while resting.
  setIndex: number
  // Epoch ms; timers are derived from these.
  exerciseStartedAt: number | null
  setStartedAt: number | null
  restEndsAt: number | null
  // Time already spent per entry, so a return to an exercise continues its clock.
  spentMs: number[]
  // Today's weight change per entry id, added to that entry's next predictions: the same exercise done
  // twice (a light warm-up, a working part) keeps two shifts.
  shiftKg: Record<string, number>
  // The ended workout waiting on the finish screen for the survey; null while it runs or when idle.
  finished: FinishedWorkout | null
}

export interface SessionActions {
  // False, and nothing changes, while a workout runs or waits on the finish screen, or without entries.
  start: (template: Workout['template'], entries: NewEntry[], now?: number) => boolean
  // Continues a workout known only from its server document (status active); false unless idle.
  restore: (workoutId: string, workout: Workout, now?: number) => boolean
  // Logs the current set (the prediction unless changed) and starts the rest.
  completeSet: (values: SetValues, now?: number) => void
  // Corrects the logged current set; a weight change shifts the next predictions.
  editSet: (values: SetValues, now?: number) => void
  // Ends the rest: the first set not yet logged, else the next pending exercise; past the last one with
  // nothing postponed it ends the workout.
  next: (now?: number) => void
  back: (now?: number) => void
  postpone: (now?: number) => void
  // Continues the postponed entry with this entry id.
  resume: (entryId: string, now?: number) => void
  addExercise: (entry: NewEntry, mode: AddMode, now?: number) => void
  // Ends the workout: the finish screen reads it through selectFinishing.
  end: (now?: number) => void
  // Adds the survey, clears the session and returns the document for the caller to write.
  finish: (survey: Workout['survey']) => FinishedWorkout | null
  discard: () => void
}

export type SessionState = SessionData & SessionActions

export interface FinishedWorkout {
  workoutId: string
  workout: Workout
}
