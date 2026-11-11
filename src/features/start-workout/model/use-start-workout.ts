import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useSessionStore, type NewEntry } from '@/entities/session'
import type { Workout } from '@/shared/api'
import { unlockAudio } from '@/shared/lib'
import { toast } from '@/shared/ui'

// The one way to start a workout: pair `blocked` with <RunningWorkoutSheet>.
export function useStartWorkout() {
  const navigate = useNavigate()
  const [blocked, setBlocked] = useState(false)

  const start = (template: Workout['template'], entries: NewEntry[]) => {
    // A running or unsaved workout is never replaced silently: the person continues or finishes it.
    if (useSessionStore.getState().workout) {
      setBlocked(true)
      return
    }

    // In the tap itself: the first signal of the session would be silent otherwise (research R5).
    unlockAudio()

    if (useSessionStore.getState().start(template, entries)) void navigate('/session')
    else toast('В наборе нет упражнений')
  }

  return { start, blocked, setBlocked }
}
