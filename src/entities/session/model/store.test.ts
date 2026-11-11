import { Timestamp } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { workoutSchema } from '@/shared/api'

import { restRemaining } from './timers'

// Node has no localStorage; the store reads it when it is created.
vi.hoisted(() => {
  const items = new Map<string, string>()

  globalThis.localStorage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, value),
    removeItem: (key) => items.delete(key),
    clear: () => items.clear(),
    key: () => null,
    length: 0,
  }
})

const { selectActive, selectFinishing, useSessionStore } = await import('./store')

const t0 = 1_700_000_000_000
const at = (sec: number) => t0 + sec * 1000

const entry = (exerciseId: string, sets = 2) => ({
  exerciseId,
  name: exerciseId,
  kind: 'strength' as const,
  plan: { sets, reps: 10, restSec: 90 },
})

const template = { source: 'own' as const, id: 't1', name: 'Push' }

const store = () => useSessionStore.getState()
const statuses = () => store().workout?.entries.map((e) => e.status)
const idOf = (i: number) => store().workout?.entries[i]?.id ?? ''
const logged = (i: number) => store().workout?.entries[i]?.sets.map((s) => s.weightKg ?? s.reps)

// Logs the current set and continues past the rest.
const doSet = (weightKg: number, sec: number) => {
  store().completeSet({ reps: 10, weightKg }, at(sec))
  store().next(at(sec + 1))
}

beforeEach(() => {
  store().discard()
  store().start(template, [entry('A'), entry('B'), entry('C')], t0)
})

describe('start', () => {
  it('builds a valid active workout document on the first exercise', () => {
    expect(workoutSchema.safeParse(store().workout).success).toBe(true)
    expect(store().workoutId).toMatch(/^[\w-]{20}$/)
    expect(store()).toMatchObject({ current: 0, setIndex: 0, restEndsAt: null })
    expect(statuses()).toEqual(['pending', 'pending', 'pending'])
    expect(store().workout?.startedAt.toMillis()).toBe(t0)
  })

  it('works without crypto.randomUUID, as on a plain http origin', () => {
    vi.spyOn(crypto, 'randomUUID').mockImplementation(() => {
      throw new Error('insecure context')
    })

    store().discard()
    store().start(template, [entry('A')], t0)

    expect(store().workoutId).toMatch(/^[\w-]{20}$/)
    vi.restoreAllMocks()
  })

  it('refuses while a workout runs, keeping it', () => {
    const before = store()

    expect(store().start(template, [entry('X')], at(10))).toBe(false)
    expect(store()).toBe(before)
  })

  it('refuses while an ended workout waits on the finish screen', () => {
    doSet(60, 0)
    store().end(at(600))

    const finishing = selectFinishing(store())

    expect(store().start(template, [entry('X')], at(700))).toBe(false)
    expect(selectFinishing(store())).toBe(finishing)
    expect(finishing?.workout.entries[0]?.sets).toHaveLength(1)
  })

  it('refuses a workout without entries', () => {
    store().discard()

    expect(store().start(template, [], t0)).toBe(false)
    expect(store().workout).toBeNull()
    expect(store().start(template, [entry('A')], t0)).toBe(true)
  })
})

describe('entry ids', () => {
  it('keeps template entry ids and lets one exercise appear twice, each entry on its own', () => {
    store().discard()
    store().start(
      template,
      [{ ...entry('Bench'), id: 'warm-up' }, entry('A'), { ...entry('Bench'), id: 'work' }],
      t0,
    )

    expect(store().workout?.entries.map((e) => [e.id, e.exerciseId])).toEqual([
      ['warm-up', 'Bench'],
      [idOf(1), 'A'],
      ['work', 'Bench'],
    ])
    expect(idOf(1)).toMatch(/^[\w-]{20}$/)

    // A weight change on the warm-up shifts only the warm-up's next predictions.
    store().completeSet({ reps: 10, weightKg: 40 }, at(10))
    store().editSet({ reps: 10, weightKg: 45 }, at(12))
    expect(store().shiftKg).toEqual({ 'warm-up': 5 })

    store().next(at(100))
    store().postpone(at(110))
    doSet(60, 120)
    doSet(60, 130)
    store().resume('warm-up', at(140))

    expect(store()).toMatchObject({ current: 0, setIndex: 1 })
    expect(logged(0)).toEqual([45])
    expect(logged(2)).toEqual([])
  })

  it('gives repeated or missing ids a new one, and quick-added entries always a new one', () => {
    store().discard()
    store().start(
      template,
      [
        { ...entry('A'), id: 'x' },
        { ...entry('B'), id: 'x' },
      ],
      t0,
    )
    store().addExercise({ ...entry('A'), id: 'x' }, 'next', at(5))

    const ids = store().workout?.entries.map((e) => e.id) ?? []

    expect(ids[0]).toBe('x')
    expect(new Set(ids).size).toBe(3)
  })
})

