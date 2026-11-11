import {
  deleteDoc,
  doc,
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

// Firestore's auto-id: crypto.randomUUID() is missing on plain-http origins such as dev:remote.
export const newWorkoutId = (uid: string) => doc(workoutsRef(uid)).id

export const workoutQueryKey = (uid: string, workoutId: string) =>
  ['workout', uid, workoutId] as const

export const activeWorkoutQueryKey = (uid: string) => ['workout', uid, 'active'] as const

export const exerciseStatsQueryKey = (uid: string) => ['exerciseStats', uid] as const

// A merge writes only these keys, so the rest of the profile is never overwritten. A profile the
// cache knows is missing is skipped: the merge would create a half-empty one that the rules reject.
function pointProfileAt(uid: string, workoutId: string | null) {
  fireWrite(async () => {
    const ref = profileRef(uid)
    const cached = await getDocFromCache(ref).catch(() => undefined)

    if (cached && (!cached.exists() || cached.get('activeWorkoutId') === workoutId)) return

    await setDoc(ref, { activeWorkoutId: workoutId, updatedAt: Timestamp.now() }, { merge: true })
  })
}

// Called after every logged set; the profile is written only when it points elsewhere.
export function saveActiveWorkout(uid: string, workoutId: string, workout: Workout): void {
  fireWrite(() => setDoc(workoutRef(uid, workoutId), { ...workout, status: 'active' }))
  pointProfileAt(uid, workoutId)
}

export function discardWorkout(uid: string, workoutId: string): void {
  fireWrite(() => deleteDoc(workoutRef(uid, workoutId)))
  pointProfileAt(uid, null)
}

// shortcut: previous stats come from the cache (the session listens to them), else the server; an
// exercise whose stats were never cached on this device counts as new offline.
function previousStats(uid: string, exerciseId: string) {
  const ref = exerciseStatRef(uid, exerciseId)

  return getDocFromCache(ref)
    .catch(() => getDoc(ref))
    .then(
      (snapshot) => snapshot.data(),
      () => undefined,
    )
}

// The workout is queued at once: Firestore persists a write a few ms after the call, and an app closed
// right after finishing must not lose it to the stats reads. Stats (a rebuildable cache) follow in a batch;
// the profile apart, so a missing profile cannot fail either.
export function finishWorkout(
  uid: string,
  workoutId: string,
  workout: Workout,
  exercises: Readonly<Record<string, MuscleFacts | undefined>>,
): void {
  const now = Timestamp.now()

  fireWrite(() => setDoc(workoutRef(uid, workoutId), finishedWorkout(workout, exercises, now)))
  fireWrite(async () => {
    const ids = [...new Set(workout.entries.filter((e) => e.sets.length).map((e) => e.exerciseId))]
    const previous = await Promise.all(ids.map((id) => previousStats(uid, id)))
    const stats = exerciseStatsAfter(
      workoutId,
      workout,
      Object.fromEntries(ids.map((id, i) => [id, previous[i]])),
      now,
    )

    const batch = writeBatch(db)
    for (const [id, doc] of Object.entries(stats)) batch.set(exerciseStatRef(uid, id), doc)

    await batch.commit()
  })
  pointProfileAt(uid, null)
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
  })
  fireWrite(async () => {
    const ref = profileRef(uid)
    const cached = await getDocFromCache(ref).catch(() => undefined)

    if (cached && !cached.exists()) return

    await setDoc(
      ref,
      { activeWorkoutId: null, schedule: emptySchedule, updatedAt: Timestamp.now() },
      { merge: true },
    )
  })
}

export function useWorkout(uid: string, workoutId: string): Workout | null | undefined {
  return useSnapshotQuery(workoutQueryKey(uid, workoutId), docSource(workoutRef(uid, workoutId)))
    .data
}

// Found by status, not through profile.activeWorkoutId, so a lost profile write cannot hide it.
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
