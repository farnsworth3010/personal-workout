import { Timestamp } from 'firebase/firestore'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { Workout, WorkoutEntry } from '@/shared/api'

import { roundKg, type SetValues } from './prediction'

export type NewEntry = Pick<WorkoutEntry, 'exerciseId' | 'name' | 'kind' | 'plan'>

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
  // Today's weight change per exercise, added to the next predictions.
  shiftKg: Record<string, number>
  // The workout has ended and waits on the finish screen for the survey.
  finishing: boolean
}

export interface SessionActions {
  start: (template: Workout['template'], entries: NewEntry[], now?: number) => void
  // Logs the current set (the prediction unless changed) and starts the rest.
  completeSet: (values: SetValues, now?: number) => void
  // Corrects the logged current set; a weight change shifts the next predictions.
  editSet: (values: SetValues, now?: number) => void
  // Ends the rest: the first set not yet logged, else the next pending exercise.
  next: (now?: number) => void
  back: (now?: number) => void
  postpone: (now?: number) => void
  resume: (index: number, now?: number) => void
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

const MAX_ENTRIES = 60

const idle: SessionData = {
  workoutId: null,
  workout: null,
  current: null,
  setIndex: 0,
  exerciseStartedAt: null,
  setStartedAt: null,
  restEndsAt: null,
  spentMs: [],
  shiftKg: {},
  finishing: false,
}

const ts = (ms: number) => Timestamp.fromMillis(ms)

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

// crypto.randomUUID needs a secure context; the owner's phone opens the dev server over plain http.
const newId = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(20)), (byte) => ID_CHARS[byte & 63]).join('')

// localStorage keeps a Timestamp as its toJSON() object; the reviver turns it back.
const timestampType = Timestamp.fromMillis(0).toJSON().type

const isTimestampJson = (value: unknown): value is object =>
  typeof value === 'object' && value !== null && 'type' in value && value.type === timestampType

const firstUndone = (entry: WorkoutEntry) => {
  const index = Array.from({ length: entry.plan.sets }, (_, i) => i).find(
    (i) => !entry.sets.some((set) => set.n === i + 1),
  )

  return index ?? entry.plan.sets - 1
}

const allLogged = (entry: WorkoutEntry, sets = entry.sets) => sets.length >= entry.plan.sets

const withEntries = (workout: Workout, entries: WorkoutEntry[], now: number): Workout => ({
  ...workout,
  entries,
  updatedAt: ts(now),
})

const patchEntry = (workout: Workout, index: number, patch: Partial<WorkoutEntry>, now: number) =>
  withEntries(
    workout,
    workout.entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)),
    now,
  )

// Stores the time spent on the entry being left.
const bank = (s: SessionData, now: number) =>
  s.current === null || s.exerciseStartedAt === null
    ? s.spentMs
    : s.spentMs.with(s.current, now - s.exerciseStartedAt)

const moveTo = (
  spentMs: number[],
  current: number | null,
  setIndex: number,
  now: number,
): Partial<SessionData> => ({
  spentMs,
  current,
  setIndex,
  restEndsAt: null,
  setStartedAt: now,
  exerciseStartedAt: current === null ? null : now - (spentMs[current] ?? 0),
})

