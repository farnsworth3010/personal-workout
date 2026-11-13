import { Timestamp } from 'firebase/firestore'

import { limits, type Workout, type WorkoutEntry } from '@/shared/api'
import { newId } from '@/shared/lib'

import { roundKg, type SetValues } from './prediction'
import type { AddMode, NewEntry, SessionData } from './types'

export const idle: SessionData = {
  workoutId: null,
  workout: null,
  current: null,
  setIndex: 0,
  exerciseStartedAt: null,
  setStartedAt: null,
  restEndsAt: null,
  spentMs: [],
  shiftKg: {},
  finished: null,
}

const ts = (ms: number) => Timestamp.fromMillis(ms)

// Template entry ids are unique by construction; a repeated or missing one still gets its own id.
function uniqueIds(entries: readonly NewEntry[]) {
  const seen = new Set<string>()

  return entries.map((entry) => {
    const id = entry.id && !seen.has(entry.id) ? entry.id : newId()

    seen.add(id)

    return { ...entry, id }
  })
}

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
const bankSpentTime = (s: SessionData, now: number) =>
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

// The first pending entry in queue order, or null at the end of the queue.
function firstPending(workout: Workout) {
  const index = workout.entries.findIndex((entry) => entry.status === 'pending')

  return index < 0 ? null : index
}

// The end of the queue with nothing postponed: the workout is over.
const queueDone = (workout: Workout, current: number | null) =>
  current === null && !workout.entries.some((entry) => entry.status === 'postponed')

// Moves to the first pending entry; past the last one with nothing postponed it ends the workout.
function advance(s: SessionData, workout: Workout, now: number): Partial<SessionData> {
  const target = firstPending(workout)
  const moved = {
    workout,
    ...moveTo(
      bankSpentTime(s, now),
      target,
      target === null ? 0 : firstUndone(workout.entries[target]),
      now,
    ),
  }

  return queueDone(workout, target) ? (end(s, workout, now) ?? moved) : moved
}

export function start(
  workoutId: string,
  template: Workout['template'],
  entries: NewEntry[],
  now: number,
): SessionData {
  return {
    ...idle,
    workoutId,
    workout: {
      status: 'active',
      startedAt: ts(now),
      endedAt: null,
      template,
      entries: uniqueIds(entries).map((entry) => ({
        ...entry,
        status: 'pending',
        sets: [],
      })),
      survey: {},
      summary: null,
      updatedAt: ts(now),
    },
    current: 0,
    exerciseStartedAt: now,
    setStartedAt: now,
    spentMs: entries.map(() => 0),
  }
}

// A document with nothing left to do and nothing postponed goes straight to the finish screen.
export function restore(workoutId: string, workout: Workout, now: number): SessionData {
  const index = firstPending(workout)
  const restored = {
    ...idle,
    workoutId,
    workout,
    ...moveTo(
      workout.entries.map(() => 0),
      index,
      index === null ? 0 : firstUndone(workout.entries[index]),
      now,
    ),
  }

  return queueDone(workout, index) ? { ...restored, ...end(restored, workout, now) } : restored
}

export function completeSet(s: SessionData, workout: Workout, values: SetValues, now = Date.now()) {
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
}

export function editSet(s: SessionData, workout: Workout, values: SetValues, now = Date.now()) {
  if (s.current === null) return

  const entry = workout.entries[s.current]
  const n = s.setIndex + 1
  const logged = entry.sets.find((set) => set.n === n)

  if (!logged) return

  const delta = values.weightKg === undefined ? 0 : values.weightKg - (logged.weightKg ?? 0)
  const shift = roundKg((s.shiftKg[entry.id] ?? 0) + delta)
  const sets = entry.sets.map((set) => (set.n === n ? { ...set, ...values } : set))

  return {
    workout: patchEntry(workout, s.current, { sets }, now),
    shiftKg: { ...s.shiftKg, [entry.id]: shift },
  }
}

export function next(s: SessionData, workout: Workout, now = Date.now()) {
  if (s.current === null) return

  const entry = workout.entries[s.current]

  if (!allLogged(entry))
    return { setIndex: firstUndone(entry), restEndsAt: null, setStartedAt: now }

  return advance(s, patchEntry(workout, s.current, { status: 'done' }, now), now)
}

// During rest: back to the set just logged; in work: the previous set, else the
// previous finished exercise, reopened on its last set.
export function back(s: SessionData, workout: Workout, now = Date.now()) {
  if (s.current !== null && s.restEndsAt !== null)
    return {
      workout: patchEntry(workout, s.current, { status: 'pending' }, now),
      restEndsAt: null,
      setStartedAt: now,
    }

  if (s.current !== null && s.setIndex > 0) return { setIndex: s.setIndex - 1, setStartedAt: now }

  const before = s.current ?? workout.entries.length
  const index = workout.entries.findLastIndex((entry, i) => i < before && entry.status === 'done')

  if (index < 0) return

  return {
    workout: patchEntry(workout, index, { status: 'pending' }, now),
    ...moveTo(bankSpentTime(s, now), index, workout.entries[index].plan.sets - 1, now),
  }
}

export function postpone(s: SessionData, workout: Workout, now = Date.now()) {
  if (s.current === null || workout.entries[s.current].status !== 'pending') return

  return advance(s, patchEntry(workout, s.current, { status: 'postponed' }, now), now)
}

export function resume(s: SessionData, workout: Workout, entryId: string, now = Date.now()) {
  const index = workout.entries.findIndex((e) => e.id === entryId)
  const entry = workout.entries.at(index)

  if (index < 0 || entry?.status !== 'postponed') return

  return {
    workout: patchEntry(workout, index, { status: 'pending' }, now),
    ...moveTo(bankSpentTime(s, now), index, firstUndone(entry), now),
  }
}

export function addExercise(
  s: SessionData,
  workout: Workout,
  added: NewEntry,
  mode: AddMode,
  now = Date.now(),
) {
  if (workout.entries.length >= limits.workoutEntries.max) return

  const entry: WorkoutEntry = { ...added, id: newId(), status: 'pending', sets: [] }
  const spentMs = bankSpentTime(s, now)

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

  // A replaced entry with every set logged counts as done, as the workout page derives it.
  const entries = workout.entries
    .toSpliced(at, 0, entry)
    .map((e, i) =>
      mode === 'replace' && i === s.current
        ? { ...e, status: allLogged(e) ? ('done' as const) : ('skipped' as const) }
        : e,
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
}

export function end(s: SessionData, workout: Workout, now = Date.now()) {
  const ended: Workout = {
    ...workout,
    status: 'done',
    endedAt: ts(now),
    updatedAt: ts(now),
    // Postponed, unfinished and untouched entries all end as skipped, with their sets.
    entries: workout.entries.map((entry) =>
      entry.status === 'done' ? entry : { ...entry, status: 'skipped' },
    ),
  }

  return s.workoutId === null
    ? undefined
    : {
        ...idle,
        workoutId: s.workoutId,
        workout: ended,
        finished: { workoutId: s.workoutId, workout: ended },
      }
}
