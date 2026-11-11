import { Timestamp, type DocumentReference } from 'firebase/firestore'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExerciseStats, Workout } from '@/shared/api'

import {
  discardWorkout,
  finishWorkout,
  newWorkoutId,
  resetProgress,
  saveActiveWorkout,
} from './workout'

const fs = vi.hoisted(() => {
  const batch = { set: vi.fn(), delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) }

  return {
    batch,
    setDoc: vi.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve()),
    deleteDoc: vi.fn<(...args: unknown[]) => Promise<void>>(() => Promise.resolve()),
    getDoc: vi.fn(),
    getDocFromCache: vi.fn(),
    getDocs: vi.fn(),
    writeBatch: vi.fn(() => batch),
  }
})
vi.mock('firebase/firestore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('firebase/firestore')>()),
  setDoc: fs.setDoc,
  deleteDoc: fs.deleteDoc,
  getDoc: fs.getDoc,
  getDocFromCache: fs.getDocFromCache,
  getDocs: fs.getDocs,
  writeBatch: fs.writeBatch,
}))

const uid = 'u1'
const at = (sec: number) => Timestamp.fromMillis(1_700_000_000_000 + sec * 1000)
const flush = () => new Promise((resolve) => setTimeout(resolve))

const workout = (): Workout => ({
  status: 'active',
  startedAt: at(0),
  endedAt: at(1800),
  template: { source: 'own', id: 't1', name: 'Push' },
  entries: [
    {
      exerciseId: 'Bench',
      name: 'Bench',
      kind: 'strength',
      status: 'done',
      plan: { sets: 2, reps: 5, restSec: 90 },
      sets: [
        { n: 2, reps: 5, weightKg: 62.5, at: at(600) },
        { n: 1, reps: 5, weightKg: 60, at: at(300) },
      ],
    },
    {
      exerciseId: 'Plank',
      name: 'Plank',
      kind: 'timed',
      status: 'skipped',
      plan: { sets: 1, durationSec: 60, restSec: 60 },
      sets: [],
    },
  ],
  survey: { energy: 4 },
  summary: null,
  updatedAt: at(600),
})

const paths = (calls: unknown[][]) => calls.map(([ref]) => (ref as DocumentReference).path)

// The profile cache: undefined = not cached, null = known missing, else the stored activeWorkoutId.
// Stats are never cached here, so finishWorkout falls back to getDoc.
function profileCache(activeWorkoutId?: string | null) {
  fs.getDocFromCache.mockImplementation((ref: DocumentReference) =>
    activeWorkoutId === undefined || ref.path !== 'users/u1'
      ? Promise.reject(new Error('not cached'))
      : Promise.resolve({ exists: () => activeWorkoutId !== null, get: () => activeWorkoutId }),
  )
}

