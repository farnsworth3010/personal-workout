import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { Workout } from '@/shared/api'
import { newId } from '@/shared/lib'

import { migrate, SESSION_VERSION, storage } from './persist'
import * as t from './transitions'
import type { SessionData, SessionState } from './types'

export { selectActive, selectFinishing } from './selectors'
export type {
  AddMode,
  FinishedWorkout,
  NewEntry,
  SessionActions,
  SessionData,
  SessionState,
} from './types'

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => {
      // Applies a transition to a running session; without one every action is a no-op.
      const transition =
        <A extends unknown[]>(
          fn: (s: SessionData, workout: Workout, ...args: A) => Partial<SessionData> | undefined,
        ) =>
        (...args: A) =>
          set((s) => (s.workout && !s.finished ? (fn(s, s.workout, ...args) ?? s) : s))

      return {
        ...t.idle,

        start: (template, entries, now = Date.now()) => {
          if (get().workout || entries.length === 0) return false

          set(t.start(newId(), template, entries, now))

          return true
        },

        restore: (workoutId, workout, now = Date.now()) => {
          if (get().workout || workout.status !== 'active') return false

          set(t.restore(workoutId, workout, now))

          return true
        },

        completeSet: transition(t.completeSet),
        editSet: transition(t.editSet),
        next: transition(t.next),
        back: transition(t.back),
        postpone: transition(t.postpone),
        resume: transition(t.resume),
        addExercise: transition(t.addExercise),
        end: transition(t.end),

        finish: (survey) => {
          const { finished } = get()

          if (finished) set(t.idle)

          return finished && { ...finished, workout: { ...finished.workout, survey } }
        },

        discard: () => set(t.idle),
      }
    },
    { name: 'personal-workout:session', version: SESSION_VERSION, migrate, storage },
  ),
)