describe('restore', () => {
  const serverDoc = () => {
    doSet(60, 0)
    doSet(60, 10)
    store().completeSet({ reps: 10, weightKg: 70 }, at(20))
    store().postpone(at(25))

    const { workoutId, workout } = store()

    store().discard()
    if (!workoutId || !workout) throw new Error('no workout')

    return { workoutId, workout }
  }

  it('continues a server workout on the first pending entry and its first undone set', () => {
    const { workoutId, workout } = serverDoc()

    expect(store().restore(workoutId, workout, at(1000))).toBe(true)
    expect(store()).toMatchObject({
      workoutId,
      current: 2,
      setIndex: 0,
      restEndsAt: null,
      exerciseStartedAt: at(1000),
      finishing: false,
    })
    expect(statuses()).toEqual(['done', 'postponed', 'pending'])
    expect(selectActive(store())).toBe(true)
  })

  it('lands at the end of the queue when nothing is pending, so it can be ended', () => {
    const { workoutId, workout } = serverDoc()
    const done = {
      ...workout,
      entries: workout.entries.map((e) =>
        e.status === 'pending' ? { ...e, status: 'done' as const } : e,
      ),
    }

    store().restore(workoutId, done, at(1000))
    store().end(at(1100))

    expect(selectFinishing(store())?.workout.entries.map((e) => e.status)).toEqual([
      'done',
      'skipped',
      'done',
    ])
  })

  it('refuses unless idle, and refuses a finished document', () => {
    const { workoutId, workout } = serverDoc()

    store().start(template, [entry('X')], t0)
    const before = store()

    expect(store().restore(workoutId, workout, at(1000))).toBe(false)
    expect(store()).toBe(before)

    store().discard()
    expect(store().restore(workoutId, { ...workout, status: 'done' }, at(1000))).toBe(false)
    expect(store().workout).toBeNull()
  })
})

describe('sets', () => {
  it('logs a set and starts the planned rest', () => {
    store().completeSet({ reps: 10, weightKg: 60 }, at(30))

    expect(store().workout?.entries[0]?.sets).toEqual([
      { n: 1, reps: 10, weightKg: 60, at: Timestamp.fromMillis(at(30)) },
    ])
    expect(restRemaining(store().restEndsAt, at(30))).toBe(90)
    expect(store().workout?.updatedAt.toMillis()).toBe(at(30))
  })

  it('moves to the next set after the rest', () => {
    doSet(60, 30)

    expect(store()).toMatchObject({
      current: 0,
      setIndex: 1,
      restEndsAt: null,
      setStartedAt: at(31),
    })
  })

  it('corrects the logged set and shifts the next predictions by the weight change', () => {
    store().completeSet({ reps: 10, weightKg: 60 }, at(30))
    store().editSet({ reps: 8, weightKg: 65 }, at(35))
    store().editSet({ reps: 8, weightKg: 62.5 }, at(36))

    expect(store().workout?.entries[0]?.sets[0]).toMatchObject({ n: 1, reps: 8, weightKg: 62.5 })
    expect(store().shiftKg).toEqual({ [idOf(0)]: 2.5 })
  })

  it('marks the exercise done on its last set and moves to the next pending one', () => {
    doSet(60, 30)
    store().completeSet({ reps: 10, weightKg: 60 }, at(150))

    expect(statuses()).toEqual(['done', 'pending', 'pending'])

    store().next(at(200))

    expect(store()).toMatchObject({ current: 1, setIndex: 0, exerciseStartedAt: at(200) })
  })

  it('ends the queue after the last exercise', () => {
    for (let i = 0; i < 6; i++) doSet(60, i * 10)

    expect(statuses()).toEqual(['done', 'done', 'done'])
    expect(store()).toMatchObject({ current: null, exerciseStartedAt: null })
  })
})

