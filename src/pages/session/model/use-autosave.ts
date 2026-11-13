import { useEffect } from 'react'

import type { SessionData } from '@/entities/session'
import { saveActiveWorkout } from '@/entities/workout'

type Saved = Pick<SessionData, 'workoutId' | 'workout' | 'finished'>

// Every change of the document is written without waiting: sets, postponements, additions.
export function useAutosave(uid: string, { workoutId, workout, finished }: Saved) {
  useEffect(() => {
    // The ended workout is written by the finish screen, with its survey.
    if (workoutId && workout && !finished) saveActiveWorkout(uid, workoutId, workout)
  }, [uid, workoutId, workout, finished])
}
