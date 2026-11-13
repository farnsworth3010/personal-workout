import { Timestamp } from 'firebase/firestore'
import { createJSONStorage } from 'zustand/middleware'

import type { WorkoutEntry } from '@/shared/api'

import type { SessionData } from './types'

// localStorage keeps a Timestamp as its toJSON() object; the reviver turns it back.
const timestampType = Timestamp.fromMillis(0).toJSON().type

const isTimestampJson = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && 'type' in value && value.type === timestampType

export const SESSION_VERSION = 4

// Versions up to 3 also stored `finishing`, now derived from `finished`.
type Persisted = SessionData & { finishing?: boolean }

export function migrate(persisted: unknown, version: number): SessionData {
  let state = persisted as Persisted

  // Version 1 kept no `finished`: rebuild it for a workout that was waiting on the finish screen.
  if (version < 2)
    state = {
      ...state,
      finished:
        state.finishing && state.workoutId && state.workout
          ? { workoutId: state.workoutId, workout: state.workout }
          : null,
    }

  // Version 2 had no entry ids and kept the weight shift per exercise.
  if (version < 3 && state.workout) {
    // The position rule of the Firestore converters' upgradeEntries.
    const workout = {
      ...state.workout,
      entries: state.workout.entries.map((e, i) => ({
        ...e,
        id: (e as Partial<WorkoutEntry>).id ?? `e${String(i)}`,
      })),
    }
    const byExercise = state.shiftKg

    state = {
      ...state,
      workout,
      shiftKg: Object.fromEntries(
        workout.entries.flatMap((e) =>
          e.exerciseId in byExercise ? [[e.id, byExercise[e.exerciseId]]] : [],
        ),
      ),
      finished: state.finished && { ...state.finished, workout },
    }
  }

  // Version 3 kept `finishing` beside `finished`; a waiting workout without `finished` gets one.
  if (version < 4) {
    const { finishing, ...rest } = state

    state = {
      ...rest,
      finished:
        rest.finished ??
        (finishing && rest.workoutId && rest.workout
          ? { workoutId: rest.workoutId, workout: rest.workout }
          : null),
    }
  }

  return state
}

export const storage = createJSONStorage<SessionData>(() => localStorage, {
  reviver: (_key, value) => (isTimestampJson(value) ? Timestamp.fromJSON(value) : value),
})