describe('back', () => {
  it('during rest returns to the set just logged, keeping it', () => {
    doSet(60, 30)
    store().completeSet({ reps: 10, weightKg: 60 }, at(150))
    store().back(at(160))

    expect(store()).toMatchObject({ current: 0, setIndex: 1, restEndsAt: null })
    expect(statuses()?.[0]).toBe('pending')
    expect(logged(0)).toEqual([60, 60])
  })

  it('in work goes to the previous set, and redoing it replaces its result', () => {
    doSet(60, 30)
    store().back(at(40))

    expect(store().setIndex).toBe(0)

    store().completeSet({ reps: 10, weightKg: 70 }, at(50))
    store().next(at(60))

    expect(logged(0)).toEqual([70])
    expect(store().setIndex).toBe(1)
  })

  it('on the first set reopens the previous finished exercise on its last set', () => {
    doSet(60, 0)
    doSet(60, 10)
    store().back(at(100))

    expect(store()).toMatchObject({ current: 0, setIndex: 1 })
    expect(statuses()).toEqual(['pending', 'pending', 'pending'])
    expect(logged(0)).toEqual([60, 60])
  })

  it('continues the clock of an exercise it returns to', () => {
    doSet(60, 0)
    doSet(60, 10)
    store().back(at(100))

    expect(store().exerciseStartedAt).toBe(at(100) - 11_000)
  })

  it('does nothing on the very first set', () => {
    const before = store()

    store().back(at(5))

    expect(store()).toBe(before)
  })
})

describe('postpone and resume', () => {
  it('postpones with logged sets kept and starts the next exercise', () => {
    doSet(60, 0)
    store().postpone(at(20))

    expect(statuses()).toEqual(['postponed', 'pending', 'pending'])
    expect(logged(0)).toEqual([60])
    expect(store()).toMatchObject({ current: 1, setIndex: 0 })
  })

  it('resumes from the first set not yet done', () => {
    doSet(60, 0)
    store().postpone(at(20))
    store().resume(idOf(0), at(30))

    expect(statuses()).toEqual(['pending', 'pending', 'pending'])
    expect(store()).toMatchObject({ current: 0, setIndex: 1, exerciseStartedAt: at(30) - 20_000 })
  })

  it('ends the queue with postponed exercises left, which can still be resumed', () => {
    store().postpone(at(1))
    doSet(60, 10)
    doSet(60, 20)
    doSet(60, 30)
    doSet(60, 40)

    expect(store().current).toBeNull()
    expect(statuses()).toEqual(['postponed', 'done', 'done'])

    store().resume(idOf(0), at(50))

    expect(store()).toMatchObject({ current: 0, setIndex: 0 })
  })

  it('ignores resume of an entry that is not postponed', () => {
    const before = store()

    store().resume(idOf(1), at(5))

    expect(store()).toBe(before)
  })
})

describe('addExercise', () => {
  const ids = () => store().workout?.entries.map((e) => e.exerciseId)

  it('now: inserts after the current one and starts it; the interrupted one comes back after', () => {
    doSet(60, 0)
    store().addExercise(entry('X', 1), 'now', at(20))

    expect(ids()).toEqual(['A', 'X', 'B', 'C'])
    expect(store()).toMatchObject({ current: 1, setIndex: 0 })

    doSet(50, 30)

    expect(store()).toMatchObject({ current: 0, setIndex: 1 })
  })

  it('next: inserts after the current one without leaving it', () => {
    store().addExercise(entry('X'), 'next', at(20))

    expect(ids()).toEqual(['A', 'X', 'B', 'C'])
    expect(store().current).toBe(0)
    expect(store().spentMs).toEqual([0, 0, 0, 0])
  })

  it('replace: swaps an untouched current exercise', () => {
    store().addExercise(entry('X'), 'replace', at(20))

    expect(ids()).toEqual(['X', 'B', 'C'])
    expect(store()).toMatchObject({ current: 0, exerciseStartedAt: at(20) })
  })

  it('replace: keeps a fully logged exercise as done', () => {
    doSet(60, 0)
    store().completeSet({ reps: 10, weightKg: 60 }, at(10))
    store().back(at(12))
    store().addExercise(entry('X'), 'replace', at(20))

    expect(ids()).toEqual(['A', 'X', 'B', 'C'])
    expect(statuses()).toEqual(['done', 'pending', 'pending', 'pending'])
  })

  it('replace: keeps a started exercise as skipped', () => {
    doSet(60, 0)
    store().addExercise(entry('X'), 'replace', at(20))

    expect(ids()).toEqual(['A', 'X', 'B', 'C'])
    expect(statuses()).toEqual(['skipped', 'pending', 'pending', 'pending'])
    expect(store().current).toBe(1)
  })

  it('at the end of the queue appends and starts it', () => {
    for (let i = 0; i < 6; i++) doSet(60, i * 10)
    store().addExercise(entry('X'), 'next', at(100))

    expect(ids()).toEqual(['A', 'B', 'C', 'X'])
    expect(store().current).toBe(3)
  })

  it('stops at 60 entries', () => {
    for (let i = 0; i < 60; i++) store().addExercise(entry(`X${i}`), 'next', at(i))

    expect(store().workout?.entries).toHaveLength(60)
  })
})

