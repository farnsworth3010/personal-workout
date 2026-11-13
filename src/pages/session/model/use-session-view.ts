import { useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'

import { findExercise, useCatalog } from '@/entities/exercise'
import { defaultProfile, useProfile } from '@/entities/profile'
import { restRemaining, timedRemaining, useSessionStore } from '@/entities/session'
import { useExerciseStats } from '@/entities/workout'

import { useNow } from './use-now'

// The running session with the values its screen derives from the store, the clock and the profile.
export function useSessionView(uid: string) {
  // Data fields only: the actions are stable and read from getState where they are called.
  const session = useSessionStore(
    useShallow((s) => ({
      workoutId: s.workoutId,
      workout: s.workout,
      current: s.current,
      setIndex: s.setIndex,
      exerciseStartedAt: s.exerciseStartedAt,
      setStartedAt: s.setStartedAt,
      restEndsAt: s.restEndsAt,
      shiftKg: s.shiftKg,
      finished: s.finished,
    })),
  )
  const { workout, current, restEndsAt, finished } = session
  const now = useNow()
  // Undefined until the first answer; the screen runs on the defaults meanwhile.
  const profile = useProfile(uid).profile ?? defaultProfile
  const { data: catalog } = useCatalog()
  const entries = workout?.entries
  const ids = useMemo(() => [...new Set(entries?.map((entry) => entry.exerciseId))], [entries])
  const stats = useExerciseStats(uid, ids)

  const soundsOn = profile.sounds
  // Each clock can be switched off in settings; a timed set's countdown is the exercise, so it stays.
  const { timers } = profile

  const postponedCount = entries?.filter((entry) => entry.status === 'postponed').length ?? 0
  const queueOver = workout !== null && current === null && finished === null

  // The card of the last exercise stays behind the end-of-queue prompt.
  const index = current ?? (entries?.length ?? 1) - 1
  const entry = entries?.[index]
  const exercise = catalog && entry && findExercise(catalog, entry.exerciseId)
  const timed = entry?.kind === 'timed' || entry?.kind === 'cardio'
  const resting = restEndsAt !== null
  const timedLeft = timedRemaining(session.setStartedAt ?? now, entry?.plan.durationSec ?? 0, now)
  const timeUp = timed && !resting && timedLeft === 0
  const restOver = timers.rest && resting && restRemaining(restEndsAt, now) === 0

  return {
    session,
    now,
    profile,
    catalog,
    stats,
    soundsOn,
    timers,
    postponedCount,
    queueOver,
    index,
    entry,
    exercise,
    timed,
    resting,
    timedLeft,
    timeUp,
    restOver,
  }
}
