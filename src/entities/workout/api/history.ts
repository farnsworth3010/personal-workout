import { limit, orderBy, query, Timestamp, where } from 'firebase/firestore'
import { useMemo } from 'react'

import { querySource, useSnapshotQuery, workoutsRef, type WithId, type Workout } from '@/shared/api'

export interface HistoryRange {
  from: Date
  // Exclusive, so consecutive weeks or months never share a workout.
  to: Date
}

export const workoutHistoryQueryKey = (uid: string, { from, to }: HistoryRange) =>
  ['workouts', uid, from.getTime(), to.getTime()] as const

// A range on startedAt alone needs no composite index; the active workout is dropped here.
export const historyQuery = (uid: string, { from, to }: HistoryRange) =>
  query(
    workoutsRef(uid),
    where('startedAt', '>=', Timestamp.fromDate(from)),
    where('startedAt', '<', Timestamp.fromDate(to)),
    orderBy('startedAt', 'desc'),
  )

// Finished workouts started in [from, to), newest first.
export function useWorkoutHistory(uid: string, range: HistoryRange): WithId<Workout>[] | undefined {
  const { data } = useSnapshotQuery(
    workoutHistoryQueryKey(uid, range),
    querySource(historyQuery(uid, range)),
  )

  return useMemo(() => data?.filter((workout) => workout.status === 'done'), [data])
}

const RECENT = 30

const recentWorkoutsQueryKey = (uid: string) => ['workouts', uid, 'recent'] as const

// The body weight of the newest finished workout that recorded one.
export function lastBodyWeight(workouts: readonly Workout[]): { kg: number; date: Date } | null {
  const workout = workouts.find((w) => w.status === 'done' && w.survey.bodyWeightKg !== undefined)
  const kg = workout?.survey.bodyWeightKg

  return workout && kg !== undefined ? { kg, date: workout.startedAt.toDate() } : null
}

// shortcut: looks at the last 30 workouts only (no composite index); query survey.bodyWeightKg
// with an index if an older weight should still count.
export function useLastBodyWeight(uid: string): { kg: number; date: Date } | null | undefined {
  const { data } = useSnapshotQuery(
    recentWorkoutsQueryKey(uid),
    querySource(query(workoutsRef(uid), orderBy('startedAt', 'desc'), limit(RECENT))),
  )

  return useMemo(() => data && lastBodyWeight(data), [data])
}