describe('workout writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    profileCache()
  })

  it('saves the active workout and merges only activeWorkoutId into the profile', async () => {
    saveActiveWorkout(uid, 'w1', { ...workout(), status: 'done' })
    await flush()

    expect(paths(fs.setDoc.mock.calls)).toEqual(['users/u1/workouts/w1', 'users/u1'])
    expect(fs.setDoc.mock.calls[0]?.[1]).toMatchObject({ status: 'active' })
    const [, profile, options] = fs.setDoc.mock.calls[1]
    expect(Object.keys(profile as object).sort()).toEqual(['activeWorkoutId', 'updatedAt'])
    expect(profile).toMatchObject({ activeWorkoutId: 'w1' })
    expect(options).toEqual({ merge: true })
  })

  it('skips the profile when it already points at the workout or is known to be missing', async () => {
    profileCache('w1')
    saveActiveWorkout(uid, 'w1', workout())
    profileCache(null)
    saveActiveWorkout(uid, 'w1', workout())
    await flush()

    expect(paths(fs.setDoc.mock.calls)).toEqual(['users/u1/workouts/w1', 'users/u1/workouts/w1'])
  })

  it('deletes a discarded workout and clears activeWorkoutId', async () => {
    profileCache('w1')

    discardWorkout(uid, 'w1')
    await flush()

    expect(paths(fs.deleteDoc.mock.calls)).toEqual(['users/u1/workouts/w1'])
    expect(fs.setDoc.mock.calls[0]?.[1]).toMatchObject({ activeWorkoutId: null })
  })

  it('writes the done workout at once, then the stats per exercise with sets in one batch', async () => {
    const previous: ExerciseStats = {
      weightStepKg: 2.5,
      lastSets: [{ reps: 5, weightKg: 57.5 }],
      lastWorkoutId: 'w0',
      lastAt: at(-86_400),
      records: { maxWeightKg: 70, maxVolumeKg: 500 },
    }
    fs.getDoc.mockResolvedValue({ data: () => previous })
    profileCache('w1')

    const call: () => unknown = () => {
      finishWorkout(uid, 'w1', workout(), {
        Bench: { primaryMuscles: ['chest'], secondaryMuscles: ['triceps'] },
      })
    }
    expect(call()).toBeUndefined()
    // Queued synchronously, before any read: an app closed at once keeps the finished workout.
    expect(paths(fs.setDoc.mock.calls)).toEqual(['users/u1/workouts/w1'])
    await flush()

    expect(paths(fs.getDoc.mock.calls)).toEqual(['users/u1/exerciseStats/Bench'])
    expect(paths(fs.batch.set.mock.calls)).toEqual(['users/u1/exerciseStats/Bench'])
    expect(fs.batch.commit).toHaveBeenCalledOnce()

    const done = fs.setDoc.mock.calls[0]?.[1]
    const [[, stats]] = fs.batch.set.mock.calls as [unknown, unknown][]
    expect(done).toMatchObject({
      status: 'done',
      endedAt: at(1800),
      survey: { energy: 4 },
      summary: {
        durationSec: 1800,
        volumeKg: 612.5,
        setsDone: 2,
        muscleSets: { chest: 2, triceps: 1 },
      },
    })
    expect(stats).toMatchObject({
      weightStepKg: 2.5,
      lastSets: [
        { reps: 5, weightKg: 60 },
        { reps: 5, weightKg: 62.5 },
      ],
      lastWorkoutId: 'w1',
      records: { maxWeightKg: 70, maxVolumeKg: 612.5, bestSet: { reps: 5, weightKg: 62.5 } },
    })
    expect(fs.setDoc.mock.calls[1]?.[1]).toMatchObject({ activeWorkoutId: null })
  })

  it('reads previous stats from the cache first', async () => {
    const cached = { data: () => ({ weightStepKg: 5, records: {} }) }
    fs.getDocFromCache.mockImplementation((ref: DocumentReference) =>
      ref.path === 'users/u1/exerciseStats/Bench'
        ? Promise.resolve(cached)
        : Promise.reject(new Error('not cached')),
    )

    finishWorkout(uid, 'w1', workout(), {})
    await flush()

    expect(fs.getDoc).not.toHaveBeenCalled()
    expect(fs.batch.set.mock.calls[0]?.[1]).toMatchObject({ weightStepKg: 5 })
  })

  it('treats stats it cannot read as a first workout with this exercise', async () => {
    fs.getDoc.mockRejectedValue(new Error('offline, not cached'))

    finishWorkout(uid, 'w1', workout(), {})
    await flush()

    const [, stats] = fs.batch.set.mock.calls[0] as [unknown, ExerciseStats]
    expect(stats.weightStepKg).toBeNull()
    expect(stats.records).toEqual({
      maxWeightKg: 62.5,
      maxVolumeKg: 612.5,
      bestSet: { reps: 5, weightKg: 62.5, e1rmKg: 72.92 },
    })
  })

  it('resets progress: deletes workouts, stats and templates in batches of 500, empties the schedule', async () => {
    const docs = (collection: string, n: number) => ({
      docs: Array.from({ length: n }, (_, i) => ({
        ref: { withConverter: () => ({ path: `users/u1/${collection}/${String(i)}` }) },
      })),
    })
    fs.getDocs.mockImplementation((ref: { path: string }) =>
      Promise.resolve(
        ref.path.endsWith('workouts')
          ? docs('workouts', 498)
          : docs(ref.path.split('/')[2] ?? '', 5),
      ),
    )
    profileCache('w1')

    resetProgress(uid)
    await flush()

    expect(fs.getDocs.mock.calls.map(([ref]) => (ref as { path: string }).path)).toEqual([
      'users/u1/workouts',
      'users/u1/exerciseStats',
      'users/u1/templates',
    ])
    expect(fs.batch.delete).toHaveBeenCalledTimes(508)
    expect(fs.batch.commit).toHaveBeenCalledTimes(2)
    expect(fs.writeBatch).toHaveBeenCalledTimes(2)
    expect(paths(fs.setDoc.mock.calls)).toEqual(['users/u1'])
    expect(fs.setDoc.mock.calls[0]?.[1]).toMatchObject({
      activeWorkoutId: null,
      schedule: { mon: [], sun: [] },
    })
  })

  it('generates workout ids without crypto.randomUUID', () => {
    expect(newWorkoutId(uid)).toMatch(/^[A-Za-z0-9]{20}$/)
  })
})
