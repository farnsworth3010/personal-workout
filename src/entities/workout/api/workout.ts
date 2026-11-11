import {
  deleteDoc,
  getDoc,
  getDocFromCache,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from 'firebase/firestore'
import { useMemo } from 'react'

import {
  db,
  docSource,
  exerciseStatRef,
  exerciseStatsRef,
  fireWrite,
  profileRef,
  querySource,
  templatesRef,
  useSnapshotQuery,
  workoutRef,
  workoutsRef,
  type ExerciseStats,
  type Workout,
} from '@/shared/api'

import type { MuscleFacts } from '../model/summary'
import { exerciseStatsAfter, finishedWorkout } from './documents'

const workoutQueryKey = (uid: string, workoutId: string) => ['workout', uid, workoutId] as const

const activeWorkoutQueryKey = (uid: string) => ['workout', uid, 'active'] as const

const exerciseStatsQueryKey = (uid: string) => ['exerciseStats', uid] as const

// Called after every logged set.
export function saveActiveWorkout(uid: string, workoutId: string, workout: Workout): void {
  fireWrite(() => setDoc(workoutRef(uid, workoutId), { ...workout, status: 'active' }), 'workout')
}

export function discardWorkout(uid: string, workoutId: string): void {
  fireWrite(() => deleteDoc(workoutRef(uid, workoutId)), 'workout')
}

// From the cache (the session listens to stats), else the server. Offline with no copy counts as a first
// workout with the exercise; any other failure (rules, a document the converter rejects) rejects, so the
// caller skips that exercise instead of resetting its records.
async function previousStats(uid: string, exerciseId: string): Promise<ExerciseStats | undefined> {
  const ref = exerciseStatRef(uid, exerciseId)

  try {
    return (await getDocFromCache(ref)).data()
  } catch {
    // Not cached, or the cached copy is invalid: the server decides.
  }

  try {
    return (await getDoc(ref)).data()
  } catch (error) {
    // By code: SDK errors are not reliably instances of the exported FirestoreError class.
    if ((error as { code?: unknown } | null)?.code === 'unavailable') return undefined

    throw error
  }
}

// The workout is queued at once: Firestore persists a write a few ms after the call, and an app closed
// right after finishing must not lose it to the stats reads. Stats (a rebuildable cache) follow in a batch.
export function finishWorkout(
  uid: string,
  workoutId: string,
  workout: Workout,
  exercises: Readonly<Record<string, MuscleFacts | undefined>>,
): void {
  const now = Timestamp.now()

  fireWrite(
    () => setDoc(workoutRef(uid, workoutId), finishedWorkout(workout, exercises, now)),
    'finish',
  )
  fireWrite(async () => {
    const ids = [...new Set(workout.entries.filter((e) => e.sets.length).map((e) => e.exerciseId))]
    const results = await Promise.allSettled(ids.map((id) => previousStats(uid, id)))
    const known = new Map(
      ids.flatMap((id, i) => {
        const result = results[i]

        return result.status === 'fulfilled' ? [[id, result.value] as const] : []
      }),
    )
    const stats = exerciseStatsAfter(workoutId, workout, Object.fromEntries(known), now)

    const batch = writeBatch(db)
    for (const [id, doc] of Object.entries(stats))
      if (known.has(id)) batch.set(exerciseStatRef(uid, id), doc)

    await batch.commit()

    const failed = results.find((result) => result.status === 'rejected')
    if (failed) throw failed.reason
  }, 'stats')
}

const BATCH_LIMIT = 500

const emptySchedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] }

// «Сбросить прогресс»: deletes every workout, exerciseStats and own template document, empties the
// schedule and clears activeWorkoutId; the rest of the profile stays. Offline it deletes what the cache knows.
export function resetProgress(uid: string): void {
  fireWrite(async () => {
    const snapshots = await Promise.all([
      getDocs(workoutsRef(uid)),
      getDocs(exerciseStatsRef(uid)),
      getDocs(templatesRef(uid)),
    ])
    const refs = snapshots.flatMap((snapshot) =>
      snapshot.docs.map((d) => d.ref.withConverter(null)),
    )
    const commits: Promise<void>[] = []

    for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db)
      for (const ref of refs.slice(i, i + BATCH_LIMIT)) batch.delete(ref)
      commits.push(batch.commit())
    }

    await Promise.all(commits)
  }, 'reset')
  fireWrite(async () => {
    const ref = profileRef(uid)
    const cached = await getDocFromCache(ref).catch(() => undefined)

    if (cached && !cached.exists()) return

    await setDoc(
      ref,
      { activeWorkoutId: null, schedule: emptySchedule, updatedAt: Timestamp.now() },
      { merge: true },
    )
  }, 'reset')
}

export function useWorkout(uid: string, workoutId: string): Workout | null | undefined {
  return useSnapshotQuery(workoutQueryKey(uid, workoutId), docSource(workoutRef(uid, workoutId)))
    .data
}

// The server copy of a running workout, found by status (profile.activeWorkoutId is no longer written).
export function useActiveWorkout(uid: string): (Workout & { id: string }) | null | undefined {
  const { data } = useSnapshotQuery(
    activeWorkoutQueryKey(uid),
    querySource(query(workoutsRef(uid), where('status', '==', 'active'))),
  )

  return useMemo(
    () =>
      data && (data.toSorted((a, b) => b.startedAt.toMillis() - a.startedAt.toMillis())[0] ?? null),
    [data],
  )
}

// One listener on the whole collection: one document per exercise ever done, read from cache offline.
export function useExerciseStats(
  uid: string,
  exerciseIds: readonly string[],
): Record<string, ExerciseStats | undefined> | undefined {
  const { data } = useSnapshotQuery(exerciseStatsQueryKey(uid), querySource(exerciseStatsRef(uid)))
  const key = exerciseIds.join('\n')

  return useMemo(() => {
    if (!data) return undefined

    const byId = new Map(data.map((stats) => [stats.id, stats]))

    return Object.fromEntries((key ? key.split('\n') : []).map((id) => [id, byId.get(id)]))
  }, [data, key])
}