describe('end, finish and discard', () => {
  it('ends the workout for the finish screen with unfinished entries skipped', () => {
    doSet(60, 0)
    doSet(60, 10)
    doSet(60, 20)
    store().postpone(at(30))

    const { workoutId } = store()

    store().end(at(600))

    const finishing = selectFinishing(store())

    expect(selectActive(store())).toBe(false)
    expect(finishing?.workoutId).toBe(workoutId)
    expect(finishing?.workout).toMatchObject({ status: 'done', summary: null })
    expect(finishing?.workout.endedAt?.toMillis()).toBe(at(600))
    expect(finishing?.workout.entries.map((e) => e.status)).toEqual(['done', 'skipped', 'skipped'])
    expect(finishing?.workout.entries[1]?.sets).toHaveLength(1)
    expect(selectFinishing(store())).toBe(finishing)
  })

  it('ignores session actions while finishing', () => {
    store().end(at(600))

    const before = store()

    store().completeSet({ reps: 10 }, at(601))
    store().back(at(602))

    expect(store()).toBe(before)
  })

  it('finishes with the survey and clears the session', () => {
    doSet(60, 0)
    store().end(at(600))

    const result = store().finish({ wellbeing: 4 })

    expect(result?.workout.survey).toEqual({ wellbeing: 4 })
    expect(workoutSchema.safeParse(result?.workout).success).toBe(true)
    expect(store().workout).toBeNull()
    expect(selectFinishing(store())).toBeNull()
  })

  it('does not finish a running session that has not ended', () => {
    expect(store().finish({})).toBeNull()
    expect(selectActive(store())).toBe(true)
  })

  it('discards the session', () => {
    store().discard()

    expect(store()).toMatchObject({ workoutId: null, workout: null, current: null })
    expect(selectActive(store())).toBe(false)
  })
})

describe('persistence', () => {
  it('restores a session in the middle of a rest with real Timestamps', async () => {
    doSet(60, 0)
    store().completeSet({ reps: 8, weightKg: 62.5 }, at(100))
    store().editSet({ reps: 8, weightKg: 65 }, at(105))

    const saved = store()

    vi.resetModules()
    const reloaded = (await import('./store')).useSessionStore.getState()

    expect(reloaded).not.toBe(saved)
    expect(reloaded).toMatchObject({
      workoutId: saved.workoutId,
      current: 0,
      setIndex: 1,
      restEndsAt: saved.restEndsAt,
      shiftKg: { [idOf(0)]: 2.5 },
    })
    expect(reloaded.workout).toEqual(saved.workout)
    expect(reloaded.workout?.entries[0]?.sets[1]?.at).toBeInstanceOf(Timestamp)
    expect(workoutSchema.safeParse(reloaded.workout).success).toBe(true)
    expect(restRemaining(reloaded.restEndsAt, at(160))).toBe(30)
  })
  it('gives a version 2 session entry ids and moves the weight shift from exercise to entry', async () => {
    store().completeSet({ reps: 10, weightKg: 60 }, at(10))
    store().editSet({ reps: 10, weightKg: 65 }, at(12))

    const { workout } = store()
    const v2 = {
      ...store(),
      workout: workout && {
        ...workout,
        entries: workout.entries.map((e) =>
          Object.fromEntries(Object.entries(e).filter(([k]) => k !== 'id')),
        ),
      },
      shiftKg: { A: 5 },
    }

    localStorage.setItem('personal-workout:session', JSON.stringify({ state: v2, version: 2 }))
    vi.resetModules()
    const reloaded = (await import('./store')).useSessionStore.getState()

    expect(reloaded.workout?.entries.map((e) => e.id)).toEqual(['e0', 'e1', 'e2'])
    expect(reloaded.shiftKg).toEqual({ e0: 5 })
    expect(reloaded.workout?.entries[0]?.sets).toHaveLength(1)
  })

  it('rebuilds the waiting finished workout from a version 1 store', async () => {
    doSet(60, 0)
    store().end(at(600))

    const { workoutId, workout } = store()
    const v1 = { ...store(), finished: undefined }

    localStorage.setItem('personal-workout:session', JSON.stringify({ state: v1, version: 1 }))
    vi.resetModules()
    const reloaded = (await import('./store')).useSessionStore.getState()

    expect(reloaded.finished?.workoutId).toBe(workoutId)
    expect(reloaded.finished?.workout).toEqual(workout)
  })
})