// The first pending entry in queue order, or the end of the queue.
function advance(s: SessionData, workout: Workout, now: number): Partial<SessionData> {
  const index = workout.entries.findIndex((entry) => entry.status === 'pending')

  const target = index < 0 ? null : index

  return {
    workout,
    ...moveTo(bank(s, now), target, target === null ? 0 : firstUndone(workout.entries[index]), now),
  }
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => {
      // Applies a transition to a running session; without one every action is a no-op.
      const update =
        <A extends unknown[]>(
          fn: (s: SessionData, workout: Workout, ...args: A) => Partial<SessionData> | undefined,
        ) =>
        (...args: A) =>
          set((s) => (s.workout && !s.finishing ? (fn(s, s.workout, ...args) ?? s) : s))

      return {
        ...idle,

        start: (template, entries, now = Date.now()) =>
          set({
            ...idle,
            workoutId: newId(),
            workout: {
              status: 'active',
              startedAt: ts(now),
              endedAt: null,
              template,
              entries: entries.map((entry) => ({ ...entry, status: 'pending', sets: [] })),
              survey: {},
              summary: null,
              updatedAt: ts(now),
            },
            current: 0,
            exerciseStartedAt: now,
            setStartedAt: now,
            spentMs: entries.map(() => 0),
          }),

        completeSet: update((s, workout, values: SetValues, now = Date.now()) => {
          if (s.current === null) return

          const entry = workout.entries[s.current]
          const n = s.setIndex + 1

          const sets = [
            ...entry.sets.filter((logged) => logged.n !== n),
            { n, ...values, at: ts(now) },
          ].sort((a, b) => a.n - b.n)

          const status = allLogged(entry, sets) ? 'done' : entry.status

          return {
            workout: patchEntry(workout, s.current, { sets, status }, now),
            restEndsAt: now + entry.plan.restSec * 1000,
          }
        }),

        editSet: update((s, workout, values: SetValues, now = Date.now()) => {
          if (s.current === null) return

          const entry = workout.entries[s.current]
          const n = s.setIndex + 1
          const logged = entry.sets.find((set) => set.n === n)

          if (!logged) return

          const delta = values.weightKg === undefined ? 0 : values.weightKg - (logged.weightKg ?? 0)
          const shift = roundKg((s.shiftKg[entry.exerciseId] ?? 0) + delta)
          const sets = entry.sets.map((set) => (set.n === n ? { ...set, ...values } : set))

          return {
            workout: patchEntry(workout, s.current, { sets }, now),
            shiftKg: { ...s.shiftKg, [entry.exerciseId]: shift },
          }
        }),

        next: update((s, workout, now = Date.now()) => {
          if (s.current === null) return

          const entry = workout.entries[s.current]

          if (!allLogged(entry))
            return { setIndex: firstUndone(entry), restEndsAt: null, setStartedAt: now }

          return advance(s, patchEntry(workout, s.current, { status: 'done' }, now), now)
        }),

        // During rest: back to the set just logged; in work: the previous set, else the
        // previous finished exercise, reopened on its last set.
        back: update((s, workout, now = Date.now()) => {
          if (s.current !== null && s.restEndsAt !== null)
            return {
              workout: patchEntry(workout, s.current, { status: 'pending' }, now),
              restEndsAt: null,
              setStartedAt: now,
            }

          if (s.current !== null && s.setIndex > 0)
            return { setIndex: s.setIndex - 1, setStartedAt: now }

          const before = s.current ?? workout.entries.length
          const index = workout.entries.findLastIndex(
            (entry, i) => i < before && entry.status === 'done',
          )

          if (index < 0) return

          return {
            workout: patchEntry(workout, index, { status: 'pending' }, now),
            ...moveTo(bank(s, now), index, workout.entries[index].plan.sets - 1, now),
          }
        }),

        postpone: update((s, workout, now = Date.now()) => {
          if (s.current === null || workout.entries[s.current].status !== 'pending') return

          return advance(s, patchEntry(workout, s.current, { status: 'postponed' }, now), now)
        }),

        resume: update((s, workout, index: number, now = Date.now()) => {
          const entry = workout.entries.at(index)

          if (entry?.status !== 'postponed') return

          return {
            workout: patchEntry(workout, index, { status: 'pending' }, now),
            ...moveTo(bank(s, now), index, firstUndone(entry), now),
          }
        }),

        addExercise: update((s, workout, added: NewEntry, mode: AddMode, now = Date.now()) => {
          if (workout.entries.length >= MAX_ENTRIES) return

          const entry: WorkoutEntry = { ...added, status: 'pending', sets: [] }
          const spentMs = bank(s, now)

          if (s.current === null) {
            const index = workout.entries.length

            return {
              workout: withEntries(workout, [...workout.entries, entry], now),
              ...moveTo([...spentMs, 0], index, 0, now),
            }
          }

          const at = s.current + 1
          const replaced = workout.entries[s.current]

          // A replaced exercise with logged sets is kept as skipped, so nothing logged is lost.
          if (mode === 'replace' && replaced.sets.length === 0)
            return {
              workout: withEntries(workout, workout.entries.toSpliced(s.current, 1, entry), now),
              ...moveTo(spentMs.toSpliced(s.current, 1, 0), s.current, 0, now),
            }

          const entries = workout.entries
            .toSpliced(at, 0, entry)
            .map((e, i) =>
              mode === 'replace' && i === s.current ? { ...e, status: 'skipped' as const } : e,
            )

          if (mode === 'next')
            return {
              workout: withEntries(workout, entries, now),
              spentMs: s.spentMs.toSpliced(at, 0, 0),
            }

          return {
            workout: withEntries(workout, entries, now),
            ...moveTo(spentMs.toSpliced(at, 0, 0), at, 0, now),
          }
        }),

        end: update((s, workout, now = Date.now()) => ({
          ...idle,
          workoutId: s.workoutId,
          finishing: true,
          workout: {
            ...workout,
            status: 'done',
            endedAt: ts(now),
            updatedAt: ts(now),
            // Postponed, unfinished and untouched entries all end as skipped, with their sets.
            entries: workout.entries.map((entry) =>
              entry.status === 'done' ? entry : { ...entry, status: 'skipped' },
            ),
          },
        })),

        finish: (survey) => {
          const finished = selectFinishing(get())

          if (finished) set(idle)

          return finished && { ...finished, workout: { ...finished.workout, survey } }
        },

        discard: () => set(idle),
      }
    },
    {
      name: 'personal-workout:session',
      version: 1,
      storage: createJSONStorage(() => localStorage, {
        reviver: (_key, value) => (isTimestampJson(value) ? Timestamp.fromJSON(value) : value),
      }),
    },
  ),
)

// A running session the screen can show; false while the finish screen waits.
export const selectActive = (s: SessionData) => s.workout !== null && !s.finishing

let lastFinishing: FinishedWorkout | null = null

// Stable between calls, so it works as a useSessionStore selector without useShallow.
export function selectFinishing(s: SessionData): FinishedWorkout | null {
  if (!s.finishing || !s.workoutId || !s.workout) return null

  if (lastFinishing?.workout !== s.workout)
    lastFinishing = { workoutId: s.workoutId, workout: s.workout }

  return lastFinishing
}
