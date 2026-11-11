import { useEffect } from 'react'

import type { SessionData } from '@/entities/session'
import { saveActiveWorkout } from '@/entities/workout'

type Saved = Pick<SessionData, 'workoutId' | 'workout' | 'finishing'>

// Every change of the document is written without waiting: sets, postponements, additions.
export function useAutosave(uid: string, { workoutId, workout, finishing }: Saved) {
  useEffect(() => {
    if (workoutId && workout && !finishing) saveActiveWorkout(uid, workoutId, workout)
  }, [uid, workoutId, workout, finishing])
}
